'use client'

import { usePathname, useRouter } from 'next/navigation'

const D = 'Barlow Condensed, sans-serif'

const NAV = [
  { href: '/',        icon: '⚡', label: 'Home' },
  { href: '/history', icon: '📊', label: 'History' },
]

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()

  // Hide on active/done/new pages
  if (path.startsWith('/workout/')) return null

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-50"
      style={{ background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid #1e1e1e' }}
    >
      <div className="flex items-center justify-around px-6 py-3">
        {NAV.map((item) => {
          const active = path === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="btn-press flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all duration-200"
              style={{ background: active ? '#00FF87/10' : 'transparent' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                style={{
                  fontFamily: D,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: active ? '#00FF87' : '#444',
                }}
              >
                {item.label.toUpperCase()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
