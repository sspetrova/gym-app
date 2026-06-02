'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWorkout, saveWorkout, clearCurrentWorkout, getPersonalRecords } from '@/lib/storage'
import { getExerciseById } from '@/lib/exercises'
import type { Workout } from '@/lib/types'

const D = 'Barlow Condensed, sans-serif'
const B = 'Barlow, sans-serif'

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
    setWorkout(w)
    setMounted(true)
  }, [router])

  if (!mounted || !workout) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#00FF87] border-t-transparent animate-spin" />
    </div>
  )

  const completedExercises = workout.exercises.map((ex) => ({
    ...ex, completedSets: ex.sets.filter((s) => s.completed),
  }))
  const totalVolume = completedExercises.reduce((sum, ex) => sum + ex.completedSets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0)
  const totalSets = completedExercises.reduce((s, ex) => s + ex.completedSets.length, 0)
  const newPrs = completedExercises.flatMap((ex) => {
    const max = Math.max(...ex.completedSets.map((s) => s.weightKg), 0)
    return max > 0 && max > (prevPrs[ex.exerciseId] ?? 0) ? [{ exerciseId: ex.exerciseId, weightKg: max }] : []
  })

  function handleSave() {
    if (!workout) return
    saveWorkout({ ...workout, completed: true })
    clearCurrentWorkout()
    setSaved(true)
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
    navigator.clipboard.writeText(lines.filter(Boolean).join('\n')).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 pt-12 pb-10">

      {/* Hero */}
      <div className="text-center mb-6 animate-slide-up" style={{ opacity: 0 }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>{newPrs.length > 0 ? '🏆' : '💪'}</div>
        <h1 style={{ fontFamily: D, fontSize: '3.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '0.03em' }}>
          {newPrs.length > 0 ? 'NEW RECORDS!' : 'WORKOUT DONE'}
        </h1>
        <p style={{ fontFamily: B, fontSize: '0.85rem', color: '#555', marginTop: 6 }}>{workout.name}</p>
      </div>

      {/* Stats bento */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up" style={{ animationDelay: '70ms', opacity: 0 }}>
        <div className="rounded-3xl p-5 text-center relative overflow-hidden" style={{ background: '#001a0e', border: '1px solid #003a20' }}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#00FF87' }} />
          <p style={{ fontFamily: B, fontSize: '0.6rem', color: '#00FF87', letterSpacing: '0.15em', marginBottom: 6 }}>TOTAL VOLUME</p>
          <p style={{ fontFamily: D, fontSize: '2.8rem', fontWeight: 900, color: '#00FF87', lineHeight: 1 }}>{Math.round(totalVolume)}</p>
          <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#004020', marginTop: 3 }}>kg lifted</p>
        </div>
        <div className="rounded-3xl p-5 text-center relative overflow-hidden" style={{ background: '#0f0a20', border: '1px solid #2a1a50' }}>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-20" style={{ background: '#a78bfa' }} />
          <p style={{ fontFamily: B, fontSize: '0.6rem', color: '#a78bfa', letterSpacing: '0.15em', marginBottom: 6 }}>SETS DONE</p>
          <p style={{ fontFamily: D, fontSize: '2.8rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{totalSets}</p>
          <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#3a2070', marginTop: 3 }}>completed</p>
        </div>
      </div>

      {/* New PRs */}
      {newPrs.length > 0 && (
        <div className="rounded-3xl p-5 mb-4 animate-pulse-glow animate-slide-up" style={{ animationDelay: '130ms', opacity: 0, background: '#1a0f00', border: '1px solid #3a2800' }}>
          <p style={{ fontFamily: D, fontSize: '0.7rem', color: '#fb923c', letterSpacing: '0.2em', marginBottom: 12 }}>🏆 NEW PERSONAL RECORDS</p>
          <div className="space-y-3">
            {newPrs.map((pr) => {
              const ex = getExerciseById(pr.exerciseId)
              return (
                <div key={pr.exerciseId} className="flex items-center justify-between">
                  <p style={{ fontFamily: B, fontSize: '0.9rem', color: '#ccc' }}>{ex?.name ?? pr.exerciseId}</p>
                  <div className="flex items-center gap-2">
                    {prevPrs[pr.exerciseId] > 0 && <p style={{ fontFamily: B, fontSize: '0.75rem', color: '#444' }}>{prevPrs[pr.exerciseId]} →</p>}
                    <p style={{ fontFamily: D, fontSize: '1.3rem', fontWeight: 800, color: '#fb923c' }}>{pr.weightKg} kg</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Exercise breakdown */}
      <div className="rounded-3xl p-5 mb-5 animate-slide-up" style={{ animationDelay: '190ms', opacity: 0, background: '#161616', border: '1px solid #252525' }}>
        <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>EXERCISES</p>
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
                    <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700 }}>{exercise?.name ?? ex.exerciseId}</p>
                    {isPr && <span className="px-2 py-0.5 rounded-lg text-black text-xs font-bold" style={{ background: '#fb923c', fontFamily: D, fontSize: '0.7rem' }}>PR</span>}
                  </div>
                  <p style={{ fontFamily: B, fontSize: '0.72rem', color: '#444' }}>{ex.completedSets.length} sets · max {maxW.weightKg} kg</p>
                </div>
                <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, color: '#555' }}>{Math.round(exVol)} kg</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '250ms', opacity: 0 }}>
        <button onClick={handleSave} disabled={saved} className="btn-press w-full py-5 rounded-2xl text-black disabled:opacity-60 glow-green"
          style={{ background: saved ? '#161616' : 'linear-gradient(135deg,#00FF87,#00cc6a)', color: saved ? '#444' : '#000', fontFamily: D, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.1em' }}>
          {saved ? '✓ SAVED!' : 'SAVE & FINISH'}
        </button>
        <button onClick={handleShare} className="btn-press w-full py-4 rounded-2xl border text-[#555]"
          style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.1em', borderColor: '#252525', background: '#111' }}>
          {copied ? '✓ COPIED!' : '📋 COPY SUMMARY'}
        </button>
      </div>
    </div>
  )
}
