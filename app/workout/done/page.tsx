'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWorkout, saveWorkout, clearCurrentWorkout, getPersonalRecords } from '@/lib/storage'
import { getExerciseById } from '@/lib/exercises'
import type { Workout } from '@/lib/types'

const RATING_OPTIONS = [
  { value: 1, emoji: '😴', label: 'Weak' },
  { value: 2, emoji: '😐', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😤', label: 'Strong' },
  { value: 5, emoji: '🔥', label: 'Beast' },
]

const RECOVERY_OPTIONS = [
  { id: 'great',     emoji: '✨', label: 'Felt great',    detail: 'Could do more' },
  { id: 'tough',     emoji: '💪', label: 'Tough but good', detail: 'Hit my limits' },
  { id: 'overworked',emoji: '😮‍💨', label: 'Overworked',   detail: 'Need extra rest' },
  { id: 'easy',      emoji: '😏', label: 'Too easy',      detail: 'Need more weight' },
]

export default function WorkoutDone() {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [prevPrs, setPrevPrs] = useState<Record<string, number>>({})
  const [rating, setRating] = useState<number>(0)
  const [recovery, setRecovery] = useState<string>('')
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const w = getCurrentWorkout()
    if (!w) { router.replace('/'); return }
    setPrevPrs(getPersonalRecords())
    setWorkout(w); setMounted(true)
  }, [router])

  if (!mounted || !workout) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#C0E0FF' }}>
      <div className="w-10 h-10 rounded-full border-t-transparent animate-spin" style={{ border: '3px solid #1a1a1a', borderTopColor: 'transparent' }} />
    </div>
  )

  const completedExercises = workout.exercises.map((ex) => ({ ...ex, completedSets: ex.sets.filter((s) => s.completed) }))
  const totalSets = completedExercises.reduce((s, ex) => s + ex.completedSets.length, 0)
  const newPrs = completedExercises.flatMap((ex) => {
    const max = Math.max(...ex.completedSets.map((s) => s.weightKg), 0)
    return max > 0 && max > (prevPrs[ex.exerciseId] ?? 0) ? [{ exerciseId: ex.exerciseId, weightKg: max }] : []
  })

  function handleSave() {
    if (!workout) return
    saveWorkout({ ...workout, completed: true, rating: rating || undefined, recoveryFeedback: recovery || undefined })
    clearCurrentWorkout()
    setSaved(true)
    setTimeout(() => router.push('/'), 900)
  }

  function handleShare() {
    if (!workout) return
    const lines = [
      `💪 ${workout.name}`,
      `📅 ${new Date(workout.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      `💪 ${totalSets} sets completed`,
      rating ? `⭐ Rated: ${RATING_OPTIONS[rating - 1]?.emoji} ${RATING_OPTIONS[rating - 1]?.label}` : '',
      '',
      ...completedExercises.map((ex) => {
        const exercise = getExerciseById(ex.exerciseId)
        const best = ex.completedSets.reduce((a, b) => (a.weightKg > b.weightKg ? a : b), { weightKg: 0 })
        return `${exercise?.name ?? ex.exerciseId}: ${ex.completedSets.length}×${best.weightKg}kg`
      }),
      newPrs.length > 0 ? `\n🏆 PRs: ${newPrs.map((p) => `${getExerciseById(p.exerciseId)?.name} @ ${p.weightKg}kg`).join(', ')}` : '',
      '\nTracked with GymAI ⚡',
    ]
    navigator.clipboard.writeText(lines.filter(Boolean).join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-10" style={{ background: '#C0E0FF' }}>

      {/* Hero */}
      <div className="text-center mb-7 animate-slide-up" style={{ opacity: 0 }}>
        <div style={{ fontSize: '4rem', marginBottom: 10 }}>{newPrs.length > 0 ? '🏆' : '💪'}</div>
        <h1 className="font-display" style={{ fontSize: '3rem', fontStyle: 'italic', lineHeight: 1 }}>
          {newPrs.length > 0 ? 'New records!' : 'Workout done!'}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#555', marginTop: 6 }}>{workout.name}</p>
      </div>

      {/* ── Session Rating ── */}
      <div className="rounded-3xl p-5 mb-4 card-shadow animate-slide-up" style={{ animationDelay: '60ms', opacity: 0, background: '#fff' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#666', letterSpacing: '0.15em', marginBottom: 14 }}>HOW WAS THIS SESSION?</p>
        <div className="flex justify-between gap-2">
          {RATING_OPTIONS.map((r) => (
            <button key={r.value} onClick={() => setRating(r.value)}
              className="btn-press flex-1 flex flex-col items-center py-3 rounded-2xl transition-all duration-200"
              style={{
                background: rating === r.value ? '#253A82' : '#DAEEFF',
                transform: rating === r.value ? 'scale(1.08)' : 'scale(1)',
              }}>
              <span style={{ fontSize: '1.6rem' }}>{r.emoji}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, color: rating === r.value ? '#fff' : '#bbb', letterSpacing: '0.05em' }}>
                {r.label.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recovery question ── */}
      <div className="rounded-3xl p-5 mb-4 card-shadow animate-slide-up" style={{ animationDelay: '110ms', opacity: 0, background: '#fff' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#666', letterSpacing: '0.15em', marginBottom: 14 }}>HOW DO YOU FEEL?</p>
        <div className="grid grid-cols-2 gap-2">
          {RECOVERY_OPTIONS.map((r) => (
            <button key={r.id} onClick={() => setRecovery(r.id)}
              className="btn-press p-3.5 rounded-2xl border-2 text-left transition-all duration-200"
              style={{
                background: recovery === r.id ? '#F0FADF' : '#DAEEFF',
                borderColor: recovery === r.id ? '#2DD87A' : 'transparent',
              }}>
              <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: 4 }}>{r.emoji}</span>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: recovery === r.id ? '#16a34a' : '#1a1a1a' }}>{r.label}</p>
              <p style={{ fontSize: '0.68rem', color: '#555', marginTop: 1 }}>{r.detail}</p>
            </button>
          ))}
        </div>
        {recovery && (
          <p className="mt-3" style={{ fontSize: '0.72rem', color: '#2DD87A', fontWeight: 600 }}>
            ✓ AI will factor this into your next session
          </p>
        )}
      </div>

      {/* New PRs */}
      {newPrs.length > 0 && (
        <div className="rounded-3xl p-5 mb-4 card-shadow animate-slide-up" style={{ animationDelay: '160ms', opacity: 0, background: '#FFFBEB', border: '2px solid #F5C842' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#d97706', letterSpacing: '0.15em', marginBottom: 12 }}>🏆 NEW PERSONAL RECORDS</p>
          <div className="space-y-3">
            {newPrs.map((pr) => {
              const ex = getExerciseById(pr.exerciseId)
              return (
                <div key={pr.exerciseId} className="flex items-center justify-between">
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{ex?.name ?? pr.exerciseId}</p>
                  <div className="flex items-center gap-2">
                    {prevPrs[pr.exerciseId] > 0 && <p style={{ fontSize: '0.75rem', color: '#666' }}>{prevPrs[pr.exerciseId]} →</p>}
                    <p className="font-condensed" style={{ fontSize: '1.3rem', color: '#d97706' }}>{pr.weightKg} kg</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats summary (secondary) */}
      <div className="rounded-2xl p-4 text-center card-shadow mb-4 animate-slide-up" style={{ animationDelay: '200ms', opacity: 0, background: '#fff' }}>
        <p style={{ fontSize: '0.55rem', fontWeight: 700, color: '#666', letterSpacing: '0.12em', marginBottom: 4 }}>SETS COMPLETED</p>
        <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a1a1a', lineHeight: 1 }}>{totalSets}</p>
        <p style={{ fontSize: '0.65rem', color: '#666', marginTop: 2 }}>across {completedExercises.filter(e => e.completedSets.length > 0).length} exercises</p>
      </div>

      {/* Exercises */}
      <div className="rounded-3xl p-5 mb-5 card-shadow animate-slide-up" style={{ animationDelay: '250ms', opacity: 0, background: '#fff' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#666', letterSpacing: '0.15em', marginBottom: 14 }}>EXERCISES</p>
        <div className="space-y-3">
          {completedExercises.map((ex) => {
            const exercise = getExerciseById(ex.exerciseId)
            const exVol = ex.completedSets.reduce((s, set) => s + set.weightKg * set.reps, 0)
            const maxW = ex.completedSets.reduce((a, b) => (a.weightKg > b.weightKg ? a : b), { weightKg: 0 })
            const isPr = newPrs.some((p) => p.exerciseId === ex.exerciseId)
            return (
              <div key={ex.exerciseId} className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{exercise?.name ?? ex.exerciseId}</p>
                    {isPr && <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: '#FFFBEB', color: '#d97706' }}>PR</span>}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#666' }}>{ex.completedSets.length} sets · max {maxW.weightKg} kg</p>
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#444' }}>{Math.round(exVol)} kg</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '300ms', opacity: 0 }}>
        <button onClick={handleSave} disabled={saved}
          className="btn-press w-full py-4 rounded-2xl font-semibold card-shadow-lg"
          style={{ background: saved ? '#E8E4DC' : '#1a1a1a', color: saved ? '#888' : '#fff', fontSize: '1rem' }}>
          {saved ? '✓ Saved!' : rating ? 'Save & finish 🎯' : 'Save & finish'}
        </button>
        <button onClick={handleShare} className="btn-press w-full py-4 rounded-2xl font-medium text-sm card-shadow"
          style={{ background: '#fff', color: '#555' }}>
          {copied ? '✓ Copied!' : '📋 Copy summary'}
        </button>
      </div>
    </div>
  )
}
