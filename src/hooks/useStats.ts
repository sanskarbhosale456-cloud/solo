'use client'

import { useQuery } from '@tanstack/react-query'
import { isDemoMode, getDemoProfile, getDemoQuests, getDemoSoldiers } from '@/lib/demo/demoMode'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      if (isDemoMode()) {
        const profile = getDemoProfile()
        const quests = getDemoQuests()
        const soldiers = getDemoSoldiers()
        const completed = quests.filter((q) => q.status === 'completed')
        return {
          profile: {
            level: profile.level,
            xp: profile.xp,
            xp_to_next: profile.xp_to_next,
            rank: profile.rank,
            streak: profile.streak,
            gold: profile.gold,
            mana_crystals: profile.mana_crystals,
            stats: {
              str: profile.stat_str,
              agi: profile.stat_agi,
              vit: profile.stat_vit,
              int: profile.stat_int,
              per: profile.stat_per,
            },
          },
          totals: {
            totalQuests: quests.length,
            completedQuests: completed.length,
            pendingQuests: quests.filter((q) => q.status === 'active').length,
            abandonedQuests: 0,
            totalXpEarned: completed.reduce((s, q) => s + q.xp_reward, 0),
            totalGoldEarned: completed.reduce((s, q) => s + q.gold_reward, 0),
            completionCount: completed.length,
            soldiersUnlocked: soldiers.length,
          },
          xpByDay: {},
          recentCompletions: [],
        }
      }
      const res = await fetch('/api/stats')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = json?.error
        throw new Error(typeof err === 'string' ? err : (err?.message ?? 'Failed to fetch stats'))
      }
      return (json.data ?? json.stats ?? json) as Record<string, unknown>
    },
    staleTime: 20_000,
    retry: false,
  })
}

export function useCompletions(limit = 50) {
  return useQuery({
    queryKey: ['completions', limit],
    queryFn: async () => {
      if (isDemoMode()) return []
      const res = await fetch(`/api/completions?limit=${limit}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('Failed to fetch completions')
      return ((json.data?.completions ?? json.completions ?? []) as unknown[]) ?? []
    },
    staleTime: 30_000,
    retry: false,
  })
}

export function useArmy() {
  return useQuery({
    queryKey: ['army'],
    queryFn: async () => {
      if (isDemoMode()) {
        const soldiers = getDemoSoldiers()
        return { soldiers, totalUnlocked: soldiers.length }
      }
      const res = await fetch('/api/army')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('Failed to fetch army')
      return (json.data ?? json) as { soldiers: unknown[]; catalog: unknown[]; totalUnlocked: number }
    },
    staleTime: 20_000,
    retry: false,
  })
}

export function useShop() {
  return useQuery({
    queryKey: ['shop'],
    queryFn: async () => {
      if (isDemoMode()) {
        const { SHOP_ITEMS } = await import('@/lib/progression/engine')
        const { getDemoProfile, getDemoPurchases } = await import('@/lib/demo/demoMode')
        const profile = getDemoProfile()
        const owned = new Set(getDemoPurchases())
        return {
          items: SHOP_ITEMS.map((i) => ({
            ...i,
            owned: owned.has(i.key),
            affordable:
              i.currencyType === 'gold' ? profile.gold >= i.cost : profile.mana_crystals >= i.cost,
          })),
          balance: { gold: profile.gold, mana_crystals: profile.mana_crystals },
          purchases: [],
        }
      }
      const res = await fetch('/api/shop')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('Failed to fetch shop')
      return (json.data ?? json) as Record<string, unknown>
    },
    staleTime: 20_000,
    retry: false,
  })
}
