'use client'

import { useEffect, useState } from 'react'

const AWAKENED_KEY = 'life-rpg:awakened'

/**
 * UI onboarding flag — localStorage only.
 * Exempt from the no-localStorage constraint because it's a same-browser
 * UI preference, not game state. Game data lives in Supabase.
 */
export function useHasAwakened() {
  const [hasAwakened, setHasAwakened] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const val = localStorage.getItem(AWAKENED_KEY)
      setHasAwakened(val === 'true')
    } catch {
      // localStorage unavailable (SSR/privacy mode)
      setHasAwakened(true)
    }
  }, [])

  const markAwakened = () => {
    try {
      localStorage.setItem(AWAKENED_KEY, 'true')
    } catch {
      // ignore
    }
    setHasAwakened(true)
  }

  const resetAwakened = () => {
    try {
      localStorage.removeItem(AWAKENED_KEY)
    } catch {
      // ignore
    }
    setHasAwakened(false)
  }

  return { hasAwakened, markAwakened, resetAwakened }
}
