'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWorkout, setCurrentWorkout } from '@/lib/storage'
import { substituteExercise } from '@/lib/ai'
import { getExerciseById, MUSCLE_GROUP_COLORS } from '@/lib/exercises'
import type { Workout } from '@/lib/types'

const D = 'Barlow Condensed, sans-serif'
const B = 'Barlow, sans-serif'

const SWAP_REASONS = ['Pain / discomfort', 'No equipment', 'Too easy', 'Too hard']

function SwapModal({
  exerciseId,
  workoutExerciseIds,
  onConfirm,
  onCancel,
}: {
  exerciseId: string
  workoutExerciseIds: string[]
  onConfirm: (newId: string, reason: string) => void
  onCancel: () => void
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
    setLoading(true)
    setError(null)
    try {
      const sub = await substituteExercise({ exerciseId, reason: finalReason, currentWorkout: workoutExerciseIds })
      setResult(sub)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const newEx = result ? getExerciseById(result.exerciseId) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', opacity: 0 }}
    >
      <div
        className="w-full max-w-md bg-[#0a0a0a] border border-[#1e1e1e] rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: D, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            SWAP EXERCISE
          </h2>
          <button onClick={onCancel} className="btn-press w-9 h-9 rounded-full border border-[#1e1e1e] flex items-center justify-center text-[#555] text-lg">
            ✕
          </button>
        </div>

        <p style={{ fontFamily: B, fontSize: '0.85rem', color: '#555', marginBottom: 16 }}>
          Replacing: <span style={{ color: '#fff' }}>{ex?.name}</span>
        </p>

        {!result ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {SWAP_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`btn-press px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
                    reason === r
                      ? 'border-[#00FF87] bg-[#00FF87]/12 text-[#00FF87]'
                      : 'border-[#1e1e1e] text-[#555]'
                  }`}
                  style={{ fontFamily: D, fontWeight: 600, letterSpacing: '0.04em' }}
                >
                  {r}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or describe the reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:border-[#00FF87]/40 placeholder:text-[#2a2a2a]"
              style={{ fontFamily: B }}
            />

            {error && <p className="text-red-400 text-sm mb-3" style={{ fontFamily: B }}>{error}</p>}

            <button
              onClick={handleSearch}
              disabled={!reason && !customReason}
              className="btn-press w-full py-4 rounded-xl text-black disabled:opacity-30"
              style={{
                background: 'linear-gradient(135deg, #00FF87, #00cc6a)',
                fontFamily: D,
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  AI THINKING...
                </span>
              ) : (
                'FIND SUBSTITUTE ⚡'
              )}
            </button>
          </>
        ) : (
          <div className="animate-scale-in" style={{ opacity: 0 }}>
            <div className="bg-[#0f1a12] border border-[#00FF87]/25 rounded-2xl p-5 mb-4">
              <p style={{ fontFamily: D, fontSize: '0.7rem', color: '#00FF87', letterSpacing: '0.2em', marginBottom: 6 }}>
                AI SUGGESTS
              </p>
              <p style={{ fontFamily: D, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                {newEx?.name ?? result.exerciseId}
              </p>
              <p style={{ fontFamily: B, fontSize: '0.85rem', color: '#888', marginTop: 6, lineHeight: 1.5 }}>
                {result.reason}
              </p>
              {newEx && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {newEx.muscleGroups.map((m) => (
                    <span key={m} className={`text-[10px] px-2 py-0.5 rounded-full ${MUSCLE_GROUP_COLORS[m] ?? 'bg-[#222] text-[#888]'}`}>
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="btn-press flex-1 py-3.5 rounded-xl border border-[#1e1e1e] text-[#666]"
                style={{ fontFamily: D, fontWeight: 600, letterSpacing: '0.06em' }}
              >
                CANCEL
              </button>
              <button
                onClick={() => onConfirm(result.exerciseId, result.reason)}
                className="btn-press flex-1 py-3.5 rounded-xl text-black"
                style={{ background: '#00FF87', fontFamily: D, fontSize: '1rem', fontWeight: 800, letterSpacing: '0.08em' }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SetRow({
  setIndex, weightKg, reps, completed, onUpdate, onToggle,
}: {
  setIndex: number; weightKg: number; reps: number; completed: boolean
  onUpdate: (w: number, r: number) => void; onToggle: () => void
}) {
  return (
    <div className={`flex items-center gap-2 py-2 transition-opacity duration-200 ${completed ? 'opacity-60' : ''}`}>
      {/* Set number */}
      <span
        className="w-7 text-center"
        style={{ fontFamily: D, fontSize: '1.1rem', fontWeight: 700, color: '#333' }}
      >
        {setIndex + 1}
      </span>

      {/* Weight */}
      <div className="flex-1 flex items-center bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <button onClick={() => onUpdate(Math.max(0, weightKg - 2.5), reps)} className="btn-press w-9 h-11 flex items-center justify-center text-[#444] text-xl">−</button>
        <input
          type="number"
          value={weightKg}
          onChange={(e) => onUpdate(Number(e.target.value) || 0, reps)}
          className="flex-1 bg-transparent text-center text-white focus:outline-none"
          style={{ fontFamily: D, fontSize: '1.15rem', fontWeight: 700 }}
        />
        <span style={{ fontFamily: B, fontSize: '0.65rem', color: '#333', paddingRight: 8 }}>KG</span>
        <button onClick={() => onUpdate(weightKg + 2.5, reps)} className="btn-press w-9 h-11 flex items-center justify-center text-[#444] text-xl">+</button>
      </div>

      <span style={{ color: '#222', fontSize: '0.9rem' }}>×</span>

      {/* Reps */}
      <div className="flex-1 flex items-center bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <button onClick={() => onUpdate(weightKg, Math.max(1, reps - 1))} className="btn-press w-9 h-11 flex items-center justify-center text-[#444] text-xl">−</button>
        <input
          type="number"
          value={reps}
          onChange={(e) => onUpdate(weightKg, Number(e.target.value) || 1)}
          className="flex-1 bg-transparent text-center text-white focus:outline-none"
          style={{ fontFamily: D, fontSize: '1.15rem', fontWeight: 700 }}
        />
        <span style={{ fontFamily: B, fontSize: '0.65rem', color: '#333', paddingRight: 6 }}>REP</span>
        <button onClick={() => onUpdate(weightKg, reps + 1)} className="btn-press w-9 h-11 flex items-center justify-center text-[#444] text-xl">+</button>
      </div>

      {/* Check */}
      <button
        onClick={onToggle}
        className={`btn-press w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
          completed
            ? 'bg-[#00FF87] border-[#00FF87] text-black'
            : 'border-[#2a2a2a] text-[#2a2a2a]'
        }`}
        style={{ fontFamily: D, fontSize: '1rem', fontWeight: 800 }}
      >
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
    setWorkout(w)
    setMounted(true)
  }, [router])

  function updateWorkout(updated: Workout) {
    setWorkout(updated)
    setCurrentWorkout(updated)
  }

  function updateSet(exIdx: number, setIdx: number, weightKg: number, reps: number) {
    if (!workout) return
    updateWorkout({
      ...workout,
      exercises: workout.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, weightKg, reps } : s) } : ex
      ),
    })
  }

  function toggleSet(exIdx: number, setIdx: number) {
    if (!workout) return
    updateWorkout({
      ...workout,
      exercises: workout.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, completed: !s.completed } : s) } : ex
      ),
    })
  }

  function handleSwapConfirm(newExerciseId: string, reason: string) {
    if (!workout || !swapTarget) return
    updateWorkout({
      ...workout,
      exercises: workout.exercises.map((ex) =>
        ex.exerciseId !== swapTarget ? ex : {
          ...ex,
          exerciseId: newExerciseId,
          substituteReason: reason,
          sets: ex.sets.map((s) => ({ ...s, completed: false })),
        }
      ),
    })
    setSwapTarget(null)
  }

  const totalSets = workout?.exercises.reduce((s, ex) => s + ex.sets.length, 0) ?? 0
  const completedSets = workout?.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.completed).length, 0) ?? 0
  const allDone = totalSets > 0 && completedSets === totalSets
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  if (!mounted || !workout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#00FF87] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-36">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-black/96 border-b border-[#111] px-4 pt-3 pb-3" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={() => router.push('/')}
            className="btn-press px-3 py-1.5 rounded-lg border border-[#1e1e1e] text-[#444]"
            style={{ fontFamily: D, fontSize: '0.8rem', letterSpacing: '0.08em' }}
          >
            ✕ EXIT
          </button>
          <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em' }}>
            {workout.name}
          </p>
          <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, color: '#00FF87' }}>
            {completedSets}/{totalSets}
          </p>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00FF87, #00e070)' }}
          />
        </div>
      </div>

      {/* AI Reasoning */}
      {workout.reasoning && (
        <div className="mx-4 mt-4 p-4 rounded-2xl border border-[#1e1e1e] bg-[#050f09]">
          <p style={{ fontFamily: D, fontSize: '0.65rem', color: '#00FF87', letterSpacing: '0.2em', marginBottom: 5 }}>
            AI REASONING
          </p>
          <p style={{ fontFamily: B, fontSize: '0.82rem', color: '#888', lineHeight: 1.6 }}>
            {workout.reasoning}
          </p>
        </div>
      )}

      {/* Exercises */}
      <div className="px-4 pt-4 space-y-4">
        {workout.exercises.map((ex, exIdx) => {
          const exercise = getExerciseById(ex.exerciseId)
          if (!exercise) return null
          const exCompleted = ex.sets.every((s) => s.completed)

          return (
            <div
              key={`${ex.exerciseId}_${exIdx}`}
              className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                exCompleted ? 'border-[#00FF87]/20 bg-[#050f09]' : 'border-[#1e1e1e] bg-[#0a0a0a]'
              }`}
            >
              {/* Exercise header */}
              <div className="p-4 pb-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-3">
                    <h3 style={{ fontFamily: D, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.03em', lineHeight: 1 }}>
                      {exercise.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {exercise.muscleGroups.map((m) => (
                        <span key={m} className={`text-[10px] px-2 py-0.5 rounded-full ${MUSCLE_GROUP_COLORS[m] ?? 'bg-[#222] text-[#888]'}`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSwapTarget(ex.exerciseId)}
                    className="btn-press flex items-center gap-1 px-3 py-2 rounded-xl border border-[#1e1e1e] text-[#555] mt-0.5"
                    style={{ fontFamily: D, fontSize: '0.8rem', letterSpacing: '0.06em' }}
                  >
                    ⇄ SWAP
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {ex.lastWeightKg != null && ex.lastWeightKg > 0 && (
                    <span style={{ fontFamily: B, fontSize: '0.78rem', color: '#444' }}>
                      Last: <span style={{ color: '#666' }}>{ex.lastWeightKg} kg</span>
                    </span>
                  )}
                  <span style={{ fontFamily: D, fontSize: '0.9rem', fontWeight: 700, color: '#00FF87' }}>
                    AI: {ex.suggestedWeightKg} kg
                  </span>
                </div>

                {ex.substituteReason && (
                  <p style={{ fontFamily: B, fontSize: '0.75rem', color: '#b45309', marginTop: 5, fontStyle: 'italic' }}>
                    ⚠ {ex.substituteReason}
                  </p>
                )}
              </div>

              {/* Column labels */}
              <div className="flex items-center gap-2 px-4 pb-1">
                <span className="w-7" />
                <span className="flex-1 text-center" style={{ fontFamily: B, fontSize: '0.6rem', color: '#2a2a2a', letterSpacing: '0.15em' }}>WEIGHT</span>
                <span className="w-5" />
                <span className="flex-1 text-center" style={{ fontFamily: B, fontSize: '0.6rem', color: '#2a2a2a', letterSpacing: '0.15em' }}>REPS</span>
                <span className="w-11" />
              </div>

              {/* Sets */}
              <div className="px-3 pb-3">
                {ex.sets.map((set, setIdx) => (
                  <SetRow
                    key={setIdx}
                    setIndex={setIdx}
                    weightKg={set.weightKg}
                    reps={set.reps}
                    completed={set.completed}
                    onUpdate={(w, r) => updateSet(exIdx, setIdx, w, r)}
                    onToggle={() => toggleSet(exIdx, setIdx)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Finish button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-10 pt-6 bg-gradient-to-t from-black via-black/95 to-transparent">
        <button
          onClick={() => {
            setCurrentWorkout({ ...workout, completed: true })
            router.push('/workout/done')
          }}
          className={`btn-press w-full py-5 rounded-2xl transition-all duration-300 ${allDone ? 'animate-pulse-glow' : 'opacity-50'}`}
          style={{
            background: allDone ? 'linear-gradient(135deg, #00FF87, #00cc6a)' : '#111',
            color: allDone ? '#000' : '#333',
            fontFamily: D,
            fontSize: '1.4rem',
            fontWeight: 900,
            letterSpacing: '0.1em',
          }}
        >
          {allDone ? '🏆 FINISH WORKOUT' : `${completedSets} / ${totalSets} SETS DONE`}
        </button>
      </div>

      {swapTarget && (
        <SwapModal
          exerciseId={swapTarget}
          workoutExerciseIds={workout.exercises.map((e) => e.exerciseId)}
          onConfirm={handleSwapConfirm}
          onCancel={() => setSwapTarget(null)}
        />
      )}
    </div>
  )
}
