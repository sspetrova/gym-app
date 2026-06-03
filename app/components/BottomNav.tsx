'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/history', icon: '📈', label: 'Progress' },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()
  if (path.startsWith('/workout/')) return null

  return (
    <div className="sticky bottom-0 z-50 shadow-card" style={{ background: 'rgba(240,238,248,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(124,92,191,0.1)' }}>
      <div className="flex items-center justify-around px-8 py-3 pb-6">
        {NAV.map((item) => {
          const active = path === item.href
          return (
            <button key={item.href} onClick={() => router.push(item.href)} className="btn-press flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl transition-all duration-300 shadow-card"
                style={{ background: active ? '#7C5CBF' : '#fff', transform: active ? 'scale(1.1)' : 'scale(1)' }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', color: active ? '#7C5CBF' : '#C4C0D8' }}>
                {item.label.toUpperCase()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
