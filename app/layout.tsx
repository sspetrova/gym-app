import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from './components/BottomNav'

export const metadata: Metadata = {
  title: 'GymAI — Your Adaptive Trainer',
  description: 'AI-powered workouts that adapt to how you feel today',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d0d0d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d0d0d] text-white antialiased">
        <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
