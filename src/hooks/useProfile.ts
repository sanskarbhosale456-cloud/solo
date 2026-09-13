'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserProfile, ShadowSoldier } from '@/types'
import {
  isDemoMode,
  getDemoProfile,
  getDemoSoldiers,
  getDemoPurchases,
} from '@/lib/demo/demoMode'

interface ProfileData {
  profile: UserProfile
  soldiers: ShadowSoldier[]
  purchasedItems: string[]
  stats?: {
    totalQuests: number
    completedQuests: number
    pendingQuests: number
    totalXpEarned: number
    level: number
    rank: string
    streak: number
  }
}

function parseProfileJson(json: unknown): ProfileData {
  // New envelope: { success, data: { profile, soldiers, purchasedItems, stats } }
  const obj = json as Record<string, unknown>
  const inner = (obj?.data as Record<string, unknown>) ?? obj
  return {
    profile: (inner.profile ?? obj.profile) as UserProfile,
    soldiers: ((inner.soldiers ?? obj.soldiers) as ShadowSoldier[]) ?? [],
    purchasedItems: ((inner.purchasedItems ?? obj.purchasedItems) as string[]) ?? [],
    stats: (inner.stats ?? obj.stats) as ProfileData['stats'],
  }
}

function parseError(json: unknown, fallback: string): string {
  const obj = json as Record<string, unknown> | null
  const err = obj?.error as { message?: string } | string | undefined
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  if (typeof obj?.errorMessage === 'string') return obj.errorMessage as string
  return fallback
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileData> => {
      // Demo mode: serve from localStorage (never hits Supabase)
      if (isDemoMode()) {
        const profile = getDemoProfile()
        const soldiers = getDemoSoldiers()
        const purchasedItems = getDemoPurchases()
        return { profile, soldiers, purchasedItems }
      }

      const res = await fetch('/api/profile')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        // If demo cookie exists but localStorage was cleared, fall back to demo data
        if (typeof document !== 'undefined' && document.cookie.includes('life-rpg-demo=true')) {
          const profile = getDemoProfile()
          return { profile, soldiers: getDemoSoldiers(), purchasedItems: getDemoPurchases() }
        }
        throw new Error(parseError(json, `Failed to fetch profile: ${res.status}`))
      }
      return parseProfileJson(json)
    },
    staleTime: 20_000,
    retry: (count) => {
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
