import type { GeneratedWorkout, WorkoutSummary, CheckIn } from './types'

export async function generateWorkout(input: {
  checkin: CheckIn
  history: WorkoutSummary[]
  userGoal: string
  focusMuscles?: string[]
  userPreferences?: { name: string; favoriteSplits: string[]; defaultGoal: string }
}): Promise<GeneratedWorkout> {
  const res = await fetch('/api/generate-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to generate workout: ${await res.text()}`)
  return res.json()
}

export async function substituteExercise(input: {
  exerciseId: string
  reason: string
  currentWorkout: string[]
}): Promise<{ exerciseId: string; reason: string }> {
  const res = await fetch('/api/substitute-exercise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to substitute: ${await res.text()}`)
  return res.json()
}
