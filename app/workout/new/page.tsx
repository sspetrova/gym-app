'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateWorkout } from '@/lib/ai'
import { getWorkoutSummaries, setCurrentWorkout } from '@/lib/storage'
import type { CheckIn, Workout } from '@/lib/types'

const D = 'Barlow Condensed, sans-serif'
const B = 'Barlow, sans-serif'

const INJURIES = ['Shoulder', 'Knee', 'Lower Back', 'Wrist', 'Hip', 'Neck', 'None']
const GOALS = [
  { id: 'strength',    icon: '🏋️', label: 'STRENGTH',    sub: 'Heavy · Low reps',        color: '#fb923c', bg: '#1a0f00', border: '#3a2000' },
  { id: 'hypertrophy', icon: '💪', label: 'HYPERTROPHY', sub: 'Volume · Muscle growth',   color: '#00FF87', bg: '#001a0e', border: '#004025' },
  { id: 'endurance',   icon: '🔥', label: 'ENDURANCE',   sub: 'High reps · Conditioning', color: '#a78bfa', bg: '#0f0a20', border: '#2a1a50' },
]

function EnergySlider({ label, value, onChange, color, lo, hi }: {
  label: string; value: number; onChange: (v: number) => void
  color: string; lo: string; hi: string
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</p>
        <div className="px-3 py-1 rounded-xl text-xs font-bold" style={{ background: `${color}20`, color, fontFamily: D, fontSize: '1rem' }}>
          {value}/5
        </div>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ accentColor: color }} />
      <div className="flex justify-between mt-1.5">
        <span className="text-lg">{lo}</span>
        <span className="text-lg">{hi}</span>
      </div>
    </div>
  )
}

