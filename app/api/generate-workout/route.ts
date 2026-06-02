import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { EXERCISES } from '@/lib/exercises'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { checkin, history, userGoal } = await req.json()

    const exerciseList = EXERCISES.map(
      (e) =>
        `- id: "${e.id}" | name: "${e.name}" | muscles: ${e.muscleGroups.join(', ')} | equipment: ${e.equipment} | injuryRisk: ${e.injuryRisk.join(', ') || 'none'} | alternatives: ${e.alternatives.join(', ')}`
    ).join('\n')

    const historyText =
      history.length > 0
        ? history
            .slice(0, 5)
            .map(
              (w: { date: string; name: string; muscleGroups: string[]; injuries: string[]; exercises: { exerciseId: string; maxWeightKg: number; totalSets: number }[] }) =>
                `${w.date.split('T')[0]}: ${w.name} | muscles: ${w.muscleGroups.join(', ')} | injuries: ${w.injuries.join(', ') || 'none'}\n  exercises: ${w.exercises.map((e) => `${e.exerciseId}@${e.maxWeightKg}kg`).join(', ')}`
            )
            .join('\n')
        : 'No previous workouts'

    const systemPrompt = `You are a professional personal trainer AI. Generate a workout plan as valid JSON only — no markdown, no code blocks, no explanation text. Return ONLY the raw JSON object.

Available exercises:
${exerciseList}

Rules:
1. Energy 4-5 → heavy (4-6 reps, high weight). Energy 3 → moderate (8-10 reps). Energy 1-2 → light (12-15 reps, low weight).
2. Check soreness scores (0-3). Avoid muscle groups with soreness ≥ 2.
3. For each injury listed → automatically substitute any exercise with that body part in injuryRisk. Explain the substitution.
4. Check history → avoid same muscle group trained within 48 hours.
5. Progressive overload: if an exercise appears 3+ times in history at same weight, suggest +2.5kg.
6. Select 4-5 exercises total. Each exercise gets 3-4 sets.
7. The workoutName should be descriptive (e.g. "Upper Body — Light Recovery").
8. The reasoning should be 2-3 sentences explaining your decisions in plain English.

Return ONLY this JSON structure:
{
  "workoutName": "string",
  "reasoning": "string",
  "exercises": [
    {
      "exerciseId": "exact_id_from_list",
      "sets": number,
      "reps": number,
      "suggestedWeightKg": number,
      "lastWeightKg": number or null,
      "substituteReason": "string or omit if not substituted"
    }
  ]
}`

    const userMessage = `Generate a workout for today.

Check-in:
- Energy: ${checkin.energy}/5
- Sleep: ${checkin.sleep}/5
- Soreness: upper=${checkin.soreness.upper}/3, lower=${checkin.soreness.lower}/3, core=${checkin.soreness.core}/3
- Injuries: ${checkin.injuries.length > 0 ? checkin.injuries.join(', ') : 'none'}
- Notes: ${checkin.notes || 'none'}
- Goal: ${userGoal}

Recent workout history:
${historyText}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Strip any accidental markdown code fences
    const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('generate-workout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
