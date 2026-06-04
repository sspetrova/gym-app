'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAllWorkouts, deleteWorkout } from '@/lib/storage'
import { getExerciseById, EXERCISES } from '@/lib/exercises'
import type { Workout } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ALL_GROUPS = ['All', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core']

const GROUP_COLORS: Record<string, string> = {
  chest: '#60A5FA', back: '#A78BFA', shoulders: '#F5C842',
  biceps: '#F472B6', triceps: '#FB923C', legs: '#F87171',
  glutes: '#2DD87A', core: '#34D1BF',
}

function groupByWeek(workouts: Workout[]) {
  const groups: Record<string, Workout[]> = {}
  for (const w of workouts) {
    const d = new Date(w.date)
    const day = d.getDay() || 7
    const monday = new Date(d); monday.setDate(d.getDate() - day + 1)
    const key = monday.toISOString().split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([key, ws]) => {
    const monday = new Date(key)
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const label = `${monday.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
    return { label, workouts: ws }
  })
}

const RATING_EMOJIS = ['😴','😐','🙂','😤','🔥']

function WorkoutCard({ workout, onDelete }: { workout: Workout; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const muscleGroups = Array.from(new Set(workout.exercises.flatMap((e) => getExerciseById(e.exerciseId)?.muscleGroups ?? [])))

  return (
    <div className="rounded-2xl overflow-hidden mb-3 card-shadow" style={{ background: '#fff' }}>
      <button onClick={() => setOpen((o) => !o)} className="btn-press w-full p-4 text-left">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display" style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>{workout.name}</p>
            <p style={{ fontSize: '0.75rem', color: '#555', marginTop: 2 }}>
              {new Date(workout.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {muscleGroups.slice(0, 4).map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: GROUP_COLORS[m] + '20', color: GROUP_COLORS[m] }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right ml-3 flex flex-col items-end gap-1">
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2DD87A' }}>{workout.exercises.length} ex</p>
            {workout.rating && (
              <span style={{ fontSize: '1.1rem' }}>{RATING_EMOJIS[workout.rating - 1]}</span>
            )}
            <p style={{ fontSize: '1.2rem', color: '#ddd', marginTop: 2 }}>{open ? '▲' : '▼'}</p>
          </div>
        </div>
      </button>
      {/* Delete row */}
      {open && !confirmDelete && (
        <div className="px-4 pb-3 flex justify-end">
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#FFF1F2', color: '#e11d48' }}>
            🗑 Delete workout
          </button>
        </div>
      )}
      {open && confirmDelete && (
        <div className="px-4 pb-3 flex items-center gap-2 justify-end">
          <p style={{ fontSize: '0.78rem', color: '#555' }}>Remove this session?</p>
          <button onClick={() => setConfirmDelete(false)} className="btn-press px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: '#F2F0EB', color: '#555' }}>Cancel</button>
          <button onClick={() => onDelete(workout.id)} className="btn-press px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: '#e11d48', color: '#fff' }}>Delete</button>
        </div>
      )}

      {open && (
        <div className="border-t px-4 pb-4 pt-3 animate-fade-in" style={{ borderColor: '#F2F0EB', opacity: 0 }}>

          {/* AI reasoning */}
          {workout.reasoning && (
            <div className="rounded-2xl p-3 mb-4" style={{ background: '#F0FDF4', border: '1.5px solid #2DD87A' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2DD87A' }} />
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#16a34a', letterSpacing: '0.15em' }}>AI NOTES</p>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.55 }}>{workout.reasoning}</p>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-3">
            {workout.exercises.map((ex) => {
              const exercise = getExerciseById(ex.exerciseId)
              const completedSets = ex.sets.filter((s) => s.completed)
              if (completedSets.length === 0) return null
              return (
                <div key={ex.exerciseId}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{exercise?.name ?? ex.exerciseId}</p>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: '#EDE9F8', color: '#7C5CBF' }}>
                      {completedSets.length} sets
                    </span>
                  </div>
                  {ex.substituteReason && (
                    <p style={{ fontSize: '0.72rem', color: '#d97706', marginBottom: 5, fontStyle: 'italic' }}>⚠ {ex.substituteReason}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {completedSets.map((set, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-xl font-medium" style={{ background: '#F2F0EB', color: '#555' }}>
                        {set.weightKg}kg × {set.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl px-3 py-2 text-xs card-shadow" style={{ background: '#fff' }}>
        <p style={{ color: '#444', marginBottom: 2 }}>{label}</p>
        <p style={{ fontWeight: 700, color: '#1a1a1a' }}>{payload[0].value} kg</p>
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

  useEffect(() => { setWorkouts(getAllWorkouts().filter((w) => w.completed)); setMounted(true) }, [])

  function handleDelete(id: string) {
    deleteWorkout(id)
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
  }

  const filtered = useMemo(() => filter === 'All' ? workouts : workouts.filter((w) => w.exercises.some((ex) => getExerciseById(ex.exerciseId)?.muscleGroups.includes(filter))), [workouts, filter])
  const weeks = useMemo(() => groupByWeek(filtered), [filtered])

  const availableExercises = useMemo(() => {
    const ids = new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))
    return Array.from(ids).map((id) => ({ id, name: getExerciseById(id)?.name ?? id }))
  }, [workouts])

  const chartData = useMemo(() => {
    if (!chartExercise) return []
    return workouts.filter((w) => w.exercises.some((e) => e.exerciseId === chartExercise))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => {
        const ex = w.exercises.find((e) => e.exerciseId === chartExercise)!
        const maxWeight = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.weightKg), 0)
        return { date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }), weight: maxWeight }
      }).filter((d) => d.weight > 0)
  }, [workouts, chartExercise])

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#EAE2FB' }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #7C5CBF', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen px-4 pt-10 pb-28" style={{ background: '#EAE2FB' }}>
      <div className="flex items-center justify-between mb-6 animate-slide-up" style={{ opacity: 0 }}>
        <h1 className="font-display" style={{ fontSize: '2.2rem', fontStyle: 'italic' }}>Progress</h1>
        <div className="px-3 py-1.5 rounded-xl text-sm font-semibold card-shadow" style={{ background: '#fff', color: '#1a1a1a' }}>
          {workouts.length} sessions
        </div>
      </div>

      {/* PR Chart */}
      <div className="rounded-3xl p-5 mb-4 card-shadow animate-slide-up" style={{ animationDelay: '60ms', opacity: 0, background: '#fff' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#666', letterSpacing: '0.15em', marginBottom: 12 }}>PR PROGRESSION</p>
        <select value={chartExercise} onChange={(e) => setChartExercise(e.target.value)}
          className="w-full rounded-2xl px-3 py-2.5 text-sm mb-4 focus:outline-none font-medium"
          style={{ background: '#F2F0EB', border: 'none', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
          <option value="">Select an exercise...</option>
          {availableExercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
        {chartExercise && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F0EB" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="weight" stroke="#1a1a1a" strokeWidth={2.5} dot={{ fill: '#1a1a1a', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', padding: '20px 0' }}>
            {chartExercise ? 'No data yet' : 'Select an exercise to see progress'}
          </p>
        )}
      </div>

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 animate-slide-up" style={{ animationDelay: '110ms', opacity: 0, scrollbarWidth: 'none' }}>
        {ALL_GROUPS.map((g) => (
          <button key={g} onClick={() => setFilter(g)}
            className="btn-press flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-semibold transition-all duration-200"
            style={{
              background: filter === g ? '#1a1a1a' : '#fff',
              color: filter === g ? '#fff' : '#444',
            }}>
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {/* Grouped workouts */}
      {weeks.length === 0 ? (
        <div className="text-center py-16 animate-fade-in" style={{ opacity: 0 }}>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>💪</p>
          <p className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic' }}>No workouts yet</p>
          <p style={{ fontSize: '0.85rem', color: '#555', marginTop: 6 }}>Let&apos;s change that.</p>
          <button onClick={() => router.push('/workout/new')}
            className="btn-press mt-6 px-6 py-3 rounded-2xl font-semibold text-white card-shadow"
            style={{ background: '#1a1a1a' }}>
            Start first workout
          </button>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ animationDelay: '160ms', opacity: 0 }}>
          {weeks.map((week) => (
            <div key={week.label} className="mb-6">
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6B4FA8', letterSpacing: '0.15em', marginBottom: 10 }}>{week.label.toUpperCase()}</p>
              {week.workouts.map((w) => <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
