'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkoutHistory, getPersonalRecords, seedDemoData, hasCompletedOnboarding, getUserPreferences, getCurrentWeekGoal, setCurrentWeekGoal, markWeeklyGoalAchieved } from '@/lib/storage'
import { getExerciseById } from '@/lib/exercises'
import type { Workout } from '@/lib/types'

// Week calendar strip
function WeekStrip({ workouts }: { workouts: Workout[] }) {
  const [selected, setSelected] = useState(6)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3)
    const num = d.getDate()
    const dateStr = d.toISOString().split('T')[0]
    const trained = workouts.some(w => w.date.split('T')[0] === dateStr)
    return { label, num, trained, isToday: i === 6 }
  })
  return (
    <div className="flex gap-2 justify-between">
      {days.map((d, i) => (
        <button key={i} onClick={() => setSelected(i)}
          className="btn-press flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-200 shadow-card"
          style={{ background: selected === i ? '#253A82' : '#fff' }}>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: selected === i ? 'rgba(255,255,255,0.6)' : '#88A2FF', letterSpacing: '0.05em' }}>
            {d.label.toUpperCase()}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: selected === i ? '#fff' : '#253A82' }}>{d.num}</span>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: d.trained ? (selected === i ? '#E3FC87' : '#88A2FF') : 'transparent'
          }} />
        </button>
      ))}
    </div>
  )
}


