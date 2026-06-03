'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkoutHistory, getPersonalRecords, seedDemoData } from '@/lib/storage'
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
          style={{ background: selected === i ? '#7C5CBF' : '#fff' }}>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: selected === i ? 'rgba(255,255,255,0.6)' : '#C4C0D8', letterSpacing: '0.05em' }}>
            {d.label.toUpperCase()}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: selected === i ? '#fff' : '#1a1530' }}>{d.num}</span>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: d.trained ? (selected === i ? 'rgba(255,255,255,0.8)' : '#4ADE80') : 'transparent'
          }} />
        </button>
      ))}
    </div>
  )
}

// PR Medal card
function PRCard({ rank, exerciseName, weight, delay }: { rank: number; exerciseName: string; weight: number; delay: number }) {
  const configs = [
    { medal: '🥇', bg: 'linear-gradient(135deg,#F5A623,#F59E0B)', shadow: '0 8px 24px rgba(245,166,35,0.4)' },
    { medal: '🥈', bg: 'linear-gradient(135deg,#9CA3AF,#6B7280)', shadow: '0 8px 24px rgba(156,163,175,0.4)' },
    { medal: '🥉', bg: 'linear-gradient(135deg,#FB923C,#C2410C)', shadow: '0 8px 24px rgba(251,146,60,0.4)' },
  ]
  const c = configs[rank] ?? configs[2]
  return (
    <div className="animate-pop-in rounded-3xl p-5 flex flex-col items-center text-center flex-shrink-0"
      style={{ opacity: 0, animationDelay: `${delay}ms`, background: c.bg, boxShadow: c.shadow, width: 150, minHeight: 160 }}>
      <span className="animate-wobble" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}>{c.medal}</span>
      <p className="dc" style={{ fontSize: '1.8rem', color: '#fff', lineHeight: 1 }}>{weight}<span style={{ fontSize: '0.9rem', opacity: 0.8 }}> kg</span></p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.3 }}>{exerciseName}</p>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    seedDemoData()
    setWorkouts(getWorkoutHistory(20))
    setPrs(getPersonalRecords())
    setMounted(true)
  }, [])

  const lastWorkout = workouts[0]
  const totalVolume = lastWorkout
    ? lastWorkout.exercises.reduce((s, ex) => s + ex.sets.filter(x => x.completed).reduce((ss, set) => ss + set.weightKg * set.reps, 0), 0)
    : 0

  const topPrs = Object.entries(prs).sort(([, a], [, b]) => b - a).slice(0, 3)

  const daysThisWeek = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return workouts.filter(w => new Date(w.date) > cutoff).length
  })()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0EEF8' }}>
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #7C5CBF', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F0EEF8' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between animate-slide-up" style={{ opacity: 0 }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#9895B0', fontWeight: 600 }}>{greeting} 👋</p>
            <h1 style={{ fontFamily: 'Nunito,sans-serif', fontSize: '1.8rem', fontWeight: 900, color: '#1a1530', lineHeight: 1.1, marginTop: 2 }}>
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
          style={{ opacity: 0, animationDelay: '60ms', background: 'linear-gradient(135deg,#7C5CBF 0%,#9B6FE0 50%,#A78BFA 100%)', minHeight: 160 }}>
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
                style={{ background: '#fff', color: '#7C5CBF' }}>
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

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ opacity: 0, animationDelay: '165ms' }}>
          <div className="rounded-3xl p-5 shadow-card-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#F5A623,#F59E0B)', minHeight: 120 }}>
            <div className="absolute animate-float2" style={{ top: -5, right: -5, fontSize: '3rem', opacity: 0.3 }}>💥</div>
            <p style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', marginBottom: 8 }}>LAST VOL</p>
            <p className="dc" style={{ fontSize: '2.8rem', color: '#fff', lineHeight: 1 }}>
              {lastWorkout ? Math.round(totalVolume) : '—'}
              <span style={{ fontSize: '1rem', opacity: 0.7, marginLeft: 3 }}>kg</span>
            </p>
          </div>
          <div className="rounded-3xl p-5 shadow-card-lg relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#5BC4F5,#0EA5E9)', minHeight: 120 }}>
            <div className="absolute animate-float" style={{ top: 5, right: 5, fontSize: '2.5rem', opacity: 0.3 }}>📅</div>
            <p style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', marginBottom: 8 }}>THIS WEEK</p>
            <p className="dc" style={{ fontSize: '2.8rem', color: '#fff', lineHeight: 1 }}>
              {daysThisWeek}
              <span style={{ fontSize: '1rem', opacity: 0.7, marginLeft: 3 }}>days</span>
            </p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full"
                  style={{ background: i < daysThisWeek ? '#fff' : 'rgba(255,255,255,0.2)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── PRs — BIG SECTION ── */}
        {topPrs.length > 0 && (
          <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '220ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: '1rem', fontWeight: 900, color: '#1a1530' }}>Personal Records 🏆</p>
              <p style={{ fontSize: '0.75rem', color: '#9895B0', fontWeight: 600 }}>{topPrs.length} PRs</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {topPrs.map(([exId, weight], idx) => (
                <PRCard key={exId} rank={idx}
                  exerciseName={getExerciseById(exId)?.name ?? exId}
                  weight={weight} delay={idx * 80} />
              ))}
              {/* Add more exercises teaser */}
              <div className="flex-shrink-0 rounded-3xl p-5 flex flex-col items-center justify-center shadow-card"
                style={{ background: '#fff', width: 130, minHeight: 160 }}>
                <p style={{ fontSize: '2rem' }}>💪</p>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9895B0', textAlign: 'center', marginTop: 8 }}>Train more to unlock PRs</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Last session ── */}
        {lastWorkout && (
          <div className="animate-slide-up" style={{ opacity: 0, animationDelay: '300ms' }}>
            <p style={{ fontSize: '1rem', fontWeight: 900, color: '#1a1530', marginBottom: 10 }}>Last Session</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Main session card */}
              <div className="rounded-3xl p-5 shadow-card-lg col-span-1 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#4ADE80,#16A34A)' }}>
                <div className="absolute animate-float" style={{ bottom: -5, right: -10, fontSize: '4rem', opacity: 0.2 }}>🏃</div>
                <div className="inline-flex px-2 py-1 rounded-xl text-xs font-bold mb-3"
                  style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                  Completed ✓
                </div>
                <p className="dc" style={{ fontSize: '1.2rem', color: '#fff', lineHeight: 1.1 }}>{lastWorkout.name}</p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
                  {new Date(lastWorkout.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  {lastWorkout.exercises.length} exercises
                </p>
              </div>

              {/* Stats mini cards */}
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl p-4 shadow-card flex-1"
                  style={{ background: 'linear-gradient(135deg,#F472B6,#DB2777)' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>VOLUME</p>
                  <p className="dc" style={{ fontSize: '1.4rem', color: '#fff' }}>{Math.round(totalVolume)}<span style={{ fontSize: '0.7rem', opacity: 0.8 }}> kg</span></p>
                </div>
                <div className="rounded-2xl p-4 shadow-card flex-1"
                  style={{ background: 'linear-gradient(135deg,#2DD4BF,#0D9488)' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>SETS</p>
                  <p className="dc" style={{ fontSize: '1.4rem', color: '#fff' }}>
                    {lastWorkout.exercises.reduce((s, ex) => s + ex.sets.filter(x => x.completed).length, 0)}
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}> done</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Motivational card ── */}
        <div className="rounded-3xl p-5 shadow-card animate-slide-up"
          style={{ opacity: 0, animationDelay: '360ms', background: '#fff' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl animate-pulse-s shadow-card"
              style={{ background: 'linear-gradient(135deg,#F0EEF8,#E8E4F8)', flexShrink: 0 }}>
              {daysThisWeek >= 5 ? '🏆' : daysThisWeek >= 3 ? '🌟' : '🎯'}
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a1530' }}>
                {daysThisWeek >= 5 ? 'You\'re on fire!' : daysThisWeek >= 3 ? 'Great momentum!' : 'Every rep counts!'}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#9895B0', marginTop: 2, lineHeight: 1.4 }}>
                {daysThisWeek >= 5
                  ? `${daysThisWeek} days this week. Keep the streak alive! 🔥`
                  : daysThisWeek >= 3
                  ? `${daysThisWeek}/7 days trained. Push for more!`
                  : 'Start a session today to build your streak.'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
