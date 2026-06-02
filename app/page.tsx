'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkoutHistory, getPersonalRecords, seedDemoData } from '@/lib/storage'
import { getExerciseById } from '@/lib/exercises'
import type { Workout } from '@/lib/types'

const D = 'Barlow Condensed, sans-serif'
const B = 'Barlow, sans-serif'

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
    ? lastWorkout.exercises.reduce(
        (s, ex) => s + ex.sets.filter((x) => x.completed).reduce((ss, set) => ss + set.weightKg * set.reps, 0), 0
      )
    : 0

  const topPrs = Object.entries(prs).sort(([, a], [, b]) => b - a).slice(0, 3)

  const daysThisWeek = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return workouts.filter((w) => new Date(w.date) > cutoff).length
  })()

  // Week dots
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2).toUpperCase()
    const dateStr = d.toISOString().split('T')[0]
    const trained = workouts.some((w) => w.date.split('T')[0] === dateStr)
    return { label, trained, isToday: i === 6 }
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'

  if (!mounted) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#00FF87] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 pt-12 pb-28">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up" style={{ opacity: 0 }}>
        <div>
          <p style={{ fontFamily: B, fontSize: '0.8rem', color: '#555', marginBottom: 2 }}>
            Good {greeting} 👋
          </p>
          <h1 style={{ fontFamily: D, fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, letterSpacing: '0.02em' }}>
            LET&apos;S TRAIN
          </h1>
        </div>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
          style={{ background: '#1e1e1e', border: '1px solid #252525' }}
        >
          🔥
        </div>
      </div>

      {/* START WORKOUT — hero card */}
      <button
        onClick={() => router.push('/workout/new')}
        className="btn-press w-full rounded-3xl mb-3 overflow-hidden relative animate-slide-up glow-green"
        style={{ animationDelay: '60ms', opacity: 0, minHeight: 130 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #00FF87 0%, #00e070 60%, #00c060 100%)' }}
        />
        {/* Decorative circle */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
          style={{ background: '#fff' }}
        />
        <div
          className="absolute -right-4 -bottom-6 w-20 h-20 rounded-full opacity-15"
          style={{ background: '#000' }}
        />
        <div className="relative z-10 p-6 text-left">
          <p style={{ fontFamily: B, fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.15em', marginBottom: 6 }}>
            READY TO GO?
          </p>
          <p style={{ fontFamily: D, fontSize: '2.2rem', fontWeight: 900, color: '#000', letterSpacing: '0.03em', lineHeight: 1 }}>
            START WORKOUT ⚡
          </p>
          <p style={{ fontFamily: B, fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)', marginTop: 8 }}>
            AI builds your session in seconds
          </p>
        </div>
      </button>

      {/* Bento row 1 — 2 equal cards */}
      <div className="grid grid-cols-2 gap-3 mb-3 animate-slide-up" style={{ animationDelay: '110ms', opacity: 0 }}>
        {/* Days this week */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: '#1a1040', border: '1px solid #2a1a60', minHeight: 110 }}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-20" style={{ background: '#a78bfa' }} />
          <p style={{ fontFamily: B, fontSize: '0.65rem', color: '#a78bfa', letterSpacing: '0.15em', marginBottom: 6 }}>THIS WEEK</p>
          <p style={{ fontFamily: D, fontSize: '3rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{daysThisWeek}</p>
          <p style={{ fontFamily: B, fontSize: '0.75rem', color: '#6040a0', marginTop: 4 }}>days trained</p>
        </div>

        {/* Last volume */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: '#1a0f00', border: '1px solid #3a2000', minHeight: 110 }}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-20" style={{ background: '#fb923c' }} />
          <p style={{ fontFamily: B, fontSize: '0.65rem', color: '#fb923c', letterSpacing: '0.15em', marginBottom: 6 }}>LAST VOL</p>
          <p style={{ fontFamily: D, fontSize: lastWorkout && totalVolume > 999 ? '2.2rem' : '3rem', fontWeight: 900, color: '#fb923c', lineHeight: 1 }}>
            {lastWorkout ? Math.round(totalVolume) : '—'}
          </p>
          <p style={{ fontFamily: B, fontSize: '0.75rem', color: '#6a3500', marginTop: 4 }}>kg lifted</p>
        </div>
      </div>

      {/* Week streak card */}
      <div
        className="rounded-3xl p-5 mb-3 animate-slide-up"
        style={{ animationDelay: '165ms', opacity: 0, background: '#161616', border: '1px solid #252525' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em' }}>WEEK STREAK</p>
          <span
            className="px-3 py-1 rounded-full text-black text-xs font-bold"
            style={{ background: '#00FF87', fontFamily: D, letterSpacing: '0.06em' }}
          >
            {daysThisWeek}/7
          </span>
        </div>
        <div className="flex gap-1.5">
          {weekDays.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-xl transition-all duration-300"
                style={{
                  height: 36,
                  background: d.trained ? '#00FF87' : d.isToday ? '#1e2e1e' : '#161616',
                  border: d.isToday && !d.trained ? '1.5px solid #00FF87/30' : '1.5px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontFamily: D, fontWeight: 800,
                  color: d.trained ? '#000' : '#333',
                }}
              >
                {d.trained ? '✓' : ''}
              </div>
              <p style={{ fontFamily: B, fontSize: '0.55rem', color: '#333', letterSpacing: '0.05em' }}>{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Last session + PRs row */}
      <div className="grid grid-cols-2 gap-3 mb-3 animate-slide-up" style={{ animationDelay: '220ms', opacity: 0 }}>
        {/* Last session */}
        {lastWorkout ? (
          <div
            className="rounded-3xl p-4 relative overflow-hidden"
            style={{ background: '#001a2e', border: '1px solid #003050' }}
          >
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-15" style={{ background: '#22d3ee' }} />
            <p style={{ fontFamily: B, fontSize: '0.6rem', color: '#22d3ee', letterSpacing: '0.15em', marginBottom: 6 }}>LAST SESSION</p>
            <p style={{ fontFamily: D, fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.1, color: '#fff', marginBottom: 6 }}>
              {lastWorkout.name}
            </p>
            <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#1a6a80' }}>
              {new Date(lastWorkout.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p style={{ fontFamily: D, fontSize: '0.85rem', color: '#22d3ee', marginTop: 4 }}>
              {lastWorkout.exercises.length} exercises
            </p>
          </div>
        ) : (
          <div className="rounded-3xl p-4" style={{ background: '#161616', border: '1px solid #252525' }}>
            <p style={{ fontFamily: B, fontSize: '0.6rem', color: '#444', letterSpacing: '0.15em', marginBottom: 8 }}>LAST SESSION</p>
            <p style={{ fontFamily: D, fontSize: '1.1rem', color: '#333' }}>No sessions yet</p>
          </div>
        )}

        {/* Top PR */}
        {topPrs[0] ? (
          <div
            className="rounded-3xl p-4 relative overflow-hidden"
            style={{ background: '#1a0015', border: '1px solid #3a0030' }}
          >
            <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full opacity-15" style={{ background: '#f472b6' }} />
            <p style={{ fontFamily: B, fontSize: '0.6rem', color: '#f472b6', letterSpacing: '0.15em', marginBottom: 6 }}>TOP PR 🏆</p>
            <p style={{ fontFamily: D, fontSize: '2rem', fontWeight: 900, color: '#f472b6', lineHeight: 1 }}>
              {topPrs[0][1]}<span style={{ fontSize: '0.9rem', marginLeft: 2 }}>kg</span>
            </p>
            <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#6a2060', marginTop: 4 }}>
              {getExerciseById(topPrs[0][0])?.name ?? topPrs[0][0]}
            </p>
          </div>
        ) : null}
      </div>

      {/* All PRs */}
      {topPrs.length > 1 && (
        <div
          className="rounded-3xl p-5 animate-slide-up"
          style={{ animationDelay: '275ms', opacity: 0, background: '#161616', border: '1px solid #252525' }}
        >
          <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>PERSONAL RECORDS</p>
          <div className="space-y-3">
            {topPrs.map(([exId, weight], idx) => {
              const ex = getExerciseById(exId)
              const colors = ['#00FF87', '#a78bfa', '#fb923c']
              return (
                <div key={exId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: `${colors[idx]}20`, color: colors[idx], fontFamily: D }}
                    >
                      {idx + 1}
                    </div>
                    <p style={{ fontFamily: B, fontSize: '0.88rem', color: '#ccc' }}>{ex?.name ?? exId}</p>
                  </div>
                  <p style={{ fontFamily: D, fontSize: '1.2rem', fontWeight: 800, color: colors[idx] }}>{weight} kg</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
