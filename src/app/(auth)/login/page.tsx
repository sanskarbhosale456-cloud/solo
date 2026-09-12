'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useHasAwakened } from '@/hooks/useHasAwakened'
import { AwakeningGate, ElectricSparks } from '@/components/awakening/AwakeningGate'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { hasAwakened, markAwakened } = useHasAwakened()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginError) {
        if (loginError.message.toLowerCase().includes('invalid')) {
          setError('Invalid credentials. Check your email and password.')
        } else {
          setError(loginError.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('System anomaly detected. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [showGate, setShowGate] = useState(true)

  // Force the cinematic to play ONCE every time you refresh the page for presentation purposes!
  if (showGate) {
    return <AwakeningGate onComplete={() => setShowGate(false)} />
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      id="main-content"
      className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden"
    >
      {/* Electric Sparks Background (dimmed) */}
      <ElectricSparks opacity={0.4} />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
        className="w-full max-w-md p-10 border border-cyan-500/40 bg-black/70 backdrop-blur-md shadow-[0_0_30px_rgba(0,240,255,0.15)] rounded-sm relative z-10"
      >
        {/* System Header */}
        <div className="text-center mb-10">
          <h2 
            className="text-cyan-400 font-bold tracking-[0.2em] uppercase text-2xl mb-2" 
            style={{ fontFamily: '"Cinzel", serif', textShadow: "0 0 15px rgba(0, 240, 255, 0.8)" }}
          >
            [ System Prompt ]
          </h2>
          <p className="text-cyan-100/60 text-[10px] tracking-[0.3em] uppercase">Player Authentication Required</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Inputs */}
          <div className="space-y-8">
            <div className="flex flex-col">
              <label htmlFor="email" className="text-cyan-300 text-[10px] font-bold tracking-widest uppercase mb-2 opacity-80">
                Player ID (Email)
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-b border-cyan-900 py-2 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_4px_15px_-3px_rgba(0,240,255,0.3)] transition-all duration-300"
                placeholder="hunter@system.com"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-cyan-300 text-[10px] font-bold tracking-widest uppercase mb-2 opacity-80">
                Secret Key (Password)
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-b border-cyan-900 py-2 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_4px_15px_-3px_rgba(0,240,255,0.3)] transition-all duration-300"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-6 p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-xs tracking-wider uppercase text-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-12 flex flex-col items-center">
            <button 
              type="submit"
              disabled={loading}
              className="btn-lightning w-full py-4 uppercase tracking-[0.3em] font-bold text-sm"
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </div>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-6">
          <DemoButton />
        </div>

        <p className="text-center text-cyan-500/50 text-[10px] tracking-widest uppercase mt-8 hover:text-cyan-300 hover:text-shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-all">
          <a href="/signup">Register as new player</a>
        </p>
      </motion.div>
    </motion.main>
  )
}

function DemoButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDemo() {
    setLoading(true)
    try {
      const { enterDemoMode } = await import('@/lib/demo/demoMode')
      enterDemoMode()
      await fetch('/api/demo', { method: 'POST' })
      router.push('/dashboard')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDemo}
      disabled={loading}
      className="w-full bg-transparent border border-cyan-800/50 text-cyan-500 hover:bg-cyan-900/20 hover:text-cyan-300 py-3 text-[10px] tracking-widest uppercase transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
    >
      {loading ? 'Loading Demo...' : 'Try Demo — No Account Needed'}
    </button>
  )
}
