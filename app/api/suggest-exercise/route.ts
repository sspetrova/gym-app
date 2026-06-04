import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { EXERCISES } from '@/lib/exercises'

export async function POST(req: NextRequest) {
  try {
    const { currentExerciseIds, userGoal, energy, lastWeights } = await req.json()

    // Filter out exercises already in the workout and build candidate list
    const candidates = EXERCISES.filter((e) => !currentExerciseIds.includes(e.id))
    const candidateList = candidates.map(
      (e) => `- id: "${e.id}" | name: "${e.name}" | muscles: ${e.muscleGroups.join(', ')}`
    ).join('\n')

    const lastWeightsText = lastWeights && Object.keys(lastWeights).length > 0
      ? 'Last known weights:\n' + Object.entries(lastWeights).map(([id, kg]) => `  ${id}: ${kg}kg`).join('\n')
      : ''

    const alreadyIn = currentExerciseIds.map((id: string) => {
      const ex = EXERCISES.find((e) => e.id === id)
      return ex ? `${ex.name} (${ex.muscleGroups.join(', ')})` : id
    }).join(', ')

    const SINAS_TOKEN = process.env.SINAS_TOKEN
    const chatId = process.env.SINAS_SUBSTITUTE_CHAT_ID ?? process.env.SINAS_CHAT_ID ?? 'fce364f3-447a-4cff-8f35-6c8b3aef270b'

    const prompt = `The athlete is mid-workout and wants to add one more exercise.
Already in workout: ${alreadyIn}
Goal: ${userGoal} | Energy: ${energy}/5
${lastWeightsText}

Available exercises to add:
${candidateList}

Pick the single best exercise to add that:
1. Doesn't repeat muscles already heavily trained today
2. Complements what they've already done
3. Suits their energy level (${energy}/5)
4. Uses a reasonable weight based on their history

Return ONLY this JSON:
{"exerciseId": "exact_id", "sets": 3, "reps": 10, "suggestedWeightKg": 0, "reason": "one sentence why"}`

    if (SINAS_TOKEN) {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${SINAS_TOKEN}` }
      const res = await fetch(`https://via-11.sinas.wearebrain.com/chats/${chatId}/messages/stream`, {
        method: 'POST', headers,
        body: JSON.stringify({ content: prompt }),
      })
      if (!res.ok) throw new Error(`Sinas error: ${await res.text()}`)
      const text = await res.text()
      const lines = text.split('\n').filter((l) => l.startsWith('data:'))
      let full = ''
      for (const line of lines) {
        try {
          const j = JSON.parse(line.replace('data:', '').trim())
          if (j.content) full += j.content
          if (j.text) full += j.text
          if (j.delta?.text) full += j.delta.text
        } catch {}
      }
      const match = full.match(/\{[\s\S]*?\}/)
      if (!match) throw new Error('No JSON in response')
      return NextResponse.json(JSON.parse(match[0]))
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: 'You are a personal trainer AI. Return ONLY valid JSON, no markdown.',
      messages: [{ role: 'user', content: prompt }],
    })
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected type')
    const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return NextResponse.json(JSON.parse(raw))
  } catch (err) {
    console.error('suggest-exercise error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
