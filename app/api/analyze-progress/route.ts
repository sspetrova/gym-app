import { NextRequest, NextResponse } from 'next/server'

export type ProgressInsight = {
  type: 'plateau' | 'volume_trend' | 'imbalance' | 'streak' | 'pr'
  title: string
  detail: string
  emoji: string
  positive: boolean
}

type ExerciseSummary = {
  exerciseId: string
  maxWeightKg: number
  totalSets: number
  avgReps: number
  totalVolume: number
}

type WorkoutSummaryInput = {
  id: string
  date: string
  name: string
  muscleGroups: string[]
  exercises: ExerciseSummary[]
  injuries: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { history }: { history: WorkoutSummaryInput[] } = await req.json()

    if (!history || history.length < 2) {
      return NextResponse.json({ insights: [] })
    }

    const insights: ProgressInsight[] = []
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // ── 1. Plateau detection ─────────────────────────────────────────────────
    // Group by exercise, find any that have the same maxWeightKg for 3+ consecutive sessions
    const byExercise: Record<string, { date: string; maxWeightKg: number }[]> = {}
    for (const w of sorted) {
      for (const ex of w.exercises) {
        if (!byExercise[ex.exerciseId]) byExercise[ex.exerciseId] = []
        byExercise[ex.exerciseId].push({ date: w.date, maxWeightKg: ex.maxWeightKg })
      }
    }

    for (const [exerciseId, sessions] of Object.entries(byExercise)) {
      if (sessions.length < 3) continue
      const last3 = sessions.slice(-3)
      const sameWeight = last3.every((s) => s.maxWeightKg === last3[0].maxWeightKg && s.maxWeightKg > 0)
      if (sameWeight) {
        insights.push({
          type: 'plateau',
          title: 'Plateau detected',
          detail: `${exerciseId.replace(/_/g, ' ')} has been at ${last3[0].maxWeightKg}kg for 3 sessions. Time to try +2.5kg or a technique variation.`,
          emoji: '⚠️',
          positive: false,
        })
      }
    }

    // ── 2. Volume trend (this week vs last week) ─────────────────────────────
    const now = new Date()
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)

    const thisWeek = sorted.filter((w) => new Date(w.date) >= weekAgo)
    const lastWeek = sorted.filter((w) => new Date(w.date) >= twoWeeksAgo && new Date(w.date) < weekAgo)

    const totalVolume = (ws: WorkoutSummaryInput[]) =>
      ws.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.totalVolume, 0), 0)

    if (thisWeek.length > 0 && lastWeek.length > 0) {
      const thisVol = totalVolume(thisWeek)
      const lastVol = totalVolume(lastWeek)
      const pct = Math.round(((thisVol - lastVol) / lastVol) * 100)
      if (Math.abs(pct) >= 10) {
        insights.push({
          type: 'volume_trend',
          title: pct > 0 ? 'Volume up this week' : 'Volume down this week',
          detail: `Total training volume is ${Math.abs(pct)}% ${pct > 0 ? 'higher' : 'lower'} than last week (${Math.round(thisVol)}kg vs ${Math.round(lastVol)}kg).`,
          emoji: pct > 0 ? '📈' : '📉',
          positive: pct > 0,
        })
      }
    }

    // ── 3. Muscle group imbalance ────────────────────────────────────────────
    // Count muscle group frequency in last 10 workouts
    const recent = sorted.slice(-10)
    const muscleCount: Record<string, number> = {}
    for (const w of recent) {
      for (const m of w.muscleGroups) {
        muscleCount[m] = (muscleCount[m] || 0) + 1
      }
    }

    const pushMuscles = ['chest', 'shoulders', 'triceps']
    const pullMuscles = ['back', 'biceps']
    const pushCount = pushMuscles.reduce((s, m) => s + (muscleCount[m] || 0), 0)
    const pullCount = pullMuscles.reduce((s, m) => s + (muscleCount[m] || 0), 0)

    if (pushCount > 0 && pullCount > 0) {
      const ratio = pushCount / pullCount
      if (ratio > 1.8) {
        insights.push({
          type: 'imbalance',
          title: 'Push-heavy imbalance',
          detail: `You've done ${pushCount} push sessions vs ${pullCount} pull sessions recently. Add more rows and pulls to balance shoulder health.`,
          emoji: '⚖️',
          positive: false,
        })
      } else if (ratio < 0.55) {
        insights.push({
          type: 'imbalance',
          title: 'Pull-heavy imbalance',
          detail: `You've done ${pullCount} pull sessions vs ${pushCount} push sessions recently. Consider adding more pressing work.`,
          emoji: '⚖️',
          positive: false,
        })
      }
    }

    // Legs neglected check
    const legCount = (muscleCount['legs'] || 0) + (muscleCount['glutes'] || 0)
    const upperCount = pushCount + pullCount
    if (upperCount > 0 && legCount === 0 && recent.length >= 4) {
      insights.push({
        type: 'imbalance',
        title: 'Skipping legs?',
        detail: `No leg or glute work in your last ${recent.length} sessions. Don't skip leg day!`,
        emoji: '🦵',
        positive: false,
      })
    }

    // ── 4. Training streak ───────────────────────────────────────────────────
    let streak = 0
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (sorted.some((w) => w.date.split('T')[0] === dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    if (streak >= 3) {
      insights.push({
        type: 'streak',
        title: `${streak}-day streak! 🔥`,
        detail: `You've trained ${streak} days in a row. Consistency is the #1 driver of results — keep it up.`,
        emoji: '🔥',
        positive: true,
      })
    }

    // ── 5. Recent PR ─────────────────────────────────────────────────────────
    const lastSession = sorted[sorted.length - 1]
    const prevSessions = sorted.slice(0, -1)

    for (const ex of lastSession.exercises) {
      const prevBest = prevSessions
        .flatMap((w) => w.exercises)
        .filter((e) => e.exerciseId === ex.exerciseId)
        .reduce((best, e) => Math.max(best, e.maxWeightKg), 0)

      if (ex.maxWeightKg > prevBest && prevBest > 0) {
        insights.push({
          type: 'pr',
          title: 'New personal record!',
          detail: `${ex.exerciseId.replace(/_/g, ' ')} hit ${ex.maxWeightKg}kg — up from your previous best of ${prevBest}kg.`,
          emoji: '🏆',
          positive: true,
        })
      }
    }

    // Return positives first, max 4 total
    const sorted_insights = [
      ...insights.filter((i) => i.positive),
      ...insights.filter((i) => !i.positive),
    ].slice(0, 4)

    return NextResponse.json({ insights: sorted_insights })
  } catch (err) {
    console.error('analyze-progress error:', err)
    return NextResponse.json({ insights: [] })
  }
}
