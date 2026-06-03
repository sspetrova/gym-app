'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWorkout, saveWorkout, clearCurrentWorkout, getPersonalRecords } from '@/lib/storage'
import { getExerciseById } from '@/lib/exercises'
import type { Workout } from '@/lib/types'

export default function WorkoutDone() {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [prevPrs, setPrevPrs] = useState<Record<string, number>>({})
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0EB' }}>
      <div className="w-10 h-10 rounded-full border-t-transparent animate-spin" style={{ border: '3px solid #1a1a1a', borderTopColor: 'transparent' }} />
    </div>
  )

  const completedExercises = workout.exercises.map((ex) => ({ ...ex, completedSets: ex.sets.filter((s) => s.completed) }))
  const totalVolume = completedExercises.reduce((sum, ex) => sum + ex.completedSets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0)
  const totalSets = completedExercises.reduce((s, ex) => s + ex.completedSets.length, 0)
  const newPrs = completedExercises.flatMap((ex) => {
    const max = Math.max(...ex.completedSets.map((s) => s.weightKg), 0)
    return max > 0 && max > (prevPrs[ex.exerciseId] ?? 0) ? [{ exerciseId: ex.exerciseId, weightKg: max }] : []
  })

  function handleSave() {
    if (!workout) return
    saveWorkout({ ...workout, completed: true }); clearCurrentWorkout(); setSaved(true)
    setTimeout(() => router.push('/'), 900)
  }

  function handleShare() {
    if (!workout) return
    const lines = [
      `💪 ${workout.name}`,
      `📅 ${new Date(workout.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      `⚡ Volume: ${Math.round(totalVolume)} kg · ${totalSets} sets`,
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
    <div className="min-h-screen px-4 pt-12 pb-10" style={{ background: '#F2F0EB' }}>

      {/* Hero */}
      <div className="text-center mb-7 animate-slide-up" style={{ opacity: 0 }}>
        <div style={{ fontSize: '4rem', marginBottom: 10 }}>{newPrs.length > 0 ? '🏆' : '💪'}</div>
        <h1 className="font-display" style={{ fontSize: '3rem', fontStyle: 'italic', lineHeight: 1 }}>
          {newPrs.length > 0 ? 'New records!' : 'Workout done!'}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 6 }}>{workout.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up" style={{ animationDelay: '70ms', opacity: 0 }}>
        <div className="rounded-3xl p-5 text-center relative overflow-hidden card-shadow" style={{ background: '#2DD87A' }}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#fff' }} />
          <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.15em', marginBottom: 6 }}>TOTAL VOLUME</p>
          <p className="font-condensed" style={{ fontSize: '2.8rem', color: '#fff', lineHeight: 1 }}>{Math.round(totalVolume)}</p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.3)', marginTop: 3 }}>kg lifted</p>
        </div>
        <div className="rounded-3xl p-5 text-center relative overflow-hidden card-shadow" style={{ background: '#A78BFA' }}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#fff' }} />
          <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', marginBottom: 6 }}>SETS DONE</p>
          <p className="font-condensed" style={{ fontSize: '2.8rem', color: '#fff', lineHeight: 1 }}>{totalSets}</p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>completed</p>
        </div>
      </div>

      {/* New PRs */}
      {newPrs.length > 0 && (
        <div className="rounded-3xl p-5 mb-4 card-shadow animate-slide-up" style={{ animationDelay: '130ms', opacity: 0, background: '#FFFBEB', border: '2px solid #F5C842' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#d97706', letterSpacing: '0.15em', marginBottom: 12 }}>🏆 NEW PERSONAL RECORDS</p>
          <div className="space-y-3">
            {newPrs.map((pr) => {
              const ex = getExerciseById(pr.exerciseId)
              return (
                <div key={pr.exerciseId} className="flex items-center justify-between">
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{ex?.name ?? pr.exerciseId}</p>
                  <div className="flex items-center gap-2">
                    {prevPrs[pr.exerciseId] > 0 && <p style={{ fontSize: '0.75rem', color: '#bbb' }}>{prevPrs[pr.exerciseId]} →</p>}
                    <p className="font-condensed" style={{ fontSize: '1.3rem', color: '#d97706' }}>{pr.weightKg} kg</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="rounded-3xl p-5 mb-5 card-shadow animate-slide-up" style={{ animationDelay: '190ms', opacity: 0, background: '#fff' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#bbb', letterSpacing: '0.15em', marginBottom: 14 }}>EXERCISES</p>
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
                  <p style={{ fontSize: '0.72rem', color: '#bbb' }}>{ex.completedSets.length} sets · max {maxW.weightKg} kg</p>
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#888' }}>{Math.round(exVol)} kg</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '250ms', opacity: 0 }}>
        <button onClick={handleSave} disabled={saved} className="btn-press w-full py-4 rounded-2xl font-semibold card-shadow-lg"
          style={{ background: saved ? '#E8E4DC' : '#1a1a1a', color: saved ? '#888' : '#fff', fontSize: '1rem' }}>
          {saved ? '✓ Saved!' : 'Save & finish'}
        </button>
        <button onClick={handleShare} className="btn-press w-full py-4 rounded-2xl font-medium text-sm card-shadow"
          style={{ background: '#fff', color: '#555' }}>
          {copied ? '✓ Copied!' : '📋 Copy summary'}
        </button>
      </div>
    </div>
  )
}
