import type { Workout, WorkoutSummary, UserPreferences, WeeklyGoal } from './types'
import { getExerciseById } from './exercises'

const STORAGE_KEY = 'gym_ai_workouts'
const SEEDED_KEY = 'gym_ai_seeded'
const PREFS_KEY = 'gym_ai_prefs'
const ONBOARDED_KEY = 'gym_ai_onboarded'

// ─── Core helpers ────────────────────────────────────────────────────────────

function loadWorkouts(): Workout[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function persistWorkouts(workouts: Workout[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function saveWorkout(workout: Workout): void {
  const all = loadWorkouts()
  const idx = all.findIndex((w) => w.id === workout.id)
  if (idx >= 0) {
    all[idx] = workout
  } else {
    all.unshift(workout)
  }
  persistWorkouts(all)
}

export function getWorkoutHistory(limit = 20): Workout[] {
  return loadWorkouts()
    .filter((w) => w.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

export function getAllWorkouts(): Workout[] {
  return loadWorkouts().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getLastPerformance(
  exerciseId: string
): { weightKg: number; reps: number } | null {
  const history = getWorkoutHistory(30)
  for (const workout of history) {
    const ex = workout.exercises.find((e) => e.exerciseId === exerciseId)
    if (ex) {
      const completedSets = ex.sets.filter((s) => s.completed)
      if (completedSets.length > 0) {
        const best = completedSets.reduce((a, b) =>
          a.weightKg > b.weightKg ? a : b
        )
        return { weightKg: best.weightKg, reps: best.reps }
      }
    }
  }
  return null
}

export function getPersonalRecords(): Record<string, number> {
  const history = getWorkoutHistory(100)
  const prs: Record<string, number> = {}
  for (const workout of history) {
    for (const ex of workout.exercises) {
      const completedSets = ex.sets.filter((s) => s.completed)
      for (const set of completedSets) {
        if (!prs[ex.exerciseId] || set.weightKg > prs[ex.exerciseId]) {
          prs[ex.exerciseId] = set.weightKg
        }
      }
    }
  }
  return prs
}

export function getWorkoutSummaries(limit = 10): WorkoutSummary[] {
  return getWorkoutHistory(limit).map((w) => {
    const muscleGroups = Array.from(
      new Set(
        w.exercises.flatMap(
          (e) => getExerciseById(e.exerciseId)?.muscleGroups || []
        )
      )
    )
    return {
      id: w.id,
      date: w.date,
      name: w.name,
      muscleGroups,
      exercises: w.exercises.map((e) => {
        const done = e.sets.filter((s) => s.completed)
        const totalSets = done.length
        const maxWeightKg = Math.max(...done.map((s) => s.weightKg), 0)
        const avgReps = totalSets > 0 ? Math.round(done.reduce((sum, s) => sum + s.reps, 0) / totalSets) : 0
        const totalVolume = done.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
        return { exerciseId: e.exerciseId, maxWeightKg, totalSets, avgReps, totalVolume }
      }),
      injuries: w.injuries,
      rating: w.rating,
      recoveryFeedback: w.recoveryFeedback,
    }
  })
}

export function getCurrentWorkout(): Workout | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('current_workout') || 'null')
  } catch {
    return null
  }
}

export function setCurrentWorkout(workout: Workout): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('current_workout', JSON.stringify(workout))
}

export function clearCurrentWorkout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('current_workout')
}

// ─── User preferences / onboarding ───────────────────────────────────────────

export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || 'null')
  } catch {
    return null
  }
}

export function setUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(ONBOARDED_KEY)
}

export function completeOnboarding(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDED_KEY, '1')
}

// ─── Weekly goal ─────────────────────────────────────────────────────────────

const GOALS_KEY = 'gym_ai_weekly_goals'

function currentWeekKey(): string {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function getWeeklyGoals(): WeeklyGoal[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]') } catch { return [] }
}

export function getCurrentWeekGoal(): WeeklyGoal | null {
  const key = currentWeekKey()
  return getWeeklyGoals().find((g) => g.week === key) ?? null
}

export function setCurrentWeekGoal(goal: string): void {
  if (typeof window === 'undefined') return
  const key = currentWeekKey()
  const all = getWeeklyGoals().filter((g) => g.week !== key)
  all.push({ week: key, goal, achieved: false })
  localStorage.setItem(GOALS_KEY, JSON.stringify(all))
}

export function markWeeklyGoalAchieved(): void {
  if (typeof window === 'undefined') return
  const key = currentWeekKey()
  const all = getWeeklyGoals().map((g) => g.week === key ? { ...g, achieved: true } : g)
  localStorage.setItem(GOALS_KEY, JSON.stringify(all))
}

// ─── Weight progression helpers ───────────────────────────────────────────────

