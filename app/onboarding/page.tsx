'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setUserPreferences, completeOnboarding } from '@/lib/storage'

const SPLITS = [
  { id: 'push_pull_legs', icon: '🔄', label: 'Push / Pull / Legs', sub: 'Classic 3-way split' },
  { id: 'upper_lower',    icon: '⬆️', label: 'Upper / Lower',       sub: '4-day split' },
  { id: 'full_body',      icon: '💥', label: 'Full Body',            sub: '3×/week compound' },
  { id: 'bro_split',      icon: '💪', label: 'Bro Split',            sub: 'One muscle per day' },
  { id: 'athlete',        icon: '🏃', label: 'Athletic / Functional', sub: 'Sport performance' },
  { id: 'no_preference',  icon: '🎲', label: 'No Preference',        sub: 'Let AI decide each time' },
]

const GOALS = [
  { id: 'strength',    icon: '🏋️', label: 'Strength',    sub: 'Heavy · Low reps',        bg: '#FFFBEB', border: '#F5C842', color: '#d97706' },
  { id: 'hypertrophy', icon: '💪', label: 'Hypertrophy', sub: 'Volume · Muscle growth',   bg: '#E8FBF0', border: '#2DD87A', color: '#16a34a' },
  { id: 'endurance',   icon: '🔥', label: 'Endurance',   sub: 'High reps · Conditioning', bg: '#F3EFFF', border: '#A78BFA', color: '#7c3aed' },
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [selectedSplits, setSelectedSplits] = useState<string[]>([])
  const [goal, setGoal] = useState('hypertrophy')

  function toggleSplit(id: string) {
    if (id === 'no_preference') { setSelectedSplits(['no_preference']); return }
    setSelectedSplits((prev) => {
      const without = prev.filter((s) => s !== 'no_preference')
      return without.includes(id) ? without.filter((s) => s !== id) : [...without, id]
    })
  }

  function handleFinish() {
    setUserPreferences({
      name: name.trim() || 'Athlete',
      favoriteSplits: selectedSplits.length > 0 ? selectedSplits : ['no_preference'],
      favoriteExercises: [],
      defaultGoal: goal,
    })
    completeOnboarding()
    router.replace('/')
  }

  /* ── Step 0: Name ── */
  if (step === 0) return (
    <div className="min-h-screen flex flex-col px-5 pt-16 pb-10 animate-slide-up" style={{ background: '#F0EEF8', opacity: 0 }}>
      <div className="flex-1">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-card"
          style={{ background: 'linear-gradient(135deg,#7C5CBF,#A78BFA)' }}>
          💪
        </div>
        <p style={{ fontSize: '0.8rem', color: '#9895B0', fontWeight: 600, marginBottom: 6 }}>WELCOME TO</p>
        <h1 style={{ fontFamily: 'Nunito,sans-serif', fontSize: '2.4rem', fontWeight: 900, color: '#1a1530', lineHeight: 1.1, marginBottom: 6 }}>
          GymAI
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#9895B0', lineHeight: 1.6, marginBottom: 36 }}>
          Your AI-powered workout coach. Let's set you up in 3 quick steps.
        </p>

        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1530', display: 'block', marginBottom: 10 }}>
          What should we call you?
        </label>
        <input
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setStep(1)}
          autoFocus
          className="w-full rounded-2xl px-4 py-4 text-base focus:outline-none font-medium shadow-card"
          style={{ background: '#fff', border: '2px solid transparent', fontFamily: 'DM Sans, sans-serif', color: '#1a1530' }}
        />
      </div>

      <button onClick={() => setStep(1)}
        className="btn-press w-full py-4 rounded-2xl font-bold text-white shadow-card-lg"
        style={{ background: 'linear-gradient(135deg,#7C5CBF,#9B6FE0)', fontSize: '1rem' }}>
        Let's go →
      </button>
    </div>
  )

  /* ── Step 1: Favourite splits ── */
  if (step === 1) return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-10 animate-slide-up" style={{ background: '#F0EEF8', opacity: 0 }}>
      <button onClick={() => setStep(0)} className="btn-press mb-6 text-sm font-medium" style={{ color: '#9895B0' }}>← Back</button>

      <div className="flex-1">
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C5CBF', letterSpacing: '0.15em', marginBottom: 6 }}>STEP 2 OF 3</p>
        <h2 style={{ fontFamily: 'Nunito,sans-serif', fontSize: '1.9rem', fontWeight: 900, color: '#1a1530', lineHeight: 1.1, marginBottom: 6 }}>
          {name ? `Hey ${name}! 👋` : 'Hey! 👋'}<br />
          <span style={{ fontWeight: 400, fontSize: '1.5rem' }}>Favourite training split?</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9895B0', marginBottom: 24, lineHeight: 1.5 }}>
          Pick one or more. AI will use these as a base — but still adapts daily to how you feel.
        </p>

        <div className="space-y-2">
          {SPLITS.map((s) => {
            const active = selectedSplits.includes(s.id)
            return (
              <button key={s.id} onClick={() => toggleSplit(s.id)}
                className="btn-press w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-200 shadow-card"
                style={{
                  background: active ? '#EDE9F8' : '#fff',
                  borderColor: active ? '#7C5CBF' : 'transparent',
                }}>
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: active ? '#7C5CBF' : '#1a1530' }}>{s.label}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9895B0', marginTop: 1 }}>{s.sub}</p>
                </div>
                {active && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: '#7C5CBF', color: '#fff' }}>✓</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={() => setStep(2)} disabled={selectedSplits.length === 0}
        className="btn-press w-full py-4 rounded-2xl font-bold text-white shadow-card-lg mt-6 disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg,#7C5CBF,#9B6FE0)', fontSize: '1rem' }}>
        Next →
      </button>
    </div>
  )

  /* ── Step 2: Default goal ── */
  return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-10 animate-slide-up" style={{ background: '#F0EEF8', opacity: 0 }}>
      <button onClick={() => setStep(1)} className="btn-press mb-6 text-sm font-medium" style={{ color: '#9895B0' }}>← Back</button>

      <div className="flex-1">
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C5CBF', letterSpacing: '0.15em', marginBottom: 6 }}>STEP 3 OF 3</p>
        <h2 style={{ fontFamily: 'Nunito,sans-serif', fontSize: '1.9rem', fontWeight: 900, color: '#1a1530', lineHeight: 1.1, marginBottom: 6 }}>
          Primary goal?
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9895B0', marginBottom: 24, lineHeight: 1.5 }}>
          Sets your default — you can change it any time before a session.
        </p>

        <div className="space-y-3">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className="btn-press w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-200 shadow-card"
              style={{ background: goal === g.id ? g.bg : '#fff', borderColor: goal === g.id ? g.border : 'transparent' }}>
              <span className="text-3xl">{g.icon}</span>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: '1rem', color: goal === g.id ? g.color : '#1a1530' }}>{g.label}</p>
                <p style={{ fontSize: '0.75rem', color: '#9895B0', marginTop: 2 }}>{g.sub}</p>
              </div>
              {goal === g.id && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ background: g.color, color: '#fff' }}>✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleFinish}
        className="btn-press w-full py-4 rounded-2xl font-bold text-white shadow-card-lg mt-6"
        style={{ background: 'linear-gradient(135deg,#7C5CBF,#9B6FE0)', fontSize: '1rem' }}>
        🚀 Start training
      </button>
    </div>
  )
}
