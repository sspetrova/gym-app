export type WorkoutSet = {
  weightKg: number
  reps: number
  completed: boolean
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
}

export type CheckIn = {
  energy: number      // 1-5
  sleep: number       // 1-5
  soreness: { upper: number; lower: number; core: number }
  injuries: string[]
  notes: string
}

export type GeneratedExercise = {
  exerciseId: string
  sets: number
  reps: number
  suggestedWeightKg: number
  lastWeightKg: number | null
  substituteReason?: string
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
  exercises: { exerciseId: string; maxWeightKg: number; totalSets: number }[]
  injuries: string[]
}