export function getAvgWeightProgression(): number | null {
  if (typeof window === 'undefined') return null
  const now = new Date()
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7)
  const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14)

  const all = loadWorkouts().filter((w) => w.completed)
  const thisWeek = all.filter((w) => new Date(w.date) >= thisWeekStart)
  const lastWeek = all.filter((w) => new Date(w.date) >= lastWeekStart && new Date(w.date) < thisWeekStart)

  function avgMaxWeight(workouts: Workout[]): number | null {
    const weights: number[] = []
    for (const w of workouts) {
      for (const ex of w.exercises) {
        const max = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.weightKg), 0)
        if (max > 0) weights.push(max)
      }
    }
    if (weights.length === 0) return null
    return weights.reduce((a, b) => a + b, 0) / weights.length
  }

  const thisAvg = avgMaxWeight(thisWeek)
  const lastAvg = avgMaxWeight(lastWeek)
  if (thisAvg == null || lastAvg == null) return null
  return Math.round((thisAvg - lastAvg) * 10) / 10
}

// ─── Seed data ───────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export function seedDemoData(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(SEEDED_KEY)) return

  const workouts: Workout[] = [
    // Day 14 ago — Push (chest focus)
    {
      id: 'seed_1',
      date: daysAgo(13),
      name: 'Push Day — Chest Focus',
      reasoning: 'High energy day, chest and triceps primed for volume.',
      completed: true,
      injuries: [],
      userGoal: 'hypertrophy',
      exercises: [
        {
          exerciseId: 'barbell_bench_press',
          suggestedWeightKg: 80,
          lastWeightKg: 77.5,
          sets: [
            { weightKg: 80, reps: 8, completed: true },
            { weightKg: 80, reps: 8, completed: true },
            { weightKg: 80, reps: 7, completed: true },
          ],
        },
        {
          exerciseId: 'incline_dumbbell_press',
          suggestedWeightKg: 28,
          lastWeightKg: 26,
          sets: [
            { weightKg: 28, reps: 10, completed: true },
            { weightKg: 28, reps: 10, completed: true },
            { weightKg: 28, reps: 9, completed: true },
          ],
        },
        {
          exerciseId: 'tricep_pushdown',
          suggestedWeightKg: 35,
          lastWeightKg: 32.5,
          sets: [
            { weightKg: 35, reps: 12, completed: true },
            { weightKg: 35, reps: 12, completed: true },
            { weightKg: 35, reps: 11, completed: true },
          ],
        },
      ],
    },
    // Day 11 ago — Pull (back focus)
    {
      id: 'seed_2',
      date: daysAgo(11),
      name: 'Pull Day — Back Focus',
      reasoning: 'Good recovery, targeting back and biceps for hypertrophy.',
      completed: true,
      injuries: [],
      userGoal: 'hypertrophy',
      exercises: [
        {
          exerciseId: 'cable_row',
          suggestedWeightKg: 55,
          lastWeightKg: 52.5,
          sets: [
            { weightKg: 55, reps: 10, completed: true },
            { weightKg: 55, reps: 10, completed: true },
            { weightKg: 55, reps: 9, completed: true },
          ],
        },
        {
          exerciseId: 'lat_pulldown',
          suggestedWeightKg: 65,
          lastWeightKg: 62.5,
          sets: [
            { weightKg: 65, reps: 10, completed: true },
            { weightKg: 65, reps: 10, completed: true },
            { weightKg: 65, reps: 10, completed: true },
          ],
        },
        {
          exerciseId: 'dumbbell_curl',
          suggestedWeightKg: 16,
          lastWeightKg: 14,
          sets: [
            { weightKg: 16, reps: 12, completed: true },
            { weightKg: 16, reps: 12, completed: true },
            { weightKg: 16, reps: 10, completed: true },
          ],
        },
      ],
    },
    // Day 9 ago — Legs (with knee injury noted)
    {
      id: 'seed_3',
      date: daysAgo(9),
      name: 'Lower Body — Knee Caution',
      reasoning: 'Knee discomfort noted — replaced squats with leg press and goblet squat.',
      completed: true,
      injuries: ['knee'],
      userGoal: 'strength',
      exercises: [
        {
          exerciseId: 'leg_press',
          suggestedWeightKg: 120,
          lastWeightKg: 110,
          substituteReason: 'Replaced barbell squat to protect knee',
          sets: [
            { weightKg: 120, reps: 8, completed: true },
            { weightKg: 120, reps: 8, completed: true },
            { weightKg: 120, reps: 7, completed: true },
          ],
        },
        {
          exerciseId: 'romanian_deadlift',
          suggestedWeightKg: 70,
          lastWeightKg: 67.5,
          sets: [
            { weightKg: 70, reps: 8, completed: true },
            { weightKg: 70, reps: 8, completed: true },
            { weightKg: 70, reps: 8, completed: true },
          ],
        },
        {
          exerciseId: 'calf_raise',
          suggestedWeightKg: 0,
          lastWeightKg: 0,
          sets: [
            { weightKg: 0, reps: 20, completed: true },
            { weightKg: 0, reps: 20, completed: true },
          ],
        },
      ],
    },
    // Day 7 ago — Shoulders
    {
      id: 'seed_4',
      date: daysAgo(7),
      name: 'Shoulder & Arms Day',
      reasoning: 'Full recovery, shoulder-focused session with arm work.',
      completed: true,
      injuries: [],
      userGoal: 'hypertrophy',
      exercises: [
        {
          exerciseId: 'dumbbell_shoulder_press',
          suggestedWeightKg: 22,
          lastWeightKg: 20,
          sets: [
            { weightKg: 22, reps: 10, completed: true },
            { weightKg: 22, reps: 10, completed: true },
            { weightKg: 22, reps: 9, completed: true },
          ],
        },
        {
          exerciseId: 'lateral_raise',
          suggestedWeightKg: 12,
          lastWeightKg: 10,
          sets: [
            { weightKg: 12, reps: 12, completed: true },
            { weightKg: 12, reps: 12, completed: true },
            { weightKg: 12, reps: 12, completed: true },
          ],
        },
        {
          exerciseId: 'barbell_curl',
          suggestedWeightKg: 40,
          lastWeightKg: 37.5,
          sets: [
            { weightKg: 40, reps: 10, completed: true },
            { weightKg: 40, reps: 10, completed: true },
            { weightKg: 40, reps: 8, completed: true },
          ],
        },
        {
          exerciseId: 'skull_crusher',
          suggestedWeightKg: 30,
          lastWeightKg: 27.5,
          sets: [
            { weightKg: 30, reps: 10, completed: true },
            { weightKg: 30, reps: 10, completed: true },
            { weightKg: 30, reps: 9, completed: true },
          ],
        },
      ],
    },
    // Day 4 ago — Push (progression)
    {
      id: 'seed_5',
      date: daysAgo(4),
      name: 'Push Day — Progressive Overload',
      reasoning: 'Energy high, time for a PR attempt on bench.',
      completed: true,
      injuries: [],
      userGoal: 'strength',
      exercises: [
        {
          exerciseId: 'barbell_bench_press',
          suggestedWeightKg: 82.5,
          lastWeightKg: 80,
          sets: [
            { weightKg: 82.5, reps: 6, completed: true },
            { weightKg: 82.5, reps: 6, completed: true },
            { weightKg: 82.5, reps: 5, completed: true },
          ],
        },
        {
          exerciseId: 'cable_fly',
          suggestedWeightKg: 18,
          lastWeightKg: 16,
          sets: [
            { weightKg: 18, reps: 12, completed: true },
            { weightKg: 18, reps: 12, completed: true },
            { weightKg: 18, reps: 11, completed: true },
          ],
        },
        {
          exerciseId: 'overhead_tricep_extension',
          suggestedWeightKg: 24,
          lastWeightKg: 22,
          sets: [
            { weightKg: 24, reps: 12, completed: true },
            { weightKg: 24, reps: 12, completed: true },
            { weightKg: 24, reps: 10, completed: true },
          ],
        },
      ],
    },
    // Day 2 ago — Pull (progression)
    {
      id: 'seed_6',
      date: daysAgo(2),
      name: 'Pull Day — Back Volume',
      reasoning: 'Second pull session this week, maintaining volume.',
      completed: true,
      injuries: [],
      userGoal: 'hypertrophy',
      exercises: [
        {
          exerciseId: 'cable_row',
          suggestedWeightKg: 57.5,
          lastWeightKg: 55,
          sets: [
            { weightKg: 57.5, reps: 10, completed: true },
            { weightKg: 57.5, reps: 10, completed: true },
            { weightKg: 57.5, reps: 9, completed: true },
          ],
        },
        {
          exerciseId: 'lat_pulldown',
          suggestedWeightKg: 67.5,
          lastWeightKg: 65,
          sets: [
            { weightKg: 67.5, reps: 10, completed: true },
            { weightKg: 67.5, reps: 10, completed: true },
            { weightKg: 67.5, reps: 10, completed: true },
          ],
        },
        {
          exerciseId: 'face_pull',
          suggestedWeightKg: 25,
          lastWeightKg: 22.5,
          sets: [
            { weightKg: 25, reps: 15, completed: true },
            { weightKg: 25, reps: 15, completed: true },
            { weightKg: 25, reps: 14, completed: true },
          ],
        },
        {
          exerciseId: 'hammer_curl',
          suggestedWeightKg: 18,
          lastWeightKg: 16,
          sets: [
            { weightKg: 18, reps: 12, completed: true },
            { weightKg: 18, reps: 12, completed: true },
            { weightKg: 18, reps: 10, completed: true },
          ],
        },
      ],
    },
  ]

  persistWorkouts(workouts)
  localStorage.setItem(SEEDED_KEY, '1')
}
