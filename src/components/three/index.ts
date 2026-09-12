'use client'

import dynamic from 'next/dynamic'

/**
 * Lazy-loaded 3D components — never SSR'd.
 * Always use these re-exports in page code instead of importing directly.
 */
export const ParticleFieldLazy = dynamic(
  () => import('./ParticleField').then((m) => ({ default: m.ParticleField })),
  { ssr: false, loading: () => null }
)

export const FloatingGateOrbLazy = dynamic(
  () => import('./FloatingGateOrb').then((m) => ({ default: m.FloatingGateOrb })),
  { ssr: false, loading: () => null }
)
