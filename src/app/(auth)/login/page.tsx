'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useHasAwakened } from '@/hooks/useHasAwakened'
import { AwakeningGate, ElectricSparks } from '@/components/awakening/AwakeningGate'
import { getAudioManager } from '@/lib/audio/AudioManager'
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
      // Clear any stale demo session before real login
      try {
        if (localStorage.getItem('life-rpg:demo-mode') === 'true') {
          const { exitDemoMode } = await import('@/lib/demo/demoMode')
          exitDemoMode()
          await fetch('/api/demo', { method: 'DELETE' })
        }
      } catch {}
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

      try {
        sessionStorage.setItem('life-rpg:play-login-audio', '1')
      } catch {}
      getAudioManager().playLoginSuccess()
      await new Promise((res) => setTimeout(res, 600))

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('System anomaly detected. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [showGate, setShowGate] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const x = (e.clientX / innerWidth - 0.5) * 16
      const y = (e.clientY / innerHeight - 0.5) * 16
      setMouseOffset({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Force the cinematic to play ONCE every time you refresh the page for presentation purposes!
  if (showGate) {
    return <AwakeningGate onComplete={() => setShowGate(false)} />
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      id="main-content"
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#03010b]"
    >
      {/* Dynamic Background with Subtle Parallax */}
      <motion.div
        className="absolute inset-[-20px] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/login-bg.jpg?v=3)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          transform: `translate3d(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px, 0)`,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Subtle vignettes & ambient depth overlays */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none z-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-purple-600/15 via-cyan-500/20 to-blue-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Floating subtle cosmic particles */}
      <CosmicAtmosphere />

      {/* CENTER: INTERACTIVE SYSTEM PROMPT CARD */}
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[430px] relative z-10"
        style={{
          transform: `translate3d(${mouseOffset.x * 0.25}px, ${mouseOffset.y * 0.25}px, 0)`,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Card outer frame */}
        <div className="relative rounded-2xl border border-cyan-400/40 bg-[#060416]/88 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25),0_0_90px_rgba(147,51,234,0.2),inset_0_0_30px_rgba(0,240,255,0.06)] hover:shadow-[0_0_60px_rgba(0,240,255,0.35),0_0_100px_rgba(147,51,234,0.25),inset_0_0_35px_rgba(0,240,255,0.1)] transition-shadow duration-500 overflow-hidden">
          
          {/* Futuristic Corner Tech Accents */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm pointer-events-none shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm pointer-events-none shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-purple-400 rounded-bl-sm pointer-events-none shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-purple-400 rounded-br-sm pointer-events-none shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#00f0ff]" />

          {/* System Header */}
          <div className="flex flex-col items-center mb-6">
            <h2 
              className="text-white font-display font-bold tracking-[0.28em] text-2xl uppercase text-center drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]"
              style={{ fontFamily: 'var(--font-cinzel), "Cinzel", serif' }}
            >
              SYSTEM PROMPT
            </h2>
            <p className="text-cyan-300/80 font-mono text-[9.5px] tracking-[0.3em] uppercase mt-1">
              Player Authentication Required
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Player ID (Email) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300/85 text-[10px] font-bold tracking-[0.25em] uppercase font-mono">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <label htmlFor="email">Player ID (Email)</label>
              </div>
              <div className="relative flex items-center bg-[#0a0722]/90 border border-purple-500/35 hover:border-purple-400/60 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.35)] rounded-lg px-3.5 py-2.5 transition-all duration-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/70 mr-2.5 flex-shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent w-full text-white text-sm focus:outline-none placeholder:text-white/20 font-body"
                  placeholder="hunter@system.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Secret Key (Password) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300/85 text-[10px] font-bold tracking-[0.25em] uppercase font-mono">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <label htmlFor="password">Secret Key (Password)</label>
              </div>
              <div className="relative flex items-center bg-[#0a0722]/90 border border-purple-500/35 hover:border-purple-400/60 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.35)] rounded-lg px-3.5 py-2.5 transition-all duration-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/70 mr-2.5 flex-shrink-0">
                  <circle cx="12" cy="16" r="1"/>
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent w-full text-white text-sm focus:outline-none placeholder:text-white/20 font-body"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/40 hover:text-cyan-300 transition-colors ml-2 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="p-3 border border-red-500/50 bg-red-950/40 text-red-300 text-xs tracking-wider uppercase text-center rounded-md shadow-[0_0_15px_rgba(239,68,68,0.25)] font-mono">
                {error}
              </div>
            )}

            {/* Authenticate Action Button */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-display font-bold uppercase text-sm tracking-[0.3em] text-white transition-all duration-300 relative group overflow-hidden border border-cyan-400/60 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 hover:from-blue-600 hover:via-indigo-500 hover:to-purple-600 shadow-[0_0_28px_rgba(0,240,255,0.45),inset_0_0_15px_rgba(255,255,255,0.25)] hover:shadow-[0_0_38px_rgba(0,240,255,0.65),inset_0_0_20px_rgba(255,255,255,0.35)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}</span>
                  {!loading && (
                    <span className="text-cyan-300 group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-3.5 opacity-70">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <span className="text-[9px] text-cyan-300/70 uppercase tracking-widest font-mono">OR</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          </div>

          {/* Demo Mode Button */}
          <div>
            <DemoButton />
          </div>

          {/* Register Link */}
          <p className="text-center text-cyan-400/80 hover:text-cyan-200 text-[10.5px] font-display font-bold tracking-[0.25em] uppercase mt-4 transition-all drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            <a href="/signup" className="hover:underline underline-offset-4 decoration-cyan-400/50">REGISTER AS NEW PLAYER</a>
          </p>
        </div>
      </motion.div>
    </motion.main>
  )
}

function CosmicAtmosphere() {
  const [particles, setParticles] = useState<any[]>([])

  useEffect(() => {
    // Generate particles client-side to prevent SSR hydration mismatch
    const generated = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1.5,
      left: Math.random() * 100,
      duration: Math.random() * 6 + 5,
      delay: Math.random() * 4,
      color: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#c084fc' : '#ffffff',
      glow: i % 3 === 0 ? 'rgba(0,240,255,0.8)' : 'rgba(192,132,252,0.8)',
    }))
    setParticles(generated)
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "105vh", opacity: 0 }}
          animate={{ 
            y: "-10vh", 
            opacity: [0, 0.8, 1, 0],
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay, 
            ease: "easeIn", 
            repeat: Infinity 
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            backgroundColor: p.color,
            boxShadow: `0 0 10px 3px ${p.glow}`,
          }}
        />
      ))}
    </div>
  )
}

function DemoButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDemo() {
    setLoading(true)
    try {
      try {
        sessionStorage.setItem('life-rpg:play-login-audio', '1')
      } catch {}
      getAudioManager().playLoginSuccess()

      // Sign out any stale Supabase session first so demo is clean
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
        await getSupabaseBrowserClient().auth.signOut()
      } catch {}
      const { enterDemoMode } = await import('@/lib/demo/demoMode')
      enterDemoMode()
      await fetch('/api/demo', { method: 'POST' })
      // Brief pause to allow the sound to start playing cleanly
      await new Promise((res) => setTimeout(res, 600))
      // Hard navigation ensures the demo cookie is sent on the next request
      window.location.href = '/dashboard'
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDemo}
      disabled={loading}
      className="w-full bg-[#0d0926]/75 border border-purple-500/35 hover:border-cyan-400/70 text-cyan-300/80 hover:text-white py-2.5 px-4 rounded-lg text-[10px] font-display font-bold tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.12)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
    >
      {loading ? 'LOADING DEMO...' : 'TRY DEMO — NO ACCOUNT NEEDED'}
    </button>
  )
}

