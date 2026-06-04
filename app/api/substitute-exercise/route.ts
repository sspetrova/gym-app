import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { EXERCISES } from '@/lib/exercises'

const SINAS_TOKEN = process.env.SINAS_TOKEN
const USE_SINAS = !!SINAS_TOKEN

export async function POST(req: NextRequest) {
  try {
    const { exerciseId, reason, currentWorkout } = await req.json()

    const current = EXERCISES.find((e) => e.id === exerciseId)
    if (!current) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 400 })
    }

    const alternatives = EXERCISES.filter(
      (e) =>
        e.id !== exerciseId &&
        !currentWorkout.includes(e.id) &&
        e.muscleGroups.some((m) => current.muscleGroups.includes(m))
    )

    const altList = alternatives
      .map((e) => `- id: "${e.id}" | name: "${e.name}" | muscles: ${e.muscleGroups.join(', ')} | equipment: ${e.equipment} | injuryRisk: ${e.injuryRisk.join(', ') || 'none'}`)
      .join('\n')

    const userMessage = `The athlete wants to swap: "${current.name}" (${current.muscleGroups.join(', ')})
Reason: "${reason}"
Already in workout (avoid these): ${currentWorkout.join(', ')}

Available substitutes targeting similar muscles:
${altList}

Pick the best substitute. Return ONLY JSON: {"exerciseId": "the_id", "reason": "one sentence"}`

    // ── Sinas path ──
    if (USE_SINAS) {
      // Use the substitute-specific chat session (separate from workout to avoid context bleed)
      const chatId = process.env.SINAS_SUBSTITUTE_CHAT_ID ?? process.env.SINAS_CHAT_ID ?? 'fce364f3-447a-4cff-8f35-6c8b3aef270b'
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SINAS_TOKEN}`,
      }

      const msgRes = await fetch(`https://via-11.sinas.wearebrain.com/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: userMessage }),
      })
      if (!msgRes.ok) throw new Error(`Sinas error: ${await msgRes.text()}`)

      const text = await msgRes.text()
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
      const jsonMatch = fullContent.match(/\{[\s\S]*?\}/)
      if (!jsonMatch) throw new Error('No JSON in Sinas response')
      return NextResponse.json(JSON.parse(jsonMatch[0]))
    }

    // ── Direct Claude path ──
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: 'You are a personal trainer AI. Return ONLY valid JSON, no markdown.',
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return NextResponse.json(JSON.parse(raw))
  } catch (err) {
    console.error('substitute-exercise error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
