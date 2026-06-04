export type WorkoutSet = {
  weightKg: number
  reps: number
  completed: boolean
  isWarmup?: boolean
}

export type WorkoutExercise = {
  exerciseId: string
  sets: WorkoutSet[]
  suggestedWeightKg: number
  lastWeightKg: number | null
  substituteReason?: string
  notes?: string
}

export type Workout = {
  id: string
  date: string // ISO string
  name: string
  reasoning: string
  exercises: WorkoutExercise[]
  completed: boolean
  injuries: string[]
  userGoal: string
  rating?: number           // 1–5 post-session rating
  recoveryFeedback?: string // e.g. 'great' | 'tough' | 'overworked' | 'easy'
}

export type WeeklyGoal = {
  week: string    // ISO week key e.g. "2026-W23"
  goal: string
  achieved: boolean
}

export type CheckIn = {
  energy: number      // 1-5
  sleep: number       // 1-5
  soreness: { upper: number; lower: number; core: number }
  injuries: string[]
  notes: string
  durationMin: number  // 30 | 45 | 60 | 90
  yesterdayActivity: string  // e.g. 'rest' | 'running' | 'cycling' | 'football' | 'swimming' | 'yoga'
  focusMuscles: string[]    // e.g. ['chest', 'triceps'] — empty means AI decides
}

export type GeneratedExercise = {
  exerciseId: string
  sets: number
  reps: number
  suggestedWeightKg: number
  lastWeightKg: number | null
  substituteReason?: string
  notes?: string
}

export type GeneratedWorkout = {
  workoutName: string
  reasoning: string
  exercises: GeneratedExercise[]
}

export type WorkoutSummary = {
  id: string
  date: string
  name: string
  muscleGroups: string[]
  exercises: {
    exerciseId: string
    maxWeightKg: number
    totalSets: number
    avgReps: number
    totalVolume: number
  }[]
  injuries: string[]
  durationMin?: number
  rating?: number
  recoveryFeedback?: string
}

export type UserPreferences = {
  name: string
  favoriteSplits: string[]    // e.g. ['push_pull_legs', 'upper_lower']
  favoriteExercises: string[] // exercise IDs
  defaultGoal: string         // 'strength' | 'hypertrophy' | 'endurance'
}
