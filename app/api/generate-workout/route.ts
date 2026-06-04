import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { EXERCISES } from '@/lib/exercises'

type GenExercise = { exerciseId: string; sets: number; reps: number; suggestedWeightKg: number; lastWeightKg: number | null; substituteReason?: string }

function sanitizeExercises(
  exercises: GenExercise[],
  allowedPool: typeof import('@/lib/exercises').EXERCISES,
  hasFocus: boolean,
  focusMuscles: string[],
  lastWeightMap: Record<string, number>
): GenExercise[] {
  const allowedIds = new Set(allowedPool.map((e) => e.id))
  const usedIds = new Set<string>()

  return exercises.reduce<GenExercise[]>((acc, ex) => {
    const id = ex.exerciseId

    // 1. Deduplicate — if already used, pick something else
    // 2. Focus validation — if not in allowed pool, pick something else
    const needsReplacement = usedIds.has(id) || (hasFocus && !allowedIds.has(id))

    if (!needsReplacement) {
      usedIds.add(id)
      acc.push({ ...ex, lastWeightKg: ex.lastWeightKg ?? lastWeightMap[id] ?? null })
      return acc
    }

    // Find replacement: allowed + not yet used
    const replacement = allowedPool.find((e) => !usedIds.has(e.id) && (!hasFocus || allowedIds.has(e.id)))
    if (!replacement) {
      // Nothing left — skip this exercise rather than duplicate
      return acc
    }

    usedIds.add(replacement.id)
    acc.push({
      ...ex,
      exerciseId: replacement.id,
      lastWeightKg: lastWeightMap[replacement.id] ?? null,
      substituteReason: usedIds.has(id)
        ? `Replaced duplicate ${id}`
        : `Auto-corrected to match your ${focusMuscles.join('/')} focus`,
    })
    return acc
  }, [])
}

const SINAS_URL = process.env.SINAS_URL
const SINAS_TOKEN = process.env.SINAS_TOKEN
const USE_SINAS = !!(SINAS_URL && SINAS_TOKEN)