export default function Dashboard() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [weightDelta, setWeightDelta] = useState<number | null>(null)
  const [weeklyGoal, setWeeklyGoalState] = useState<{ goal: string; achieved: boolean } | null>(null)
  const [goalInput, setGoalInput] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!hasCompletedOnboarding()) { router.replace('/onboarding'); return }
    seedDemoData()
    setWorkouts(getWorkoutHistory(20))
    setPrs(getPersonalRecords())
    const goal = getCurrentWeekGoal()
    setWeeklyGoalState(goal)
    if (goal) setGoalInput(goal.goal)
    setMounted(true)
  }, [router])

  const lastWorkout = workouts[0]

  // Best weight improvement: scan all history for any exercise that went up
  const bestImprovement = (() => {
    if (workouts.length < 2) return null
    // Build map: exerciseId → sorted list of (date, maxWeight)
    const byEx: Record<string, { date: string; max: number }[]> = {}
    for (const w of workouts) {
      for (const ex of w.exercises) {
        const max = Math.max(...ex.sets.filter(s => s.completed).map(s => s.weightKg), 0)
        if (max === 0) continue
        if (!byEx[ex.exerciseId]) byEx[ex.exerciseId] = []
        byEx[ex.exerciseId].push({ date: w.date, max })
      }
    }
    let best: { name: string; from: number; to: number; diff: number } | null = null
    for (const [id, entries] of Object.entries(byEx)) {
      if (entries.length < 2) continue
      // Sort oldest → newest
      const sorted = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const newest = sorted[sorted.length - 1].max
      const previous = sorted[sorted.length - 2].max
      const diff = newest - previous
      if (diff > 0 && (!best || diff > best.diff)) {
        const exInfo = getExerciseById(id)
        best = { name: exInfo?.name ?? id, from: previous, to: newest, diff }
      }
    }
    return best
  })()

  const topPrs = Object.entries(prs).sort(([, a], [, b]) => b - a).slice(0, 3)

  const daysThisWeek = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return workouts.filter(w => new Date(w.date) > cutoff).length
  })()

  // Real consecutive-day streak (same logic as progress tab)
  const streak = (() => {
    const trainedDates = new Set(workouts.map(w => w.date.split('T')[0]))
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (trainedDates.has(key)) {
        count++
      } else if (i > 0) {
        // Allow today to be rest day — check if yesterday started the streak
        break
      }
    }
    return count
  })()

  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : hour < 21 ? 'Good Evening' : 'Good Night'
  const userName = getUserPreferences()?.name
  const greeting = userName ? `${timeGreeting}, ${userName}` : timeGreeting

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#C0E0FF' }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #7C5CBF', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: '#C0E0FF' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between animate-slide-up" style={{ opacity: 0 }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#4A6FA5', fontWeight: 600 }}>{greeting} 👋</p>
            <h1 style={{ fontFamily: 'Nunito,sans-serif', fontSize: '1.8rem', fontWeight: 900, color: '#253A82', lineHeight: 1.1, marginTop: 2 }}>
              Ready to crush it?
            </h1>
          </div>
          {/* Avatar bubble */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-card animate-wobble"
            style={{ background: '#fff' }}>
            💪
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ── HERO — Daily Challenge card ── */}
        <button onClick={() => router.push('/workout/new')}
          className="btn-press w-full rounded-3xl overflow-hidden relative shadow-card-lg animate-slide-up"
          style={{ opacity: 0, animationDelay: '60ms', background: 'linear-gradient(135deg,#253A82 0%,#88A2FF 100%)', minHeight: 160 }}>
          {/* Floating shapes */}
          <div className="absolute animate-float" style={{ top: -10, right: 20, fontSize: '4rem', opacity: 0.6 }}>🏋️</div>
          <div className="absolute animate-float2" style={{ top: 30, right: 80, fontSize: '1.5rem', opacity: 0.4 }}>⚡</div>
          <div className="absolute animate-bounce" style={{ bottom: 10, right: 15, fontSize: '2rem', opacity: 0.5 }}>🔥</div>
          <div className="absolute w-32 h-32 rounded-full opacity-10 animate-pulse-s"
            style={{ background: '#fff', top: -20, right: -20 }} />
          <div className="relative z-10 p-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              ⚡ AI POWERED
            </div>
            <p style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '0.02em' }}>
              START TODAY'S<br />WORKOUT
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="px-4 py-2 rounded-2xl font-bold text-sm"
                style={{ background: '#E3FC87', color: '#253A82' }}>
                Build my session →
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>AI adapts to you</p>
            </div>
          </div>
        </button>

        {/* ── Week strip ── */}
        <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '110ms' }}>
          <WeekStrip workouts={workouts} />
        </div>

        {/* ── Goal + Streak ── */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ opacity: 0, animationDelay: '165ms' }}>

          {/* Weekly goal — purple */}
          <div className="rounded-2xl p-3 shadow-card-lg relative overflow-hidden col-span-1"
            style={{ background: weeklyGoal?.achieved ? 'linear-gradient(135deg,#253A82,#88A2FF)' : 'linear-gradient(135deg,#88A2FF,#AB9DFF)' }}>
            <div className="absolute" style={{ top: 6, right: 8, fontSize: '2rem', opacity: 0.2 }}>🎯</div>
            <p style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', marginBottom: 5 }}>THIS WEEK</p>

            {weeklyGoal && !editingGoal ? (
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {weeklyGoal.achieved ? '✅ ' : ''}{weeklyGoal.goal}
                </p>
                {streak >= 3 && (
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>🔥 {streak} day streak</p>
                )}
                <div className="flex gap-1.5 mt-2.5">
                  {!weeklyGoal.achieved && (
                    <button onClick={() => { markWeeklyGoalAchieved(); setWeeklyGoalState((g) => g ? { ...g, achieved: true } : g) }}
                      className="btn-press px-2 py-0.5 rounded-md font-bold"
                      style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.58rem', letterSpacing: '0.05em' }}>DONE ✓</button>
                  )}
                  <button onClick={() => setEditingGoal(true)}
                    className="btn-press px-2 py-0.5 rounded-md font-medium"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '0.58rem', letterSpacing: '0.05em' }}>EDIT</button>
                </div>
              </div>
            ) : (
              <div>
                {!weeklyGoal && <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Set your goal</p>}
                <div className="flex gap-1.5">
                  <input type="text" placeholder="e.g. pull up…" value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && goalInput.trim()) { setCurrentWeekGoal(goalInput.trim()); setWeeklyGoalState({ goal: goalInput.trim(), achieved: false }); setEditingGoal(false) }}}
                    className="flex-1 rounded-lg px-2.5 py-2 text-sm font-medium focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }} />
                  <button onClick={() => { if (!goalInput.trim()) return; setCurrentWeekGoal(goalInput.trim()); setWeeklyGoalState({ goal: goalInput.trim(), achieved: false }); setEditingGoal(false) }}
                    className="btn-press px-3 rounded-lg text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>Set</button>
                </div>
                {editingGoal && <button onClick={() => setEditingGoal(false)} className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Cancel</button>}
              </div>
            )}
          </div>

          {/* Streak — yellow-green */}
          <div className="rounded-2xl p-3 shadow-card-lg relative overflow-hidden col-span-1"
            style={{ background: 'linear-gradient(135deg,#E3FC87,#C8F060)' }}>
            <div className="absolute" style={{ top: 6, right: 8, fontSize: '1.6rem', opacity: 0.35 }}>🔥</div>
            <p style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(37,58,130,0.55)', letterSpacing: '0.12em', marginBottom: 4 }}>STREAK</p>
            <p className="dc" style={{ fontSize: '2.4rem', color: '#253A82', lineHeight: 1 }}>
              {streak}<span style={{ fontSize: '0.8rem', opacity: 0.6, marginLeft: 2 }}>days</span>
            </p>
            <p style={{ fontSize: '0.6rem', color: 'rgba(37,58,130,0.55)', marginTop: 4 }}>
              {streak === 0 ? 'Start today, you got this!' : streak <= 2 ? `${streak} day${streak > 1 ? 's' : ''} — keep going! 💪` : `${streak} days in a row 🔥`}
            </p>
          </div>
        </div>

        {/* ── Personal Records — 3 horizontal blocks ── */}
        {topPrs.length > 0 && (
          <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '220ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: '1rem', fontWeight: 900, color: '#253A82' }}>Personal Records 🏆</p>
              <p style={{ fontSize: '0.75rem', color: '#4A6FA5', fontWeight: 600 }}>{topPrs.length} PRs</p>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(topPrs.length, 3)}, 1fr)` }}>
              {topPrs.map(([exId, weight], idx) => {
                const configs = [
                  { medal: '🥇', bg: '#E3FC87', textColor: '#253A82', shadow: '0 8px 20px rgba(227,252,135,0.5)' },
                  { medal: '🥈', bg: '#88A2FF', textColor: '#fff', shadow: '0 8px 20px rgba(136,162,255,0.4)' },
                  { medal: '🥉', bg: '#AB9DFF', textColor: '#fff', shadow: '0 8px 20px rgba(171,157,255,0.4)' },
                ]
                const c = configs[idx] ?? configs[2]
                const name = getExerciseById(exId)?.name ?? exId
                return (
                  <div key={exId} className="rounded-3xl p-4 flex flex-col items-center text-center"
                    style={{ background: c.bg, boxShadow: c.shadow }}>
                    <span style={{ fontSize: '2rem', marginBottom: 6 }}>{c.medal}</span>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: c.textColor, lineHeight: 1 }}>
                      {weight}<span style={{ fontSize: '0.7rem', opacity: 0.7 }}>kg</span>
                    </p>
                    <p style={{ fontSize: '0.62rem', fontWeight: 700, color: c.textColor, opacity: 0.75, marginTop: 5, lineHeight: 1.3, textAlign: 'center' }}>
                      {name}
                    </p>
                  </div>
                )
              })}
              {/* Placeholder slots if fewer than 3 PRs */}
              {Array.from({ length: Math.max(0, 3 - topPrs.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-3xl p-4 flex flex-col items-center justify-center text-center"
                  style={{ background: '#A8CFEE', minHeight: 120 }}>
                  <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>💪</span>
                  <p style={{ fontSize: '0.65rem', color: '#4A6FA5', marginTop: 6, fontWeight: 600 }}>Train more</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Last session — dark indigo outer, rose + amber inner ── */}
        {lastWorkout && (
          <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '300ms' }}>
            <p style={{ fontSize: '1rem', fontWeight: 900, color: '#253A82', marginBottom: 10 }}>Last Session</p>
            <div className="rounded-3xl overflow-hidden shadow-card-lg"
              style={{ background: 'linear-gradient(135deg,#253A82,#1E2E6B)' }}>
              {/* Workout info */}
              <div className="px-5 pt-5 pb-4">
                <div className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold mb-3"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                  ✓ Completed
                </div>
                <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: '1.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                  {lastWorkout.name}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {new Date(lastWorkout.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                  {' · '}{lastWorkout.exercises.length} exercises
                </p>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 20px' }} />

              {/* Rating (rose) + Improvement (amber) */}
              <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-3">
                <div className="rounded-2xl p-3" style={{ background: '#FFB2F7' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(37,58,130,0.5)', letterSpacing: '0.15em', marginBottom: 6 }}>RATING</p>
                  {lastWorkout.rating ? (
                    <>
                      <span style={{ fontSize: '1.8rem', lineHeight: 1, display: 'block' }}>
                        {['😴','😐','🙂','😤','🔥'][lastWorkout.rating - 1]}
                      </span>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#253A82', marginTop: 4 }}>
                        {['Weak','Meh','Good','Strong','Beast'][lastWorkout.rating - 1]}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(37,58,130,0.7)', marginTop: 4 }}>Not rated</p>
                  )}
                </div>
                <div className="rounded-2xl p-3" style={{ background: '#E3FC87' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(37,58,130,0.5)', letterSpacing: '0.15em', marginBottom: 6 }}>IMPROVEMENT</p>
                  {bestImprovement ? (
                    <>
                      <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#253A82', lineHeight: 1 }}>
                        +{bestImprovement.to - bestImprovement.from}kg
                      </p>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(37,58,130,0.8)', marginTop: 3, lineHeight: 1.3 }}>
                        {bestImprovement.name}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(37,58,130,0.7)', marginTop: 4 }}>Keep going!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
