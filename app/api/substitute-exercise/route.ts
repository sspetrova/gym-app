import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { EXERCISES } from '@/lib/exercises'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
      .map(
        (e) =>
          `- id: "${e.id}" | name: "${e.name}" | muscles: ${e.muscleGroups.join(', ')} | equipment: ${e.equipment} | injuryRisk: ${e.injuryRisk.join(', ') || 'none'}`
      )
      .join('\n')

    const systemPrompt = `You are a personal trainer AI. Pick the best substitute exercise and return ONLY valid JSON — no markdown, no explanation text outside the JSON.

Return exactly:
{"exerciseId": "the_id", "reason": "one sentence explaining why this is a good substitute"}`

    const userMessage = `The athlete wants to swap: "${current.name}" (${current.muscleGroups.join(', ')})
Reason: "${reason}"
Already in workout (avoid these): ${currentWorkout.join(', ')}

Available substitutes targeting similar muscles:
${altList}

Pick the best substitute given the reason.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('substitute-exercise error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
