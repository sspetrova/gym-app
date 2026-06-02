'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAllWorkouts } from '@/lib/storage'
import { getExerciseById, EXERCISES, MUSCLE_GROUP_COLORS } from '@/lib/exercises'
import type { Workout } from '@/lib/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const ALL_GROUPS = ['All', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core']

function groupByWeek(workouts: Workout[]): { label: string; workouts: Workout[] }[] {
  const groups: Record<string, Workout[]> = {}
  for (const w of workouts) {
    const d = new Date(w.date)
    // Get start of week (Monday)
    const day = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - day + 1)
    const key = monday.toISOString().split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, ws]) => {
      const monday = new Date(key)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const label = `${monday.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
      return { label, workouts: ws }
    })
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const [open, setOpen] = useState(false)
  const muscleGroups = Array.from(
    new Set(workout.exercises.flatMap((e) => getExerciseById(e.exerciseId)?.muscleGroups ?? []))
  )
  const totalVolume = workout.exercises.reduce(
    (s, ex) => s + ex.sets.filter((set) => set.completed).reduce((ss, set) => ss + set.weightKg * set.reps, 0),
    0
  )

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-press w-full p-4 text-left"
      >
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.04em' }}>
              {workout.name}
            </p>
            <p className="text-[#555] text-xs mt-0.5">
              {new Date(workout.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {muscleGroups.slice(0, 4).map((m) => (
                <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded-full ${MUSCLE_GROUP_COLORS[m] ?? 'bg-[#222] text-[#888]'}`}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right ml-3">
            <p className="text-[#00FF87] text-sm font-semibold">{workout.exercises.length} ex</p>
            <p className="text-[#555] text-xs">{Math.round(totalVolume)} kg</p>
            <p className="text-[#333] text-lg mt-1">{open ? '▲' : '▼'}</p>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1a1a1a] px-4 pb-4 pt-3 space-y-3 animate-fade-in" style={{ opacity: 0 }}>
          {workout.exercises.map((ex) => {
            const exercise = getExerciseById(ex.exerciseId)
            const completedSets = ex.sets.filter((s) => s.completed)
            if (completedSets.length === 0) return null
            return (
              <div key={ex.exerciseId}>
                <p className="text-white text-sm font-medium mb-1">{exercise?.name ?? ex.exerciseId}</p>
                <div className="flex flex-wrap gap-1.5">
                  {completedSets.map((set, i) => (
                    <span key={i} className="text-[#555] text-xs bg-[#111] px-2 py-1 rounded-lg">
                      {set.weightKg}kg × {set.reps}
                    </span>
                  ))}
                </div>
                {ex.substituteReason && (
                  <p className="text-yellow-600/70 text-xs mt-1 italic">⚠ {ex.substituteReason}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-xl px-3 py-2 text-xs">
        <p className="text-[#888] mb-0.5">{label}</p>
        <p className="text-[#00FF87] font-bold">{payload[0].value} kg</p>
      </div>
    )
  }
  return null
}

export default function History() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [filter, setFilter] = useState('All')
  const [chartExercise, setChartExercise] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setWorkouts(getAllWorkouts().filter((w) => w.completed))
    setMounted(true)
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'All') return workouts
    return workouts.filter((w) =>
      w.exercises.some((ex) =>
        getExerciseById(ex.exerciseId)?.muscleGroups.includes(filter)
      )
    )
  }, [workouts, filter])

  const weeks = useMemo(() => groupByWeek(filtered), [filtered])

  // Exercises that appear in history (for chart dropdown)
  const availableExercises = useMemo(() => {
    const ids = new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))
    return Array.from(ids).map((id) => ({ id, name: getExerciseById(id)?.name ?? id }))
  }, [workouts])

  // Chart data for selected exercise
  const chartData = useMemo(() => {
    if (!chartExercise) return []
    return workouts
      .filter((w) => w.exercises.some((e) => e.exerciseId === chartExercise))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => {
        const ex = w.exercises.find((e) => e.exerciseId === chartExercise)!
        const maxWeight = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.weightKg), 0)
        return {
          date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          weight: maxWeight,
        }
      })
      .filter((d) => d.weight > 0)
  }, [workouts, chartExercise])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00FF87] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-10 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up" style={{ opacity: 0 }}>
        <button onClick={() => router.push('/')} className="text-[#555] text-sm">
          ← Back
        </button>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.05em' }}>
          HISTORY
        </h1>
        <div className="w-12" />
      </div>

      {/* PR Chart */}
      <div
        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 mb-5 animate-slide-up"
        style={{ animationDelay: '70ms', opacity: 0 }}
      >
        <p className="text-[#444] text-[10px] uppercase tracking-widest mb-3">PR Progression Chart</p>
        <select
          value={chartExercise}
          onChange={(e) => setChartExercise(e.target.value)}
          className="w-full bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-white text-sm mb-4 focus:outline-none"
        >
          <option value="">Select an exercise...</option>
          {availableExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        {chartExercise && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#00FF87"
                strokeWidth={2}
                dot={{ fill: '#00FF87', r: 4 }}
                activeDot={{ r: 6, fill: '#00FF87' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : chartExercise ? (
          <p className="text-[#333] text-sm text-center py-6">No data for this exercise yet</p>
        ) : (
          <p className="text-[#333] text-sm text-center py-6">Select an exercise to see progress</p>
        )}
      </div>

      {/* Muscle group filter */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-5 animate-slide-up"
        style={{ animationDelay: '130ms', opacity: 0, scrollbarWidth: 'none' }}
      >
        {ALL_GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`btn-press flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${
              filter === g
                ? 'border-[#00FF87] bg-[#00FF87]/15 text-[#00FF87]'
                : 'border-[#222] text-[#555]'
            }`}
          >
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {/* Grouped workouts */}
      {weeks.length === 0 ? (
        <div className="text-center py-16 animate-fade-in" style={{ opacity: 0 }}>
          <p className="text-5xl mb-4">💪</p>
          <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '0.05em' }}>
            NO WORKOUTS YET
          </p>
          <p className="text-[#444] text-sm mt-2">Let&apos;s change that.</p>
          <button
            onClick={() => router.push('/workout/new')}
            className="btn-press mt-6 px-6 py-3 rounded-xl text-black text-sm font-bold"
            style={{ background: '#00FF87' }}
          >
            Start First Workout
          </button>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ animationDelay: '190ms', opacity: 0 }}>
          {weeks.map((week) => (
            <div key={week.label} className="mb-6">
              <p className="text-[#444] text-xs uppercase tracking-widest mb-3">{week.label}</p>
              {week.workouts.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
