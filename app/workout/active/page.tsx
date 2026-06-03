'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWorkout, setCurrentWorkout } from '@/lib/storage'
import { substituteExercise } from '@/lib/ai'
import { getExerciseById, MUSCLE_GROUP_COLORS } from '@/lib/exercises'
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
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 animate-slide-up card-shadow-lg" style={{ background: '#F2F0EB', opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontStyle: 'italic' }}>Swap exercise</h2>
          <button onClick={onCancel} className="btn-press w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: '#E8E4DC', color: '#555' }}>×</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 16 }}>
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
              <button onClick={() => onConfirm(result.exerciseId, result.reason)} className="btn-press flex-1 py-3.5 rounded-2xl font-semibold text-white text-sm" style={{ background: '#1a1a1a' }}>Confirm</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SetRow({ setIndex, weightKg, reps, completed, onUpdate, onToggle }: {
  setIndex: number; weightKg: number; reps: number; completed: boolean
  onUpdate: (w: number, r: number) => void; onToggle: () => void
}) {
  return (
    <div className={`flex items-center gap-2 py-2 transition-opacity duration-200 ${completed ? 'opacity-50' : ''}`}>
      <span className="w-6 text-center text-sm font-bold" style={{ color: '#ccc' }}>{setIndex + 1}</span>

      <div className="flex-1 flex items-center rounded-2xl overflow-hidden" style={{ background: '#F2F0EB' }}>
        <button onClick={() => onUpdate(Math.max(0, weightKg - 2.5), reps)} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#aaa' }}>−</button>
        <input type="number" value={weightKg} onChange={(e) => onUpdate(Number(e.target.value) || 0, reps)}
          className="flex-1 bg-transparent text-center focus:outline-none font-bold" style={{ fontSize: '1rem', color: '#1a1a1a' }} />
        <span className="text-xs pr-2" style={{ color: '#bbb' }}>kg</span>
        <button onClick={() => onUpdate(weightKg + 2.5, reps)} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#aaa' }}>+</button>
      </div>

      <span style={{ color: '#ddd' }}>×</span>

      <div className="flex-1 flex items-center rounded-2xl overflow-hidden" style={{ background: '#F2F0EB' }}>
        <button onClick={() => onUpdate(weightKg, Math.max(1, reps - 1))} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#aaa' }}>−</button>
        <input type="number" value={reps} onChange={(e) => onUpdate(weightKg, Number(e.target.value) || 1)}
          className="flex-1 bg-transparent text-center focus:outline-none font-bold" style={{ fontSize: '1rem', color: '#1a1a1a' }} />
        <span className="text-xs pr-1" style={{ color: '#bbb' }}>rep</span>
        <button onClick={() => onUpdate(weightKg, reps + 1)} className="btn-press w-9 h-11 flex items-center justify-center text-xl font-light" style={{ color: '#aaa' }}>+</button>
      </div>

      <button onClick={onToggle}
        className="btn-press w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition-all duration-200"
        style={{ background: completed ? '#2DD87A' : '#F2F0EB', color: completed ? '#fff' : '#ddd', fontSize: '1rem' }}>
        ✓
      </button>
    </div>
  )
}

export default function ActiveWorkout() {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0EB' }}>
      <div className="w-10 h-10 rounded-full border-3 border-black border-t-transparent animate-spin" style={{ borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-36" style={{ background: '#F2F0EB' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: 'rgba(242,240,235,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8E4DC' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push('/')} className="btn-press px-3 py-1.5 rounded-xl text-sm font-medium" style={{ background: '#fff', color: '#555' }}>
            ✕ Exit
          </button>
          <p className="font-display" style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>{workout.name}</p>
          <div className="px-3 py-1.5 rounded-xl text-sm font-bold" style={{ background: completedSets === totalSets ? '#E8FBF0' : '#F2F0EB', color: completedSets === totalSets ? '#16a34a' : '#888' }}>
            {completedSets}/{totalSets}
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8E4DC' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#2DD87A' }} />
        </div>
      </div>

      {/* AI Reasoning */}
      {workout.reasoning && (
        <div className="mx-4 mt-4 rounded-2xl p-4 card-shadow" style={{ background: '#fff' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#2DD87A' }} />
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#2DD87A', letterSpacing: '0.15em' }}>AI REASONING</p>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.6 }}>{workout.reasoning}</p>
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
              style={{ background: exCompleted ? '#F0FDF4' : '#fff', border: exCompleted ? '2px solid #2DD87A' : '2px solid transparent' }}>
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
                  </div>
                  <button onClick={() => setSwapTarget(ex.exerciseId)}
                    className="btn-press flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium"
                    style={{ background: '#F2F0EB', color: '#888' }}>
                    ⇄ Swap
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {ex.lastWeightKg != null && ex.lastWeightKg > 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#bbb' }}>Last: {ex.lastWeightKg} kg</span>
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2DD87A' }}>AI: {ex.suggestedWeightKg} kg</span>
                </div>

                {ex.substituteReason && (
                  <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: 5, fontStyle: 'italic' }}>⚠ {ex.substituteReason}</p>
                )}
              </div>

              <div className="flex items-center gap-2 px-4 pb-1">
                <span className="w-6" />
                <span className="flex-1 text-center" style={{ fontSize: '0.6rem', color: '#ddd', letterSpacing: '0.12em', fontWeight: 600 }}>WEIGHT</span>
                <span className="w-5" />
                <span className="flex-1 text-center" style={{ fontSize: '0.6rem', color: '#ddd', letterSpacing: '0.12em', fontWeight: 600 }}>REPS</span>
                <span className="w-11" />
              </div>

              <div className="px-3 pb-3">
                {ex.sets.map((set, setIdx) => (
                  <SetRow key={setIdx} setIndex={setIdx} weightKg={set.weightKg} reps={set.reps} completed={set.completed}
                    onUpdate={(w, r) => updateSet(exIdx, setIdx, w, r)} onToggle={() => toggleSet(exIdx, setIdx)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Finish */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-4" style={{ background: 'linear-gradient(to top, #F2F0EB 70%, transparent)' }}>
        <button
          onClick={() => { setCurrentWorkout({ ...workout, completed: true }); router.push('/workout/done') }}
          className="btn-press w-full py-4 rounded-2xl font-semibold transition-all duration-300 card-shadow-lg"
          style={{
            background: allDone ? '#1a1a1a' : '#E8E4DC',
            color: allDone ? '#fff' : '#bbb',
            fontSize: '1rem',
          }}
        >
          {allDone ? '🏆 Finish workout' : `${completedSets} of ${totalSets} sets done`}
        </button>
      </div>

      {swapTarget && (
        <SwapModal exerciseId={swapTarget} workoutExerciseIds={workout.exercises.map((e) => e.exerciseId)}
          onConfirm={handleSwapConfirm} onCancel={() => setSwapTarget(null)} />
      )}
    </div>
  )
}
