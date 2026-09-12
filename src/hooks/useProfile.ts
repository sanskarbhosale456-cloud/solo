'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserProfile, ShadowSoldier } from '@/types'
import { isDemoMode, getDemoProfile, DEMO_SOLDIERS } from '@/lib/demo/demoMode'

interface ProfileData {
  profile: UserProfile
  soldiers: ShadowSoldier[]
  purchasedItems: string[]
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileData> => {
      // Demo mode: serve from localStorage
      if (isDemoMode()) {
        const profile = getDemoProfile()
        // Read current soldiers from localStorage (may have been updated by quest completions)
        try {
          const raw = localStorage.getItem('life-rpg:demo-soldiers')
          const soldiers: ShadowSoldier[] = raw ? JSON.parse(raw) : DEMO_SOLDIERS
          return { profile, soldiers, purchasedItems: [] }
        } catch {
          return { profile, soldiers: DEMO_SOLDIERS, purchasedItems: [] }
        }
      }

      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`)
      return res.json()
    },
    staleTime: 20_000,
    retry: (count, error) => {
      // Don't retry in demo mode
      if (isDemoMode()) return false
      return count < 2
    },
  })
}

/** Call this to force-refresh the profile in demo mode after a mutation */
export function useRefreshDemoProfile() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['profile'] })
}
