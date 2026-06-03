import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { EXERCISES } from '@/lib/exercises'

const SINAS_URL = process.env.SINAS_URL
const SINAS_TOKEN = process.env.SINAS_TOKEN
const USE_SINAS = !!(SINAS_URL && SINAS_TOKEN)

export async function POST(req: NextRequest) {
  try {
    const { checkin, history, userGoal } = await req.json()

    // ── Sinas agent path ──
    if (USE_SINAS) {
      const baseUrl = 'https://via-11.sinas.wearebrain.com:51245'
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SINAS_TOKEN}`,
      }

      // Use a fixed chat session (pre-created in Sinas dashboard)
      const chatId = process.env.SINAS_CHAT_ID ?? 'fce364f3-447a-4cff-8f35-6c8b3aef270b'

      // Step 2: Send message and collect streamed response
      const msgRes = await fetch(`https://via-11.sinas.wearebrain.com/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: JSON.stringify({ checkin, history, userGoal, durationMin: checkin.durationMin, yesterdayActivity: checkin.yesterdayActivity }),
        }),
      })
      if (!msgRes.ok) throw new Error(`Sinas message error: ${await msgRes.text()}`)

      // Collect streamed text
      const text = await msgRes.text()
      // Extract JSON from streamed response (last data: line with content)
      const lines = text.split('\n').filter((l) => l.startsWith('data:'))
      let fullContent = ''
      for (const line of lines) {
        try {
          const json = JSON.parse(line.replace('data:', '').trim())
          if (json.content) fullContent += json.content
          if (json.text) fullContent += json.text
          if (json.delta?.text) fullContent += json.delta.text
        } catch {}
      }

      const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in Sinas response')
      return NextResponse.json(JSON.parse(jsonMatch[0]))
    }

    // ── Direct Claude path ──
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const exerciseList = EXERCISES.map(
      (e) =>
        `- id: "${e.id}" | name: "${e.name}" | muscles: ${e.muscleGroups.join(', ')} | equipment: ${e.equipment} | injuryRisk: ${e.injuryRisk.join(', ') || 'none'} | alternatives: ${e.alternatives.join(', ')}`
    ).join('\n')

    const historyText =
      history.length > 0
        ? history
            .slice(0, 5)
            .map(
              (w: { date: string; name: string; muscleGroups: string[]; injuries: string[]; exercises: { exerciseId: string; maxWeightKg: number }[] }) =>
                `${w.date.split('T')[0]}: ${w.name} | muscles: ${w.muscleGroups.join(', ')} | injuries: ${w.injuries.join(', ') || 'none'}\n  exercises: ${w.exercises.map((e) => `${e.exerciseId}@${e.maxWeightKg}kg`).join(', ')}`
            )
            .join('\n')
        : 'No previous workouts'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a professional personal trainer AI. Generate a workout plan as valid JSON only — no markdown, no code blocks, no explanation text. Return ONLY the raw JSON object.

Available exercises:
${exerciseList}

Rules:
1. Energy 4-5 → heavy (4-6 reps). Energy 3 → moderate (8-10 reps). Energy 1-2 → light (12-15 reps).
2. Soreness ≥ 2 → avoid that muscle group.
3. Injuries → substitute affected exercises, explain why.
4. Avoid same muscle group within 48 hours.
5. Progressive overload: if same exercise 3+ times at same weight, suggest +2.5kg.
6. Select 4-5 exercises, 3-4 sets each.

Return ONLY:
{
  "workoutName": "string",
  "reasoning": "string",
  "exercises": [{"exerciseId": "string", "sets": number, "reps": number, "suggestedWeightKg": number, "lastWeightKg": number|null, "substituteReason": "string or omit"}]
}`,
      messages: [
        {
          role: 'user',
          content: `Generate a workout.\nEnergy: ${checkin.energy}/5\nSleep: ${checkin.sleep}/5\nSoreness: upper=${checkin.soreness.upper}, lower=${checkin.soreness.lower}, core=${checkin.soreness.core}\nInjuries: ${checkin.injuries.join(', ') || 'none'}\nGoal: ${userGoal}\n\nHistory:\n${historyText}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return NextResponse.json(JSON.parse(raw))
  } catch (err) {
    console.error('generate-workout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
