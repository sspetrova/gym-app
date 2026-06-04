import type { Workout, WorkoutSummary, UserPreferences, WeeklyGoal } from './types'
import { getExerciseById } from './exercises'

const STORAGE_KEY = 'gym_ai_workouts'
const SEEDED_KEY = 'gym_ai_seeded_v2'
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

export function deleteWorkout(id: string): void {
  const all = loadWorkouts()
  persistWorkouts(all.filter((w) => w.id !== id))
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
    // ── 6 weeks ago ──────────────────────────────────────────────────────────
    {
      id: 'seed_w6_1',
      date: daysAgo(42),
      name: 'Push Day — Chest Heavy',
      reasoning: 'Starting the week fresh. Chest and triceps focused, high energy.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'barbell_bench_press', suggestedWeightKg: 75, lastWeightKg: 72.5,
          sets: [{ weightKg: 70, reps: 8, completed: true }, { weightKg: 72.5, reps: 8, completed: true }, { weightKg: 75, reps: 7, completed: true }] },
        { exerciseId: 'incline_dumbbell_press', suggestedWeightKg: 26, lastWeightKg: 24,
          sets: [{ weightKg: 24, reps: 10, completed: true }, { weightKg: 26, reps: 10, completed: true }, { weightKg: 26, reps: 9, completed: true }] },
        { exerciseId: 'tricep_pushdown', suggestedWeightKg: 30, lastWeightKg: 27.5,
          sets: [{ weightKg: 27.5, reps: 12, completed: true }, { weightKg: 30, reps: 12, completed: true }, { weightKg: 30, reps: 10, completed: true }] },
      ],
    },
    {
      id: 'seed_w6_2',
      date: daysAgo(40),
      name: 'Pull Day — Back & Biceps',
      reasoning: 'Back focused. Lat pulldown is the main pull-up builder.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 60, lastWeightKg: 57.5,
          sets: [{ weightKg: 55, reps: 10, completed: true }, { weightKg: 57.5, reps: 10, completed: true }, { weightKg: 60, reps: 9, completed: true }] },
        { exerciseId: 'cable_row', suggestedWeightKg: 50, lastWeightKg: 47.5,
          sets: [{ weightKg: 47.5, reps: 10, completed: true }, { weightKg: 50, reps: 10, completed: true }, { weightKg: 50, reps: 9, completed: true }] },
        { exerciseId: 'dumbbell_curl', suggestedWeightKg: 14, lastWeightKg: 12,
          sets: [{ weightKg: 12, reps: 12, completed: true }, { weightKg: 14, reps: 12, completed: true }, { weightKg: 14, reps: 10, completed: true }] },
      ],
    },
    {
      id: 'seed_w6_3',
      date: daysAgo(38),
      name: 'Leg Day — Quad Focus',
      reasoning: 'Legs feel fresh. Squats and leg press as main movers.',
      completed: true, injuries: [], userGoal: 'strength', rating: 5,
      exercises: [
        { exerciseId: 'barbell_squat', suggestedWeightKg: 90, lastWeightKg: 85,
          sets: [{ weightKg: 80, reps: 6, completed: true }, { weightKg: 85, reps: 6, completed: true }, { weightKg: 90, reps: 5, completed: true }] },
        { exerciseId: 'leg_press', suggestedWeightKg: 110, lastWeightKg: 105,
          sets: [{ weightKg: 100, reps: 8, completed: true }, { weightKg: 105, reps: 8, completed: true }, { weightKg: 110, reps: 7, completed: true }] },
        { exerciseId: 'romanian_deadlift', suggestedWeightKg: 65, lastWeightKg: 62.5,
          sets: [{ weightKg: 60, reps: 10, completed: true }, { weightKg: 62.5, reps: 10, completed: true }, { weightKg: 65, reps: 8, completed: true }] },
        { exerciseId: 'calf_raise', suggestedWeightKg: 0, lastWeightKg: 0,
          sets: [{ weightKg: 0, reps: 20, completed: true }, { weightKg: 0, reps: 20, completed: true }] },
      ],
    },
    // ── 5 weeks ago ──────────────────────────────────────────────────────────
    {
      id: 'seed_w5_1',
      date: daysAgo(35),
      name: 'Push Day — Shoulder Focus',
      reasoning: 'Switching to shoulder-heavy push. Overhead press as the main lift.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'dumbbell_shoulder_press', suggestedWeightKg: 20, lastWeightKg: 18,
          sets: [{ weightKg: 18, reps: 10, completed: true }, { weightKg: 20, reps: 10, completed: true }, { weightKg: 20, reps: 9, completed: true }] },
        { exerciseId: 'lateral_raise', suggestedWeightKg: 10, lastWeightKg: 9,
          sets: [{ weightKg: 9, reps: 15, completed: true }, { weightKg: 10, reps: 15, completed: true }, { weightKg: 10, reps: 13, completed: true }] },
        { exerciseId: 'cable_fly', suggestedWeightKg: 16, lastWeightKg: 14,
          sets: [{ weightKg: 14, reps: 12, completed: true }, { weightKg: 16, reps: 12, completed: true }, { weightKg: 16, reps: 11, completed: true }] },
        { exerciseId: 'skull_crusher', suggestedWeightKg: 27.5, lastWeightKg: 25,
          sets: [{ weightKg: 25, reps: 10, completed: true }, { weightKg: 27.5, reps: 10, completed: true }, { weightKg: 27.5, reps: 8, completed: true }] },
      ],
    },
    {
      id: 'seed_w5_2',
      date: daysAgo(33),
      name: 'Pull Day — Building the Pull-Up',
      reasoning: 'Goal is pull-ups — keeping lat pulldown heavy and adding face pulls.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 5,
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 62.5, lastWeightKg: 60,
          sets: [{ weightKg: 57.5, reps: 10, completed: true }, { weightKg: 60, reps: 10, completed: true }, { weightKg: 62.5, reps: 9, completed: true }] },
        { exerciseId: 'dumbbell_row', suggestedWeightKg: 32, lastWeightKg: 30,
          sets: [{ weightKg: 30, reps: 10, completed: true }, { weightKg: 32, reps: 10, completed: true }, { weightKg: 32, reps: 9, completed: true }] },
        { exerciseId: 'face_pull', suggestedWeightKg: 20, lastWeightKg: 18,
          sets: [{ weightKg: 18, reps: 15, completed: true }, { weightKg: 20, reps: 15, completed: true }, { weightKg: 20, reps: 14, completed: true }] },
        { exerciseId: 'hammer_curl', suggestedWeightKg: 16, lastWeightKg: 14,
          sets: [{ weightKg: 14, reps: 12, completed: true }, { weightKg: 16, reps: 12, completed: true }, { weightKg: 16, reps: 10, completed: true }] },
      ],
    },
    {
      id: 'seed_w5_3',
      date: daysAgo(31),
      name: 'Leg Day — Glute Focus',
      reasoning: 'Hip thrusts and split squats targeting glutes specifically.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'hip_thrust', suggestedWeightKg: 80, lastWeightKg: 75,
          sets: [{ weightKg: 70, reps: 10, completed: true }, { weightKg: 75, reps: 10, completed: true }, { weightKg: 80, reps: 9, completed: true }] },
        { exerciseId: 'split_squat', suggestedWeightKg: 20, lastWeightKg: 18,
          sets: [{ weightKg: 18, reps: 10, completed: true }, { weightKg: 20, reps: 10, completed: true }, { weightKg: 20, reps: 8, completed: true }] },
        { exerciseId: 'leg_curl', suggestedWeightKg: 45, lastWeightKg: 42.5,
          sets: [{ weightKg: 40, reps: 12, completed: true }, { weightKg: 42.5, reps: 12, completed: true }, { weightKg: 45, reps: 10, completed: true }] },
      ],
    },
    // ── 4 weeks ago ──────────────────────────────────────────────────────────
    {
      id: 'seed_w4_1',
      date: daysAgo(28),
      name: 'Push Day — Chest Focus',
      reasoning: 'Progressing bench press. +2.5kg from last push session.',
      completed: true, injuries: [], userGoal: 'strength', rating: 5,
      exercises: [
        { exerciseId: 'barbell_bench_press', suggestedWeightKg: 77.5, lastWeightKg: 75,
          sets: [{ weightKg: 72.5, reps: 6, completed: true }, { weightKg: 75, reps: 6, completed: true }, { weightKg: 77.5, reps: 5, completed: true }] },
        { exerciseId: 'incline_dumbbell_press', suggestedWeightKg: 28, lastWeightKg: 26,
          sets: [{ weightKg: 24, reps: 10, completed: true }, { weightKg: 26, reps: 10, completed: true }, { weightKg: 28, reps: 8, completed: true }] },
        { exerciseId: 'tricep_pushdown', suggestedWeightKg: 32.5, lastWeightKg: 30,
          sets: [{ weightKg: 30, reps: 12, completed: true }, { weightKg: 32.5, reps: 12, completed: true }, { weightKg: 32.5, reps: 10, completed: true }] },
      ],
    },
    {
      id: 'seed_w4_2',
      date: daysAgo(26),
      name: 'Active Recovery — Core & Mobility',
      reasoning: 'Felt tired after 3 heavy sessions. Light core work and stretching only.',
      completed: true, injuries: [], userGoal: 'endurance', rating: 3, recoveryFeedback: 'tough',
      exercises: [
        { exerciseId: 'plank', suggestedWeightKg: 0, lastWeightKg: 0,
          sets: [{ weightKg: 0, reps: 60, completed: true }, { weightKg: 0, reps: 60, completed: true }, { weightKg: 0, reps: 45, completed: true }] },
        { exerciseId: 'dead_bug', suggestedWeightKg: 0, lastWeightKg: 0,
          sets: [{ weightKg: 0, reps: 15, completed: true }, { weightKg: 0, reps: 15, completed: true }] },
      ],
    },
    {
      id: 'seed_w4_3',
      date: daysAgo(24),
      name: 'Pull Day — Back Volume',
      reasoning: 'After rest day — back fresh. Lat pulldown at 65kg, progressive sets.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 5,
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 65, lastWeightKg: 62.5,
          sets: [{ weightKg: 60, reps: 10, completed: true }, { weightKg: 62.5, reps: 10, completed: true }, { weightKg: 65, reps: 9, completed: true }] },
        { exerciseId: 'cable_row', suggestedWeightKg: 52.5, lastWeightKg: 50,
          sets: [{ weightKg: 47.5, reps: 10, completed: true }, { weightKg: 50, reps: 10, completed: true }, { weightKg: 52.5, reps: 9, completed: true }] },
        { exerciseId: 'face_pull', suggestedWeightKg: 22.5, lastWeightKg: 20,
          sets: [{ weightKg: 20, reps: 15, completed: true }, { weightKg: 22.5, reps: 15, completed: true }, { weightKg: 22.5, reps: 13, completed: true }] },
        { exerciseId: 'barbell_curl', suggestedWeightKg: 37.5, lastWeightKg: 35,
          sets: [{ weightKg: 35, reps: 10, completed: true }, { weightKg: 37.5, reps: 10, completed: true }, { weightKg: 37.5, reps: 8, completed: true }] },
      ],
    },
    // ── 3 weeks ago ──────────────────────────────────────────────────────────
    {
      id: 'seed_w3_1',
      date: daysAgo(21),
      name: 'Leg Day — Strength',
      reasoning: 'Low energy but pushed through. Kept squats moderate.',
      completed: true, injuries: [], userGoal: 'strength', rating: 3, recoveryFeedback: 'tough',
      exercises: [
        { exerciseId: 'barbell_squat', suggestedWeightKg: 92.5, lastWeightKg: 90,
          sets: [{ weightKg: 82.5, reps: 5, completed: true }, { weightKg: 87.5, reps: 5, completed: true }, { weightKg: 92.5, reps: 4, completed: true }] },
        { exerciseId: 'leg_press', suggestedWeightKg: 115, lastWeightKg: 110,
          sets: [{ weightKg: 105, reps: 8, completed: true }, { weightKg: 110, reps: 8, completed: true }, { weightKg: 115, reps: 6, completed: true }] },
        { exerciseId: 'leg_curl', suggestedWeightKg: 47.5, lastWeightKg: 45,
          sets: [{ weightKg: 42.5, reps: 12, completed: true }, { weightKg: 45, reps: 12, completed: true }, { weightKg: 47.5, reps: 9, completed: true }] },
      ],
    },
    {
      id: 'seed_w3_2',
      date: daysAgo(19),
      name: 'Push Day — Arms & Chest',
      reasoning: 'Feeling recovered. Bench press and arm finishers.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'barbell_bench_press', suggestedWeightKg: 77.5, lastWeightKg: 77.5,
          sets: [{ weightKg: 72.5, reps: 8, completed: true }, { weightKg: 75, reps: 8, completed: true }, { weightKg: 77.5, reps: 7, completed: true }] },
        { exerciseId: 'cable_fly', suggestedWeightKg: 17, lastWeightKg: 16,
          sets: [{ weightKg: 15, reps: 12, completed: true }, { weightKg: 16, reps: 12, completed: true }, { weightKg: 17, reps: 11, completed: true }] },
        { exerciseId: 'overhead_tricep_extension', suggestedWeightKg: 22, lastWeightKg: 20,
          sets: [{ weightKg: 20, reps: 12, completed: true }, { weightKg: 22, reps: 12, completed: true }, { weightKg: 22, reps: 10, completed: true }] },
        { exerciseId: 'skull_crusher', suggestedWeightKg: 28, lastWeightKg: 27.5,
          sets: [{ weightKg: 25, reps: 10, completed: true }, { weightKg: 27.5, reps: 10, completed: true }, { weightKg: 28, reps: 8, completed: true }] },
      ],
    },
    {
      id: 'seed_w3_3',
      date: daysAgo(17),
      name: 'Pull Day — Building Pull-Up Strength',
      reasoning: 'Lat pulldown at bodyweight range. Getting closer to pull-up goal.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 5, recoveryFeedback: 'great',
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 67.5, lastWeightKg: 65,
          sets: [{ weightKg: 62.5, reps: 10, completed: true }, { weightKg: 65, reps: 10, completed: true }, { weightKg: 67.5, reps: 9, completed: true }] },
        { exerciseId: 'cable_row', suggestedWeightKg: 55, lastWeightKg: 52.5,
          sets: [{ weightKg: 50, reps: 10, completed: true }, { weightKg: 52.5, reps: 10, completed: true }, { weightKg: 55, reps: 10, completed: true }] },
        { exerciseId: 'dumbbell_row', suggestedWeightKg: 34, lastWeightKg: 32,
          sets: [{ weightKg: 30, reps: 10, completed: true }, { weightKg: 32, reps: 10, completed: true }, { weightKg: 34, reps: 9, completed: true }] },
        { exerciseId: 'hammer_curl', suggestedWeightKg: 17, lastWeightKg: 16,
          sets: [{ weightKg: 15, reps: 12, completed: true }, { weightKg: 16, reps: 12, completed: true }, { weightKg: 17, reps: 10, completed: true }] },
      ],
    },
    // ── 2 weeks ago ──────────────────────────────────────────────────────────
    {
      id: 'seed_w2_1',
      date: daysAgo(14),
      name: 'Leg Day — Glute & Hamstring',
      reasoning: 'Hip thrusts and RDLs as the focus. Progressing weight on both.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'hip_thrust', suggestedWeightKg: 85, lastWeightKg: 80,
          sets: [{ weightKg: 75, reps: 10, completed: true }, { weightKg: 80, reps: 10, completed: true }, { weightKg: 85, reps: 8, completed: true }] },
        { exerciseId: 'romanian_deadlift', suggestedWeightKg: 67.5, lastWeightKg: 65,
          sets: [{ weightKg: 62.5, reps: 10, completed: true }, { weightKg: 65, reps: 10, completed: true }, { weightKg: 67.5, reps: 9, completed: true }] },
        { exerciseId: 'leg_curl', suggestedWeightKg: 50, lastWeightKg: 47.5,
          sets: [{ weightKg: 45, reps: 12, completed: true }, { weightKg: 47.5, reps: 12, completed: true }, { weightKg: 50, reps: 10, completed: true }] },
        { exerciseId: 'calf_raise', suggestedWeightKg: 0, lastWeightKg: 0,
          sets: [{ weightKg: 0, reps: 25, completed: true }, { weightKg: 0, reps: 25, completed: true }] },
      ],
    },
    {
      id: 'seed_w2_2',
      date: daysAgo(12),
      name: 'Push Day — Chest PR Attempt',
      reasoning: 'High energy, fresh after rest day. Going for 80kg bench.',
      completed: true, injuries: [], userGoal: 'strength', rating: 5, recoveryFeedback: 'great',
      exercises: [
        { exerciseId: 'barbell_bench_press', suggestedWeightKg: 80, lastWeightKg: 77.5,
          sets: [{ weightKg: 72.5, reps: 6, completed: true }, { weightKg: 77.5, reps: 6, completed: true }, { weightKg: 80, reps: 6, completed: true }] },
        { exerciseId: 'incline_dumbbell_press', suggestedWeightKg: 28, lastWeightKg: 26,
          sets: [{ weightKg: 24, reps: 10, completed: true }, { weightKg: 26, reps: 10, completed: true }, { weightKg: 28, reps: 9, completed: true }] },
        { exerciseId: 'tricep_pushdown', suggestedWeightKg: 35, lastWeightKg: 32.5,
          sets: [{ weightKg: 30, reps: 12, completed: true }, { weightKg: 32.5, reps: 12, completed: true }, { weightKg: 35, reps: 11, completed: true }] },
      ],
    },
    {
      id: 'seed_w2_3',
      date: daysAgo(10),
      name: 'Pull Day — Back Focus',
      reasoning: 'Consistent lat pulldown progression. +2.5kg from last session.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 70, lastWeightKg: 67.5,
          sets: [{ weightKg: 65, reps: 10, completed: true }, { weightKg: 67.5, reps: 10, completed: true }, { weightKg: 70, reps: 8, completed: true }] },
        { exerciseId: 'cable_row', suggestedWeightKg: 57.5, lastWeightKg: 55,
          sets: [{ weightKg: 52.5, reps: 10, completed: true }, { weightKg: 55, reps: 10, completed: true }, { weightKg: 57.5, reps: 9, completed: true }] },
        { exerciseId: 'face_pull', suggestedWeightKg: 25, lastWeightKg: 22.5,
          sets: [{ weightKg: 22.5, reps: 15, completed: true }, { weightKg: 25, reps: 15, completed: true }, { weightKg: 25, reps: 13, completed: true }] },
        { exerciseId: 'dumbbell_curl', suggestedWeightKg: 16, lastWeightKg: 14,
          sets: [{ weightKg: 14, reps: 12, completed: true }, { weightKg: 16, reps: 12, completed: true }, { weightKg: 16, reps: 10, completed: true }] },
      ],
    },
    // ── Last week ─────────────────────────────────────────────────────────────
    {
      id: 'seed_w1_1',
      date: daysAgo(8),
      name: 'Shoulder & Arms Day',
      reasoning: 'Shoulders fresh. Overhead press + lateral raises + arm finishers.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'dumbbell_shoulder_press', suggestedWeightKg: 22, lastWeightKg: 20,
          sets: [{ weightKg: 20, reps: 10, completed: true }, { weightKg: 22, reps: 10, completed: true }, { weightKg: 22, reps: 9, completed: true }] },
        { exerciseId: 'lateral_raise', suggestedWeightKg: 12, lastWeightKg: 10,
          sets: [{ weightKg: 10, reps: 15, completed: true }, { weightKg: 12, reps: 15, completed: true }, { weightKg: 12, reps: 12, completed: true }] },
        { exerciseId: 'barbell_curl', suggestedWeightKg: 40, lastWeightKg: 37.5,
          sets: [{ weightKg: 35, reps: 10, completed: true }, { weightKg: 37.5, reps: 10, completed: true }, { weightKg: 40, reps: 8, completed: true }] },
        { exerciseId: 'skull_crusher', suggestedWeightKg: 30, lastWeightKg: 27.5,
          sets: [{ weightKg: 25, reps: 10, completed: true }, { weightKg: 27.5, reps: 10, completed: true }, { weightKg: 30, reps: 8, completed: true }] },
      ],
    },
    {
      id: 'seed_w1_2',
      date: daysAgo(6),
      name: 'Leg Day — Knee Caution',
      reasoning: 'Knee slightly stiff — swapped squats for leg press. Still a solid session.',
      completed: true, injuries: ['knee'], userGoal: 'strength', rating: 3,
      exercises: [
        { exerciseId: 'leg_press', suggestedWeightKg: 120, lastWeightKg: 115,
          substituteReason: 'Replaced barbell squat to protect knee',
          sets: [{ weightKg: 110, reps: 8, completed: true }, { weightKg: 115, reps: 8, completed: true }, { weightKg: 120, reps: 7, completed: true }] },
        { exerciseId: 'romanian_deadlift', suggestedWeightKg: 70, lastWeightKg: 67.5,
          sets: [{ weightKg: 65, reps: 10, completed: true }, { weightKg: 67.5, reps: 10, completed: true }, { weightKg: 70, reps: 8, completed: true }] },
        { exerciseId: 'hip_thrust', suggestedWeightKg: 87.5, lastWeightKg: 85,
          sets: [{ weightKg: 80, reps: 10, completed: true }, { weightKg: 85, reps: 10, completed: true }, { weightKg: 87.5, reps: 8, completed: true }] },
        { exerciseId: 'calf_raise', suggestedWeightKg: 0, lastWeightKg: 0,
          sets: [{ weightKg: 0, reps: 25, completed: true }, { weightKg: 0, reps: 25, completed: true }] },
      ],
    },
    {
      id: 'seed_w1_3',
      date: daysAgo(4),
      name: 'Push Day — Progressive Overload',
      reasoning: 'Energy high, time for a new bench PR. +2.5kg from last session.',
      completed: true, injuries: [], userGoal: 'strength', rating: 5, recoveryFeedback: 'great',
      exercises: [
        { exerciseId: 'barbell_bench_press', suggestedWeightKg: 82.5, lastWeightKg: 80,
          sets: [{ weightKg: 75, reps: 6, completed: true }, { weightKg: 80, reps: 6, completed: true }, { weightKg: 82.5, reps: 5, completed: true }] },
        { exerciseId: 'cable_fly', suggestedWeightKg: 18, lastWeightKg: 17,
          sets: [{ weightKg: 15, reps: 12, completed: true }, { weightKg: 17, reps: 12, completed: true }, { weightKg: 18, reps: 11, completed: true }] },
        { exerciseId: 'overhead_tricep_extension', suggestedWeightKg: 24, lastWeightKg: 22,
          sets: [{ weightKg: 20, reps: 12, completed: true }, { weightKg: 22, reps: 12, completed: true }, { weightKg: 24, reps: 10, completed: true }] },
      ],
    },
    // ── This week ─────────────────────────────────────────────────────────────
    {
      id: 'seed_curr_1',
      date: daysAgo(2),
      name: 'Pull Day — Back Volume',
      reasoning: 'Second pull session this week. Lat pulldown plateau broken — up to 72.5kg.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4, recoveryFeedback: 'tough',
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 72.5, lastWeightKg: 70,
          sets: [{ weightKg: 65, reps: 10, completed: true }, { weightKg: 70, reps: 10, completed: true }, { weightKg: 72.5, reps: 8, completed: true }] },
        { exerciseId: 'cable_row', suggestedWeightKg: 57.5, lastWeightKg: 55,
          sets: [{ weightKg: 52.5, reps: 10, completed: true }, { weightKg: 55, reps: 10, completed: true }, { weightKg: 57.5, reps: 9, completed: true }] },
        { exerciseId: 'face_pull', suggestedWeightKg: 25, lastWeightKg: 22.5,
          sets: [{ weightKg: 22.5, reps: 15, completed: true }, { weightKg: 25, reps: 15, completed: true }, { weightKg: 25, reps: 14, completed: true }] },
        { exerciseId: 'hammer_curl', suggestedWeightKg: 18, lastWeightKg: 16,
          sets: [{ weightKg: 16, reps: 12, completed: true }, { weightKg: 18, reps: 12, completed: true }, { weightKg: 18, reps: 10, completed: true }] },
      ],
    },
    {
      id: 'seed_curr_2',
      date: daysAgo(1),
      name: 'Leg Day — Volume',
      reasoning: 'Good energy, legs fully recovered. Squats and hip thrusts.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'barbell_squat', suggestedWeightKg: 95, lastWeightKg: 92.5,
          sets: [{ weightKg: 85, reps: 6, completed: true }, { weightKg: 90, reps: 6, completed: true }, { weightKg: 95, reps: 5, completed: true }] },
        { exerciseId: 'hip_thrust', suggestedWeightKg: 90, lastWeightKg: 87.5,
          sets: [{ weightKg: 82.5, reps: 10, completed: true }, { weightKg: 87.5, reps: 10, completed: true }, { weightKg: 90, reps: 8, completed: true }] },
        { exerciseId: 'romanian_deadlift', suggestedWeightKg: 72.5, lastWeightKg: 70,
          sets: [{ weightKg: 65, reps: 10, completed: true }, { weightKg: 70, reps: 10, completed: true }, { weightKg: 72.5, reps: 8, completed: true }] },
        { exerciseId: 'leg_extension', suggestedWeightKg: 55, lastWeightKg: 52.5,
          sets: [{ weightKg: 50, reps: 12, completed: true }, { weightKg: 52.5, reps: 12, completed: true }, { weightKg: 55, reps: 10, completed: true }] },
      ],
    },

    // ── Extra: bad sessions, deloads, AI swaps ────────────────────────────────

    // Low energy + overworked — AI kept weights light
    {
      id: 'seed_bad_1',
      date: daysAgo(36),
      name: 'Recovery Push — Low Energy',
      reasoning: 'Energy was 1/5 and you felt overworked from last session. Dropped all weights 15% and kept it short. No shame in a recovery day — you\'ll come back stronger.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 2, recoveryFeedback: 'overworked',
      exercises: [
        { exerciseId: 'push_up', suggestedWeightKg: 0, lastWeightKg: 0,
          substituteReason: 'AI replaced bench press — energy too low for heavy compounds',
          sets: [{ weightKg: 0, reps: 15, completed: true }, { weightKg: 0, reps: 12, completed: true }] },
        { exerciseId: 'cable_fly', suggestedWeightKg: 12, lastWeightKg: 16,
          notes: 'Dropped 25% — energy 1/5, recovery session',
          sets: [{ weightKg: 10, reps: 15, completed: true }, { weightKg: 12, reps: 15, completed: true }] },
        { exerciseId: 'dead_bug', suggestedWeightKg: 0, lastWeightKg: 0,
          sets: [{ weightKg: 0, reps: 12, completed: true }, { weightKg: 0, reps: 12, completed: true }] },
      ],
    },

    // Shoulder injury — AI swapped all shoulder/overhead work
    {
      id: 'seed_injury_1',
      date: daysAgo(29),
      name: 'Push Day — Shoulder Injury Adapted',
      reasoning: 'Shoulder pain flagged. Replaced all overhead pressing and lateral raises with cable alternatives below shoulder height. Focus shifted to chest and triceps only — still a productive session.',
      completed: true, injuries: ['shoulder'], userGoal: 'hypertrophy', rating: 3,
      exercises: [
        { exerciseId: 'dumbbell_bench_press', suggestedWeightKg: 28, lastWeightKg: 26,
          sets: [{ weightKg: 24, reps: 10, completed: true }, { weightKg: 26, reps: 10, completed: true }, { weightKg: 28, reps: 8, completed: true }] },
        { exerciseId: 'cable_fly', suggestedWeightKg: 16, lastWeightKg: 14,
          sets: [{ weightKg: 14, reps: 12, completed: true }, { weightKg: 16, reps: 12, completed: true }, { weightKg: 16, reps: 10, completed: true }] },
        { exerciseId: 'tricep_pushdown', suggestedWeightKg: 32.5, lastWeightKg: 30,
          substituteReason: 'Replaced overhead tricep extension — shoulder injury',
          sets: [{ weightKg: 27.5, reps: 12, completed: true }, { weightKg: 30, reps: 12, completed: true }, { weightKg: 32.5, reps: 10, completed: true }] },
        { exerciseId: 'cable_row', suggestedWeightKg: 50, lastWeightKg: 47.5,
          substituteReason: 'Added cable row instead of lateral raises — safe for shoulder',
          sets: [{ weightKg: 45, reps: 12, completed: true }, { weightKg: 50, reps: 12, completed: true }, { weightKg: 50, reps: 10, completed: true }] },
      ],
    },

    // Mid-session swap — user didn't like the exercise
    {
      id: 'seed_swap_1',
      date: daysAgo(22),
      name: 'Pull Day — Mid-Session Swap',
      reasoning: 'Good energy, back session. You swapped barbell row (lower back discomfort) for dumbbell row mid-session — smart call. Still hit good volume.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 4,
      exercises: [
        { exerciseId: 'lat_pulldown', suggestedWeightKg: 65, lastWeightKg: 62.5,
          sets: [{ weightKg: 60, reps: 10, completed: true }, { weightKg: 62.5, reps: 10, completed: true }, { weightKg: 65, reps: 9, completed: true }] },
        { exerciseId: 'dumbbell_row', suggestedWeightKg: 32, lastWeightKg: 30,
          substituteReason: 'Swapped from barbell row — lower back felt tight, AI suggested dumbbell row as safer alternative',
          sets: [{ weightKg: 28, reps: 10, completed: true }, { weightKg: 30, reps: 10, completed: true }, { weightKg: 32, reps: 9, completed: true }] },
        { exerciseId: 'face_pull', suggestedWeightKg: 22.5, lastWeightKg: 20,
          sets: [{ weightKg: 20, reps: 15, completed: true }, { weightKg: 22.5, reps: 15, completed: true }, { weightKg: 22.5, reps: 12, completed: true }] },
        { exerciseId: 'cable_curl', suggestedWeightKg: 20, lastWeightKg: 18,
          substituteReason: 'AI swapped barbell curl (wrist strain risk noted) for cable curl',
          sets: [{ weightKg: 17.5, reps: 12, completed: true }, { weightKg: 20, reps: 12, completed: true }, { weightKg: 20, reps: 10, completed: true }] },
      ],
    },

    // Really bad session — AI deload triggered
    {
      id: 'seed_bad_2',
      date: daysAgo(16),
      name: 'Deload Week — Legs',
      reasoning: 'Two sessions in a row rated 1-2. Deload triggered. All weights reduced 15%, sets kept at 3. This is intentional recovery — your nervous system needs this to come back stronger next week.',
      completed: true, injuries: [], userGoal: 'hypertrophy', rating: 2, recoveryFeedback: 'tough',
      exercises: [
        { exerciseId: 'goblet_squat', suggestedWeightKg: 20, lastWeightKg: 16,
          notes: 'Deload: -15% from working weight',
          sets: [{ weightKg: 16, reps: 12, completed: true }, { weightKg: 18, reps: 12, completed: true }, { weightKg: 20, reps: 10, completed: true }] },
        { exerciseId: 'leg_press', suggestedWeightKg: 95, lastWeightKg: 115,
          notes: 'Deload: -15% from last session',
          sets: [{ weightKg: 85, reps: 10, completed: true }, { weightKg: 90, reps: 10, completed: true }, { weightKg: 95, reps: 8, completed: true }] },
        { exerciseId: 'glute_bridge', suggestedWeightKg: 0, lastWeightKg: 0,
          substituteReason: 'Replaced hip thrust — going bodyweight only during deload',
          sets: [{ weightKg: 0, reps: 20, completed: true }, { weightKg: 0, reps: 20, completed: true }, { weightKg: 0, reps: 18, completed: true }] },
      ],
    },

    // Incomplete session — user stopped early
    {
      id: 'seed_incomplete_1',
      date: daysAgo(11),
      name: 'Push Day — Cut Short',
      reasoning: 'Energy started high but dropped fast. Cut the session at 2 exercises — better to stop than grind through and risk injury.',
      completed: true, injuries: [], userGoal: 'strength', rating: 1, recoveryFeedback: 'overworked',
      exercises: [
        { exerciseId: 'barbell_bench_press', suggestedWeightKg: 82.5, lastWeightKg: 80,
          sets: [
            { weightKg: 75, reps: 6, completed: true },
            { weightKg: 80, reps: 4, completed: true },
            { weightKg: 82.5, reps: 2, completed: true },
          ] },
        { exerciseId: 'incline_dumbbell_press', suggestedWeightKg: 28, lastWeightKg: 26,
          sets: [
            { weightKg: 24, reps: 8, completed: true },
            { weightKg: 26, reps: 5, completed: false },
            { weightKg: 28, reps: 8, completed: false },
          ] },
      ],
    },
  ]

  persistWorkouts(workouts)
  localStorage.setItem(SEEDED_KEY, '1')
}
