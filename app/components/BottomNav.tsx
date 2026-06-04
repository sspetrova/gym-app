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
    <div className="sticky bottom-0 z-50" style={{ background: 'rgba(210,228,255,0.82)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.6)', borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 24px rgba(136,162,255,0.15)' }}>
      <div className="flex items-center justify-around px-6" style={{ paddingTop: 12, paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}>
        {NAV.map((item) => {
          const active = path === item.href
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center"
              style={{ gap: 5, minWidth: 90 }}>
              <span style={{ fontSize: '1.7rem', lineHeight: 1, display: 'block', filter: active ? 'none' : 'grayscale(0.3) opacity(0.5)', transition: 'all 0.2s', transform: active ? 'scale(1.1)' : 'scale(1)' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? '#253A82' : '#555', letterSpacing: '0.01em' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
