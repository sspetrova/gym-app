import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from './components/BottomNav'

export const metadata: Metadata = {
  title: 'GymAI — Your Adaptive Trainer',
  description: 'AI-powered workouts that adapt to how you feel today',
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#F0EEF8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#F0EEF8', color: '#1a1530' }} className="antialiased">
        <div className="max-w-md mx-auto min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
