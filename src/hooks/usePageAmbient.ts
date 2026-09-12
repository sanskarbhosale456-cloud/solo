'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getAudioManager, type AmbientPage } from '@/lib/audio/AudioManager'

const ROUTE_AMBIENT: Record<string, AmbientPage> = {
  '/dashboard': 'status',
  '/quests': 'quests',
  '/stats': 'status',
  '/army': 'status',
  '/shop': 'shop',
}

/**
 * Wires up per-page ambient audio on route changes.
 * Mount this inside the authenticated AppShell layout.
 */
export function usePageAmbient() {
  const pathname = usePathname()

  useEffect(() => {
    const ambientKey = ROUTE_AMBIENT[pathname]
    if (ambientKey) {
      getAudioManager().playAmbient(ambientKey)
    }
  }, [pathname])
}

/** Component wrapper for the hook */
export function PageAmbientWatcher() {
  usePageAmbient()
  return null
}