function SorenessBtn({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const states = [
    { color: '#333', bg: '#161616', border: '#252525', text: 'NONE' },
    { color: '#fbbf24', bg: '#1a1400', border: '#3a2e00', text: 'LIGHT' },
    { color: '#fb923c', bg: '#1a0f00', border: '#3a2000', text: 'SORE' },
    { color: '#f87171', bg: '#1a0500', border: '#3a0e0e', text: 'VERY' },
  ]
  const s = states[value]
  return (
    <button
      onClick={() => onChange((value + 1) % 4)}
      className="btn-press flex-1 py-3 rounded-2xl border transition-all duration-200 text-center"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <p style={{ fontFamily: B, fontSize: '0.55rem', color: '#444', letterSpacing: '0.15em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.text}</p>
    </button>
  )
}

export default function NewWorkout() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [checkin, setCheckin] = useState<CheckIn>({
    energy: 3, sleep: 3, soreness: { upper: 0, lower: 0, core: 0 }, injuries: [], notes: '',
  })
  const [userGoal, setUserGoal] = useState('hypertrophy')
  const [loading, setLoading] = useState(false)
  const [reasoningText, setReasoningText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function toggleInjury(injury: string) {
    if (injury === 'None') { setCheckin((c) => ({ ...c, injuries: [] })); return }
    const key = injury.toLowerCase()
    setCheckin((c) => ({
      ...c,
      injuries: c.injuries.includes(key) ? c.injuries.filter((i) => i !== key) : [...c.injuries, key],
    }))
  }

  async function handleGenerate() {
    setStep(2); setLoading(true); setError(null); setReasoningText('')
    const msgs = ['Analyzing energy & sleep...', 'Checking workout history...', 'Avoiding sore muscles...', 'Selecting exercises...', 'Finalizing your session...']
    let idx = 0
    const iv = setInterval(() => { setReasoningText(msgs[idx % msgs.length]); idx++ }, 1100)
    try {
      const history = getWorkoutSummaries(8)
      const generated = await generateWorkout({ checkin, history, userGoal })
      clearInterval(iv)
      setReasoningText(generated.reasoning)
      const workout: Workout = {
        id: `workout_${Date.now()}`,
        date: new Date().toISOString(),
        name: generated.workoutName,
        reasoning: generated.reasoning,
        completed: false,
        injuries: checkin.injuries,
        userGoal,
        exercises: generated.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          suggestedWeightKg: ex.suggestedWeightKg,
          lastWeightKg: ex.lastWeightKg,
          substituteReason: ex.substituteReason,
          sets: Array.from({ length: ex.sets }, () => ({ weightKg: ex.suggestedWeightKg, reps: ex.reps, completed: false })),
        })),
      }
      setCurrentWorkout(workout)
      await new Promise((r) => setTimeout(r, 1800))
      router.push('/workout/active')
    } catch (err) {
      clearInterval(iv)
      setError(err instanceof Error ? err.message : 'Failed to generate workout')
      setLoading(false)
    }
  }

  /* ── STEP 0 ── */
  if (step === 0) return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 pt-10 pb-10 animate-slide-up" style={{ opacity: 0 }}>
      <button onClick={() => router.push('/')} className="btn-press mb-7 flex items-center gap-2 text-[#444]" style={{ fontFamily: D, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
        ← BACK
      </button>

      <div className="mb-7">
        <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#00FF87', letterSpacing: '0.2em', marginBottom: 4 }}>STEP 1 OF 3</p>
        <h1 style={{ fontFamily: D, fontSize: '3rem', fontWeight: 900, lineHeight: 1, letterSpacing: '0.02em' }}>
          HOW ARE YOU<br />FEELING TODAY?
        </h1>
      </div>

      <div className="rounded-3xl p-5 mb-4" style={{ background: '#161616', border: '1px solid #252525' }}>
        <EnergySlider label="ENERGY LEVEL" value={checkin.energy} onChange={(v) => setCheckin((c) => ({ ...c, energy: v }))} color="#00FF87" lo="💀" hi="🔥" />
        <EnergySlider label="SLEEP QUALITY" value={checkin.sleep}  onChange={(v) => setCheckin((c) => ({ ...c, sleep: v }))}  color="#a78bfa" lo="😵" hi="🌟" />
        <div>
          <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>MUSCLE SORENESS</p>
          <div className="flex gap-2">
            <SorenessBtn label="UPPER" value={checkin.soreness.upper} onChange={(v) => setCheckin((c) => ({ ...c, soreness: { ...c.soreness, upper: v } }))} />
            <SorenessBtn label="LOWER" value={checkin.soreness.lower} onChange={(v) => setCheckin((c) => ({ ...c, soreness: { ...c.soreness, lower: v } }))} />
            <SorenessBtn label="CORE"  value={checkin.soreness.core}  onChange={(v) => setCheckin((c) => ({ ...c, soreness: { ...c.soreness, core: v } }))} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>TRAINING GOAL</p>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => setUserGoal(g.id)}
              className="btn-press w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200"
              style={{
                background: userGoal === g.id ? g.bg : '#111',
                borderColor: userGoal === g.id ? g.border : '#1e1e1e',
              }}
            >
              <span className="text-2xl">{g.icon}</span>
              <div>
                <p style={{ fontFamily: D, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.04em', color: userGoal === g.id ? g.color : '#fff' }}>{g.label}</p>
                <p style={{ fontFamily: B, fontSize: '0.75rem', color: '#555', marginTop: 1 }}>{g.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setStep(1)} className="btn-press w-full py-5 rounded-2xl text-black glow-green"
        style={{ background: 'linear-gradient(135deg,#00FF87,#00cc6a)', fontFamily: D, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.1em' }}>
        NEXT →
      </button>
    </div>
  )

  /* ── STEP 1 ── */
  if (step === 1) return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 pt-10 pb-10 animate-slide-left" style={{ opacity: 0 }}>
      <button onClick={() => setStep(0)} className="btn-press mb-7 text-[#444]" style={{ fontFamily: D, fontSize: '0.85rem', letterSpacing: '0.08em' }}>← BACK</button>

      <div className="mb-7">
        <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#a78bfa', letterSpacing: '0.2em', marginBottom: 4 }}>STEP 2 OF 3</p>
        <h1 style={{ fontFamily: D, fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>ANY INJURIES<br />TODAY?</h1>
        <p style={{ fontFamily: B, fontSize: '0.85rem', color: '#555', marginTop: 8 }}>AI replaces any affected exercises automatically.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {INJURIES.map((injury) => {
          const key = injury.toLowerCase()
          const active = injury === 'None' ? checkin.injuries.length === 0 : checkin.injuries.includes(key)
          return (
            <button key={injury} onClick={() => toggleInjury(injury)}
              className="btn-press px-4 py-2.5 rounded-2xl border transition-all duration-200"
              style={{
                fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em',
                background: active ? '#001a2e' : '#111',
                borderColor: active ? '#22d3ee' : '#1e1e1e',
                color: active ? '#22d3ee' : '#555',
              }}>
              {injury.toUpperCase()}
            </button>
          )
        })}
      </div>

      {checkin.injuries.length > 0 && (
        <div className="rounded-2xl p-4 mb-5 animate-fade-in" style={{ opacity: 0, background: '#001a2e', border: '1px solid #003a5a' }}>
          <p style={{ fontFamily: D, fontSize: '0.7rem', color: '#22d3ee', letterSpacing: '0.15em', marginBottom: 4 }}>AI ADAPTS YOUR WORKOUT</p>
          <p style={{ fontFamily: B, fontSize: '0.85rem', color: '#888' }}>
            Avoiding exercises that stress: <span style={{ color: '#ccc' }}>{checkin.injuries.join(', ')}</span>
          </p>
        </div>
      )}

      <div className="mb-7">
        <label style={{ fontFamily: D, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>ANYTHING ELSE?</label>
        <textarea value={checkin.notes} onChange={(e) => setCheckin((c) => ({ ...c, notes: e.target.value }))}
          placeholder="e.g. tight hamstrings, no squat rack..."
          className="w-full rounded-2xl p-4 text-white text-sm resize-none h-20 focus:outline-none placeholder:text-[#252525]"
          style={{ background: '#161616', border: '1px solid #252525', fontFamily: B }} />
      </div>

      <button onClick={handleGenerate} className="btn-press w-full py-5 rounded-2xl text-black glow-green"
        style={{ background: 'linear-gradient(135deg,#00FF87,#00cc6a)', fontFamily: D, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.1em' }}>
        BUILD MY WORKOUT ⚡
      </button>
    </div>
  )

  /* ── STEP 2: Loading ── */
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-6 text-center">
      <div className="animate-fade-in w-full max-w-sm" style={{ opacity: 0 }}>
        {/* Spinner */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full" style={{ border: '2px solid #1e1e1e' }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: '#00FF87', borderRightColor: '#00FF87/30' }} />
          <div className="absolute inset-4 rounded-full" style={{ border: '1.5px solid #252525' }} />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">⚡</div>
        </div>

        <h1 style={{ fontFamily: D, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.05, marginBottom: 6 }}>
          BUILDING YOUR<br />WORKOUT
        </h1>
        <p style={{ fontFamily: B, fontSize: '0.7rem', color: '#444', letterSpacing: '0.2em', marginBottom: 28 }}>
          AI IS REASONING ABOUT YOUR SESSION
        </p>

        {reasoningText && (
          <div className="w-full rounded-3xl p-5 text-left animate-scale-in" style={{ opacity: 0, background: '#161616', border: '1px solid #252525' }}>
            <p style={{ fontFamily: D, fontSize: '0.65rem', color: '#00FF87', letterSpacing: '0.2em', marginBottom: 8 }}>AI REASONING</p>
            <p style={{ fontFamily: B, fontSize: '0.9rem', color: '#ccc', lineHeight: 1.65 }}>
              {reasoningText}
              {loading && <span className="animate-blink ml-0.5" style={{ color: '#00FF87' }}>|</span>}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5">
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#1a0505', border: '1px solid #3a1010' }}>
              <p style={{ fontFamily: B, fontSize: '0.85rem', color: '#f87171' }}>{error}</p>
            </div>
            <button onClick={() => router.push('/')} className="btn-press px-6 py-3 rounded-2xl border text-[#666]"
              style={{ fontFamily: D, fontSize: '0.9rem', letterSpacing: '0.08em', borderColor: '#252525' }}>
              BACK TO HOME
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