export async function POST(req: NextRequest) {
  try {
    const { checkin, history, userGoal, focusMuscles, userPreferences } = await req.json()
    const hasFocus = focusMuscles?.length > 0
    const focusText = hasFocus
      ? `⚠️ MANDATORY MUSCLE FOCUS: The user has chosen to train ONLY: ${focusMuscles.join(', ')}. You MUST select exercises that target ONLY these muscle groups. Do NOT include any exercises for other muscle groups. This overrides everything else.`
      : 'No specific muscle focus — choose based on history and recovery.'

    const prefsText = userPreferences
      ? `User profile: name=${userPreferences.name}, favourite splits=${userPreferences.favoriteSplits.join(', ')}, default goal=${userPreferences.defaultGoal}.`
      : ''

    // Build exercise list filtered to relevant muscles when focus is set
    const relevantExercises = focusMuscles?.length > 0
      ? EXERCISES.filter((e) => e.muscleGroups.some((m: string) => focusMuscles.includes(m)))
      : EXERCISES
    const exerciseList = relevantExercises.map(
      (e) => `- id: "${e.id}" | name: "${e.name}" | muscles: ${e.muscleGroups.join(', ')} | equipment: ${e.equipment} | injuryRisk: ${e.injuryRisk.join(', ') || 'none'} | alternatives: ${e.alternatives.join(', ')}`
    ).join('\n')

    // ── Sinas agent path ──
    if (USE_SINAS) {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SINAS_TOKEN}`,
      }

      // Use the workout-specific chat session (separate from substitute to avoid context bleed)
      const chatId = process.env.SINAS_WORKOUT_CHAT_ID ?? process.env.SINAS_CHAT_ID ?? 'fce364f3-447a-4cff-8f35-6c8b3aef270b'

      // Send message and collect streamed response
      const msgRes = await fetch(`https://via-11.sinas.wearebrain.com/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: JSON.stringify({
            checkin, history, userGoal, focusMuscles,
            durationMin: checkin.durationMin,
            yesterdayActivity: checkin.yesterdayActivity,
            userPreferences,
            availableExercises: exerciseList,
          }),
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
      const sinasResult = JSON.parse(jsonMatch[0])

      if (sinasResult.exercises) {
        sinasResult.exercises = sanitizeExercises(sinasResult.exercises, relevantExercises, hasFocus, focusMuscles, {})
      }
      return NextResponse.json(sinasResult)
    }

    // ── Direct Claude path ──
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Build last-weight memory: exerciseId → most recent maxWeightKg
    type ExSummary = { exerciseId: string; maxWeightKg: number; totalSets: number; avgReps: number; totalVolume: number }
    type WSession = { date: string; name: string; muscleGroups: string[]; injuries: string[]; exercises: ExSummary[]; rating?: number; recoveryFeedback?: string }
    const sortedHistory: WSession[] = [...(history as WSession[])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastWeightMap: Record<string, number> = {}
    for (const w of sortedHistory) {
      for (const ex of w.exercises) {
        if (!(ex.exerciseId in lastWeightMap) && ex.maxWeightKg > 0) {
          lastWeightMap[ex.exerciseId] = ex.maxWeightKg
        }
      }
    }
    const lastWeightText = Object.entries(lastWeightMap).length > 0
      ? 'LAST KNOWN WEIGHTS (use these for lastWeightKg and as base for suggestedWeightKg):\n' +
        Object.entries(lastWeightMap).map(([id, kg]) => `  ${id}: ${kg}kg`).join('\n')
      : 'No previous weights on record.'

    const historyText =
      sortedHistory.length > 0
        ? sortedHistory
            .slice(0, 6)
            .map((w) =>
                `${w.date.split('T')[0]}: ${w.name} | muscles: ${w.muscleGroups.join(', ')} | injuries: ${w.injuries.join(', ') || 'none'}${w.rating ? ` | rating: ${w.rating}/5` : ''}${w.recoveryFeedback ? ` | felt: ${w.recoveryFeedback}` : ''}\n  exercises: ${w.exercises.map((e) => `${e.exerciseId}@${e.maxWeightKg}kg×${e.avgReps}reps×${e.totalSets}sets`).join(', ')}`
            )
            .join('\n')
        : 'No previous workouts'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a professional personal trainer AI. Generate a workout plan as valid JSON only — no markdown, no code blocks, no explanation text. Return ONLY the raw JSON object.

${hasFocus ? `🚨 CRITICAL RULE: The user wants to train ONLY [${focusMuscles.join(', ')}]. Every single exercise MUST target at least one of these muscles. Any exercise that does not directly train [${focusMuscles.join(', ')}] is FORBIDDEN.\n` : ''}
Available exercises (ONLY choose from this list):
${exerciseList}

Rules:
1. Energy 4-5 → heavy (4-6 reps). Energy 3 → moderate (8-10 reps). Energy 1-2 → light (12-15 reps).
2. Soreness ≥ 2 → avoid that muscle group.
3. Injuries → substitute affected exercises, explain why.
4. Avoid same muscle group within 48 hours.
5. Progressive overload: if same exercise 3+ times at same weight, suggest +2.5kg.
6. Select 4-5 exercises, 3-4 sets each.
7. For each exercise, add a short "notes" field (max 10 words) explaining WHY that specific weight was chosen — e.g. "Low energy today, dropped 10% from last session", "Progressive overload: +2.5kg from last week", "First time — starting conservative", "High energy, pushing to new PR".
${hasFocus ? `8. MANDATORY: ALL exercises must target [${focusMuscles.join(', ')}]. No exceptions.` : ''}

Return ONLY:
{
  "workoutName": "string",
  "reasoning": "string",
  "exercises": [{"exerciseId": "string", "sets": number, "reps": number, "suggestedWeightKg": number, "lastWeightKg": number|null, "notes": "short weight rationale", "substituteReason": "string or omit"}]
}`,
      messages: [
        {
          role: 'user',
          content: `Generate a workout.\n${prefsText}\nEnergy: ${checkin.energy}/5\nSleep: ${checkin.sleep}/5\nSoreness: upper=${checkin.soreness.upper}, lower=${checkin.soreness.lower}, core=${checkin.soreness.core}\nInjuries: ${checkin.injuries.join(', ') || 'none'}\nGoal: ${userGoal}\nMuscle focus: ${focusText}\nDuration: ${checkin.durationMin} min\nYesterday: ${checkin.yesterdayActivity}\n\n${lastWeightText}\n\nHistory (newest first):\n${historyText}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    const raw = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)
    if (parsed.exercises) {
      parsed.exercises = sanitizeExercises(parsed.exercises, relevantExercises, hasFocus, focusMuscles, lastWeightMap)
    }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('generate-workout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
