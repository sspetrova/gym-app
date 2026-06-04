'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWorkout, setCurrentWorkout } from '@/lib/storage'
import { substituteExercise } from '@/lib/ai'
import { getExerciseById, EXERCISES, MUSCLE_GROUP_COLORS } from '@/lib/exercises'
import { getLastPerformance } from '@/lib/storage'
import type { Workout } from '@/lib/types'

const SWAP_REASONS = ['Pain / discomfort', 'No equipment', 'Too easy', 'Too hard']

const MUSCLE_COLORS: Record<string, { bg: string; color: string }> = {
  chest:     { bg: '#EFF6FF', color: '#2563eb' },
  back:      { bg: '#F3EFFF', color: '#7c3aed' },
  shoulders: { bg: '#FFFBEB', color: '#d97706' },
  biceps:    { bg: '#FEF0F7', color: '#db2777' },
  triceps:   { bg: '#FFF4ED', color: '#ea580c' },
  legs:      { bg: '#FFF1F2', color: '#e11d48' },
  glutes:    { bg: '#F0FDF4', color: '#16a34a' },
  core:      { bg: '#EDFAF8', color: '#0d9488' },
}

function SwapModal({ exerciseId, workoutExerciseIds, onConfirm, onCancel }: {
  exerciseId: string; workoutExerciseIds: string[]
  onConfirm: (newId: string, reason: string) => void; onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ exerciseId: string; reason: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ex = getExerciseById(exerciseId)

  async function handleSearch() {
    const finalReason = customReason || reason
    if (!finalReason) return
    setLoading(true); setError(null)
    try {
      const sub = await substituteExercise({ exerciseId, reason: finalReason, currentWorkout: workoutExerciseIds })
      setResult(sub)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  const newEx = result ? getExerciseById(result.exerciseId) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', opacity: 0 }}>
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 animate-slide-up card-shadow-lg" style={{ background: '#fff', opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontStyle: 'italic' }}>Swap exercise</h2>
          <button onClick={onCancel} className="btn-press w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: '#E8E4DC', color: '#555' }}>×</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#444', marginBottom: 16 }}>
          Replacing: <strong style={{ color: '#1a1a1a' }}>{ex?.name}</strong>
        </p>

        {!result ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {SWAP_REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)}
                  className="btn-press px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200"
                  style={{ background: reason === r ? '#1a1a1a' : '#fff', borderColor: reason === r ? '#1a1a1a' : '#E8E4DC', color: reason === r ? '#fff' : '#555' }}>
                  {r}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Or describe the reason..." value={customReason} onChange={(e) => setCustomReason(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none"
              style={{ background: '#fff', border: '2px solid #E8E4DC', fontFamily: 'DM Sans, sans-serif' }} />
            {error && <p className="text-sm mb-3" style={{ color: '#e11d48' }}>{error}</p>}
            <button onClick={handleSearch} disabled={!reason && !customReason}
              className="btn-press w-full py-4 rounded-2xl text-white font-semibold disabled:opacity-30 card-shadow"
              style={{ background: '#1a1a1a' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  AI thinking...
                </span>
              ) : '⚡ Find substitute'}
            </button>
          </>
        ) : (
          <div className="animate-scale-in" style={{ opacity: 0 }}>
            <div className="rounded-2xl p-4 mb-4 card-shadow" style={{ background: '#E8FBF0', border: '1.5px solid #2DD87A' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#16a34a', letterSpacing: '0.15em', marginBottom: 6 }}>AI SUGGESTS</p>
              <p className="font-display" style={{ fontSize: '1.4rem', fontStyle: 'italic', marginBottom: 4 }}>{newEx?.name ?? result.exerciseId}</p>
              <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>{result.reason}</p>
              {newEx && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {newEx.muscleGroups.map((m) => {
                    const c = MUSCLE_COLORS[m] ?? { bg: '#F2F0EB', color: '#888' }
                    return <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.color }}>{m}</span>
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-press flex-1 py-3.5 rounded-2xl font-medium text-sm" style={{ background: '#fff', color: '#555' }}>Cancel</button>
              <button onClick={() => setResult(null)} className="btn-press flex-1 py-3.5 rounded-2xl font-medium text-sm" style={{ background: '#F3EFFF', color: '#7c3aed' }}>Try another →</button>
              <button onClick={() => onConfirm(result.exerciseId, result.reason)} className="btn-press flex-1 py-3.5 rounded-2xl font-semibold text-white text-sm" style={{ background: '#1a1a1a' }}>Confirm</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SetRow({ setIndex, weightKg, reps, completed, onUpdate, onToggle, onDelete, canDelete }: {
  setIndex: number; weightKg: number; reps: number; completed: boolean
  onUpdate: (w: number, r: number) => void; onToggle: () => void
  onDelete: () => void; canDelete: boolean
}) {
  return (
    <div className={`flex items-center gap-2 py-2 transition-opacity duration-200 ${completed ? 'opacity-50' : ''}`}>
      <span className="w-6 text-center text-sm font-bold" style={{ color: '#999' }}>{setIndex + 1}</span>

      <div className="flex-1 flex items-center rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
        <button onClick={() => onUpdate(Math.max(0, weightKg - 2.5), reps)} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#666' }}>−</button>
        <div className="flex-1 flex items-baseline gap-0.5 pl-1">
          <input type="number" value={weightKg} onChange={(e) => onUpdate(Number(e.target.value) || 0, reps)}
            onFocus={(e) => e.target.select()}
            className="w-12 bg-transparent focus:outline-none font-bold text-left" style={{ fontSize: '1rem', color: '#1a1a1a' }} />
          <span style={{ fontSize: '0.65rem', color: '#777' }}>kg</span>
        </div>
        <button onClick={() => onUpdate(weightKg + 2.5, reps)} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#666' }}>+</button>
      </div>

      <span style={{ color: '#999' }}>×</span>

      <div className="flex-1 flex items-center rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
        <button onClick={() => onUpdate(weightKg, Math.max(1, reps - 1))} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#666' }}>−</button>
        <div className="flex-1 flex items-baseline gap-0.5 pl-1">
          <input type="number" value={reps} onChange={(e) => onUpdate(weightKg, Number(e.target.value) || 1)}
            onFocus={(e) => e.target.select()}
            className="w-10 bg-transparent focus:outline-none font-bold text-left" style={{ fontSize: '1rem', color: '#1a1a1a' }} />
          <span style={{ fontSize: '0.65rem', color: '#777' }}>rep</span>
        </div>
        <button onClick={() => onUpdate(weightKg, reps + 1)} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#666' }}>+</button>
      </div>

      <button onClick={onToggle}
        className="btn-press w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition-all duration-200"
        style={{ background: completed ? '#E3FC87' : '#DAEEFF', color: completed ? '#253A82' : '#88A2FF', fontSize: '1rem' }}>
        ✓
      </button>

      {canDelete && (
        <button onClick={onDelete}
          className="btn-press w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
          style={{ background: '#FFF1F2', color: '#e11d48' }}>
          ×
        </button>
      )}
    </div>
  )
}

const ALL_MUSCLE_GROUPS = ['All', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core']

function AddExerciseModal({ currentExerciseIds, userGoal, onAdd, onClose }: {
  currentExerciseIds: string[]
  userGoal: string
  onAdd: (exerciseId: string, sets: number, reps: number, suggestedWeightKg: number, reason?: string) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'ai' | 'browse'>('ai')
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ exerciseId: string; sets: number; reps: number; suggestedWeightKg: number; reason: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const available = EXERCISES.filter((e) => {
    if (currentExerciseIds.includes(e.id)) return false
    if (muscleFilter === 'All') return true
    return e.muscleGroups.includes(muscleFilter)
  })

  async function handleAISuggest() {
    setLoading(true); setError(null); setAiResult(null)
    try {
      const res = await fetch('/api/suggest-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentExerciseIds, userGoal, energy: 3, lastWeights: {} }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAiResult(data)
    } catch {
      setError('Could not get AI suggestion. Pick one yourself!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-t-3xl flex flex-col" style={{ background: '#fff', maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display" style={{ fontSize: '1.5rem', fontStyle: 'italic' }}>Add exercise</h2>
          <button onClick={onClose} className="btn-press w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: '#E8E4DC', color: '#555' }}>×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 mb-3">
          {(['ai', 'browse'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="btn-press flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{ background: tab === t ? '#1a1a1a' : '#fff', color: tab === t ? '#fff' : '#888' }}>
              {t === 'ai' ? '⚡ AI Pick' : '🔍 Browse'}
            </button>
          ))}
        </div>

        {/* AI Tab */}
        {tab === 'ai' && (
          <div className="px-5 pb-6">
            {!aiResult && !loading && (
              <>
                <p style={{ fontSize: '0.85rem', color: '#444', marginBottom: 16, lineHeight: 1.5 }}>
                  AI will pick the best exercise to add based on what you've already done today.
                </p>
                <button onClick={handleAISuggest}
                  className="btn-press w-full py-4 rounded-2xl font-semibold text-white"
                  style={{ background: '#1a1a1a' }}>
                  ⚡ Suggest an exercise
                </button>
              </>
            )}
            {loading && (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full mx-auto mb-4 animate-spin" style={{ border: '3px solid #1a1a1a', borderTopColor: 'transparent' }} />
                <p style={{ fontSize: '0.85rem', color: '#444' }}>AI thinking...</p>
              </div>
            )}
            {error && <p style={{ fontSize: '0.85rem', color: '#e11d48', marginBottom: 12 }}>{error}</p>}
            {aiResult && (() => {
              const ex = getExerciseById(aiResult.exerciseId)
              return (
                <div className="animate-scale-in" style={{ opacity: 0 }}>
                  <div className="rounded-2xl p-4 mb-4" style={{ background: '#E8FBF0', border: '1.5px solid #2DD87A' }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#16a34a', letterSpacing: '0.15em', marginBottom: 6 }}>AI SUGGESTS</p>
                    <p className="font-display" style={{ fontSize: '1.3rem', fontStyle: 'italic' }}>{ex?.name ?? aiResult.exerciseId}</p>
                    <p style={{ fontSize: '0.8rem', color: '#555', marginTop: 4, lineHeight: 1.5 }}>{aiResult.reason}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {ex?.muscleGroups.map((m) => {
                        const c = MUSCLE_COLORS[m] ?? { bg: '#F2F0EB', color: '#888' }
                        return <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.color }}>{m}</span>
                      })}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#2DD87A', fontWeight: 600, marginTop: 8 }}>
                      {aiResult.sets} sets × {aiResult.reps} reps @ {aiResult.suggestedWeightKg}kg
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setAiResult(null)} className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-medium"
                      style={{ background: '#fff', color: '#555' }}>Try again</button>
                    <button onClick={() => onAdd(aiResult.exerciseId, aiResult.sets, aiResult.reps, aiResult.suggestedWeightKg, aiResult.reason)}
                      className="btn-press flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white"
                      style={{ background: '#1a1a1a' }}>Add it ✓</button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Browse Tab */}
        {tab === 'browse' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Muscle filter — wrapped grid */}
            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {ALL_MUSCLE_GROUPS.map((g) => (
                <button key={g} onClick={() => setMuscleFilter(g)}
                  className="btn-press px-4 py-2 rounded-2xl text-sm font-semibold"
                  style={{ background: muscleFilter === g ? '#1a1a1a' : '#fff', color: muscleFilter === g ? '#fff' : '#555' }}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
            {/* List */}
            <div className="overflow-y-auto px-5 pb-8 space-y-2">
              {available.map((ex) => (
                <button key={ex.id} onClick={() => onAdd(ex.id, 3, 10, getLastPerformance(ex.id)?.weightKg ?? 0)}
                  className="btn-press w-full p-4 rounded-2xl text-left"
                  style={{ background: '#fff' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>{ex.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ex.muscleGroups.map((m) => {
                      const c = MUSCLE_COLORS[m] ?? { bg: '#F2F0EB', color: '#888' }
                      return <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.color }}>{m}</span>
                    })}
                  </div>
                </button>
              ))}
              {available.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#bbb', textAlign: 'center', padding: '20px 0' }}>
                  All {muscleFilter} exercises already in workout
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ActiveWorkout() {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const w = getCurrentWorkout()
    if (!w) { router.replace('/'); return }
    setWorkout(w); setMounted(true)
  }, [router])

  function updateWorkout(updated: Workout) { setWorkout(updated); setCurrentWorkout(updated) }

  function updateSet(exIdx: number, setIdx: number, weightKg: number, reps: number) {
    if (!workout) return
    updateWorkout({ ...workout, exercises: workout.exercises.map((ex, i) => i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, weightKg, reps } : s) } : ex) })
  }

  function toggleSet(exIdx: number, setIdx: number) {
    if (!workout) return
    updateWorkout({ ...workout, exercises: workout.exercises.map((ex, i) => i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, completed: !s.completed } : s) } : ex) })
  }

  function addSet(exIdx: number) {
    if (!workout) return
    const ex = workout.exercises[exIdx]
    const lastSet = ex.sets[ex.sets.length - 1]
    const newSet = { weightKg: lastSet?.weightKg ?? ex.suggestedWeightKg, reps: lastSet?.reps ?? 8, completed: false }
    updateWorkout({ ...workout, exercises: workout.exercises.map((e, i) => i === exIdx ? { ...e, sets: [...e.sets, newSet] } : e) })
  }

  function deleteSet(exIdx: number, setIdx: number) {
    if (!workout) return
    const ex = workout.exercises[exIdx]
    if (ex.sets.length <= 1) return
    updateWorkout({ ...workout, exercises: workout.exercises.map((e, i) => i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e) })
  }

  function addExercise(exerciseId: string, sets: number, reps: number, suggestedWeightKg: number, reason?: string) {
    if (!workout) return
    const newEx = {
      exerciseId,
      suggestedWeightKg: suggestedWeightKg || 0,
      lastWeightKg: suggestedWeightKg || null,
      substituteReason: reason,
      sets: Array.from({ length: sets }, (_, i) => {
        const increment = suggestedWeightKg >= 60 ? 5 : 2.5
        const stepsFromEnd = sets - 1 - i
        const w = Math.max(0, Math.round((suggestedWeightKg - stepsFromEnd * increment) / 2.5) * 2.5)
        return { weightKg: w || suggestedWeightKg, reps, completed: false }
      }),
    }
    updateWorkout({ ...workout, exercises: [...workout.exercises, newEx] })
    setShowAddExercise(false)
  }

  function handleSwapConfirm(newExerciseId: string, reason: string) {
    if (!workout || !swapTarget) return
    updateWorkout({ ...workout, exercises: workout.exercises.map((ex) => ex.exerciseId !== swapTarget ? ex : { ...ex, exerciseId: newExerciseId, substituteReason: reason, sets: ex.sets.map((s) => ({ ...s, completed: false })) }) })
    setSwapTarget(null)
  }

  const totalSets = workout?.exercises.reduce((s, ex) => s + ex.sets.length, 0) ?? 0
  const completedSets = workout?.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.completed).length, 0) ?? 0
  const allDone = totalSets > 0 && completedSets === totalSets
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  if (!mounted || !workout) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#C0E0FF' }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #7C5CBF', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-36" style={{ background: '#C0E0FF' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: 'rgba(192,224,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #A8CFEE' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push('/')} className="btn-press w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base" style={{ background: '#fff', color: '#253A82' }}>
            ✕
          </button>
          <p className="font-display" style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#253A82' }}>{workout.name}</p>
          <div className="px-3 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap" style={{ background: completedSets === totalSets ? '#E3FC87' : '#253A82', color: completedSets === totalSets ? '#253A82' : '#fff' }}>
            {completedSets}/{totalSets}
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#C5B4F0' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#88A2FF,#E3FC87)' }} />
        </div>
      </div>

      {/* AI Reasoning */}
      {workout.reasoning && (
        <div className="mx-4 mt-4 rounded-2xl p-4 card-shadow" style={{ background: '#fff' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#88A2FF' }} />
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#88A2FF', letterSpacing: '0.15em' }}>AI REASONING</p>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.6 }}>{workout.reasoning}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="px-4 pt-4 space-y-3">
        {workout.exercises.map((ex, exIdx) => {
          const exercise = getExerciseById(ex.exerciseId)
          if (!exercise) return null
          const exCompleted = ex.sets.every((s) => s.completed)

          return (
            <div key={`${ex.exerciseId}_${exIdx}`} className="rounded-3xl overflow-hidden card-shadow transition-all duration-300"
              style={{ background: exCompleted ? '#F0FADF' : '#fff', border: exCompleted ? '2px solid #E3FC87' : '2px solid transparent' }}>
              <div className="p-4 pb-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-3">
                    <p className="font-display" style={{ fontSize: '1.3rem', fontStyle: 'italic', lineHeight: 1.1 }}>{exercise.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {exercise.muscleGroups.map((m) => {
                        const c = MUSCLE_COLORS[m] ?? { bg: '#F2F0EB', color: '#888' }
                        return <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: c.bg, color: c.color }}>{m}</span>
                      })}
                    </div>
                    {exercise.instructions && (
                      <p style={{ fontSize: '0.73rem', color: '#555', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>💡 {exercise.instructions}</p>
                    )}
                  </div>
                  <button onClick={() => setSwapTarget(ex.exerciseId)}
                    className="btn-press flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium"
                    style={{ background: '#fff', color: '#888' }}>
                    ⇄ Swap
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {ex.lastWeightKg != null && ex.lastWeightKg > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Last: {ex.lastWeightKg} kg</span>
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#88A2FF' }}>AI: {ex.suggestedWeightKg} kg</span>
                  {ex.notes && (
                    <span style={{ fontSize: '0.7rem', color: '#88A2FF', background: '#EEF2FF', borderRadius: 8, padding: '2px 8px', fontStyle: 'italic' }}>
                      {ex.notes}
                    </span>
                  )}
                </div>

                {ex.substituteReason && (
                  <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: 5, fontStyle: 'italic' }}>⚠ {ex.substituteReason}</p>
                )}
              </div>

              <div className="flex items-center gap-2 px-4 pb-1">
                <span className="w-6" />
                <span className="flex-1 text-center" style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '0.12em', fontWeight: 700 }}>WEIGHT</span>
                <span className="w-5" />
                <span className="flex-1 text-center" style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '0.12em', fontWeight: 700 }}>REPS</span>
                <span className="w-11" />
                <span className="w-8" />
              </div>

              <div className="px-3 pb-2">
                {ex.sets.map((set, setIdx) => (
                  <SetRow key={setIdx} setIndex={setIdx} weightKg={set.weightKg} reps={set.reps} completed={set.completed}
                    onUpdate={(w, r) => updateSet(exIdx, setIdx, w, r)} onToggle={() => toggleSet(exIdx, setIdx)}
                    onDelete={() => deleteSet(exIdx, setIdx)} canDelete={ex.sets.length > 1} />
                ))}
                <button onClick={() => addSet(exIdx)}
                  className="btn-press w-full mt-1 mb-2 py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: '#fff', color: '#888' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add set
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Finish */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-4" style={{ background: 'linear-gradient(to top, #C0E0FF 70%, transparent)' }}>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddExercise(true)}
            className="btn-press w-14 h-14 rounded-2xl flex items-center justify-center card-shadow flex-shrink-0"
            style={{ background: '#fff', color: '#1a1a1a', fontSize: '1.6rem', fontWeight: 300 }}>
            +
          </button>
          <button
            onClick={() => { setCurrentWorkout({ ...workout, completed: true }); router.push('/workout/done') }}
            className="btn-press flex-1 py-4 rounded-2xl font-semibold transition-all duration-300 card-shadow-lg"
            style={{
              background: allDone ? '#253A82' : '#88A2FF',
              color: '#fff',
              fontSize: '1rem',
            }}
          >
            {allDone ? '🏆 Finish workout' : `${completedSets} of ${totalSets} sets done`}
          </button>
        </div>
      </div>

      {swapTarget && (
        <SwapModal exerciseId={swapTarget} workoutExerciseIds={workout.exercises.map((e) => e.exerciseId)}
          onConfirm={handleSwapConfirm} onCancel={() => setSwapTarget(null)} />
      )}

      {showAddExercise && (
        <AddExerciseModal
          currentExerciseIds={workout.exercises.map((e) => e.exerciseId)}
          userGoal={workout.userGoal ?? 'hypertrophy'}
          onAdd={addExercise}
          onClose={() => setShowAddExercise(false)}
        />
      )}
    </div>
  )
}
