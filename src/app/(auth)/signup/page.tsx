'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !email.trim() || !password) {
      setError('All fields are required.')
      return
    }
    if (username.trim().length < 3) {
      setError('Hunter name must be at least 3 characters.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      // Clear any stale demo session before real registration
      try {
        if (localStorage.getItem('life-rpg:demo-mode') === 'true') {
          const { exitDemoMode } = await import('@/lib/demo/demoMode')
          exitDemoMode()
          await fetch('/api/demo', { method: 'DELETE' })
        }
      } catch {}
      const supabase = getSupabaseBrowserClient()
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim() },
        },
      })

      if (signupError) {
        setError(signupError.message)
        return
      }

      // If no session, email confirmation is required — try immediate sign-in
      // (works when "Confirm email" is disabled in Supabase Auth settings).
      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError || !signInData.session) {
          setSuccess(true)
          setError(
            'Account created. Check your email to confirm, then log in. (Or disable "Confirm email" in Supabase Auth settings for instant access.)'
          )
          return
        }
      }

      setSuccess(true)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('System anomaly detected. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-void flex items-center justify-center px-4"
    >
      {/* Ambient grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-glow-sky/60 font-display text-xs tracking-[0.3em] uppercase mb-4">
            <span className="h-px w-8 bg-glow-sky/30" />
            SYSTEM INITIALIZATION
            <span className="h-px w-8 bg-glow-sky/30" />
          </div>
          <h1 className="font-display text-3xl text-white text-glow tracking-wider uppercase">
            AWAKEN
          </h1>
          <p className="font-body text-white/50 text-sm mt-2">
            Register as a Hunter. Your journey begins here.
          </p>
        </div>

        {/* Form panel */}
        <div className="panel p-6">
          {success ? (
            <div
              role="status"
              aria-live="polite"
              className="text-center py-6"
            >
              <div className="text-glow-sky font-display text-lg tracking-widest mb-2">
                HUNTER REGISTERED
              </div>
              <p className="text-white/60 text-sm">
                Check your email to confirm, then logging you in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block font-display text-xs text-glow-sky tracking-widest uppercase mb-1.5"
                  >
                    Hunter Name
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-void-surface border border-glow/20 rounded px-3 py-2.5 text-white text-sm font-body placeholder-white/20 focus:border-glow focus:outline-none focus:ring-1 focus:ring-glow/50 transition-colors"
                    placeholder="Enter your hunter name"
                    required
                    minLength={3}
                    maxLength={30}
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block font-display text-xs text-glow-sky tracking-widest uppercase mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-void-surface border border-glow/20 rounded px-3 py-2.5 text-white text-sm font-body placeholder-white/20 focus:border-glow focus:outline-none focus:ring-1 focus:ring-glow/50 transition-colors"
                    placeholder="hunter@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block font-display text-xs text-glow-sky tracking-widest uppercase mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-void-surface border border-glow/20 rounded px-3 py-2.5 text-white text-sm font-body placeholder-white/20 focus:border-glow focus:outline-none focus:ring-1 focus:ring-glow/50 transition-colors"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-2 p-3 border border-danger/30 rounded bg-danger/10 text-danger text-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 flex-shrink-0" aria-hidden="true">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      INITIALIZING...
                    </span>
                  ) : (
                    'REGISTER HUNTER'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Login link */}
        <p className="text-center text-white/40 text-sm mt-4">
          Already awakened?{' '}
          <a href="/login" className="text-glow-sky hover:text-glow transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow rounded">
            Log In
          </a>
        </p>
      </div>
    </main>
  )
}
