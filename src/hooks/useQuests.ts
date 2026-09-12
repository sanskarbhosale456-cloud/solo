'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Quest, CreateQuestInput, CompleteQuestResult } from '@/types'
import { useGameEvents } from '@/hooks/useGameEvents'
import { getAudioManager } from '@/lib/audio/AudioManager'
import {
  isDemoMode,
  getDemoQuests,
  saveDemoQuests,
  getDemoProfile,
  saveDemoProfile,
  demoCompleteQuest,
  DEMO_SOLDIERS,
} from '@/lib/demo/demoMode'

// ---------------------------------------------------------------
// Fetch hooks
// ---------------------------------------------------------------
export function useQuests(status: 'active' | 'completed' | 'all' = 'active', type?: string) {
  return useQuery({
    queryKey: ['quests', status, type],
    queryFn: async () => {
      // Demo mode: filter from localStorage
      if (isDemoMode()) {
        const quests = getDemoQuests()
        return quests.filter((q) => {
          const matchStatus = status === 'all' || q.status === status
          const matchType = !type || q.type === type
          return matchStatus && matchType
        })
      }

      const params = new URLSearchParams({ status })
      if (type) params.set('type', type)
      const res = await fetch(`/api/quests?${params}`)
      if (!res.ok) throw new Error(`Failed to fetch quests: ${res.status}`)
      const data = await res.json()
      return data.quests as Quest[]
    },
    retry: isDemoMode() ? false : 2,
  })
}

export function useDailyQuests() {
  return useQuests('active', 'daily')
}

// ---------------------------------------------------------------
// Create quest
// ---------------------------------------------------------------
export function useCreateQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateQuestInput) => {
      // Demo mode: add to localStorage
      if (isDemoMode()) {
        const xpMap: Record<string, number> = { E: 50, D: 80, C: 180, B: 340, A: 600, S: 1000 }
        const goldMap: Record<string, number> = { E: 25, D: 40, C: 90, B: 170, A: 300, S: 500 }
        const assignedType = input.type ?? (input.quest_type === 'daily' ? 'daily' : 'weekly')
        const newQuest: Quest = {
          id: `demo-${Date.now()}`,
          user_id: 'demo-user',
          title: input.title,
          description: input.description ?? null,
          type: assignedType,
          quest_type: assignedType === 'daily' ? 'daily' : 'quest',
          discipline: input.discipline ?? 'strength',
          stat_tags: input.stat_tags && input.stat_tags.length > 0 ? input.stat_tags : [(input.discipline ?? 'strength').toUpperCase()],
          difficulty: input.difficulty ?? 'C',
          xp_reward: xpMap[input.difficulty ?? 'C'] ?? 100,
          gold_reward: goldMap[input.difficulty ?? 'C'] ?? 50,
          status: 'active',
          due_date: input.due_date ?? null,
          sort_order: 0,
          created_at: new Date().toISOString(),
          completed_at: null,
        }
        const quests = getDemoQuests()
        saveDemoQuests([...quests, newQuest])
        return newQuest
      }

      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? 'Failed to create quest')
      }
      const data = await res.json()
      return data.quest as Quest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
  })
}

// ---------------------------------------------------------------
// Complete quest — with optimistic update + rollback
// ---------------------------------------------------------------
export function useCompleteQuest() {
  const queryClient = useQueryClient()
  const { fireEvent } = useGameEvents()

  return useMutation({
    mutationFn: async (questId: string): Promise<CompleteQuestResult> => {
      // Demo mode: compute everything locally
      if (isDemoMode()) {
        const quests = getDemoQuests()
        const quest = quests.find((q) => q.id === questId)
        if (!quest) throw new Error('Quest not found')

        const profile = getDemoProfile()
        const completedCount = quests.filter((q) => q.status === 'completed').length

        // Read existing soldiers
        let soldiers = DEMO_SOLDIERS
        try {
          const raw = localStorage.getItem('life-rpg:demo-soldiers')
          if (raw) soldiers = JSON.parse(raw)
        } catch {}

        const result = demoCompleteQuest(profile, quest, soldiers, completedCount)

        // Persist updated state
        saveDemoProfile(result.newProfile)
        const updatedQuests = quests.map((q) =>
          q.id === questId
            ? { ...q, status: 'completed' as const, completed_at: new Date().toISOString() }
            : q
        )
        saveDemoQuests(updatedQuests)

        // Persist new soldiers
        const updatedSoldiers = [...soldiers, ...result.newSoldiers]
        try { localStorage.setItem('life-rpg:demo-soldiers', JSON.stringify(updatedSoldiers)) } catch {}

        return {
          xp_gained: result.xpGained,
          gold_gained: result.goldGained,
          leveled_up: result.leveledUp,
          ranked_up: result.rankedUp,
          new_level: result.newLevel,
          new_rank: result.newRank,
          old_rank: result.oldRank,
          new_soldiers: result.newSoldiers,
          new_xp: result.newProfile.xp,
          new_gold: result.newProfile.gold,
        } as unknown as CompleteQuestResult
      }

      const res = await fetch(`/api/quests/${questId}/complete`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? 'Failed to complete quest')
      }
      const data = await res.json()
      return data.result as CompleteQuestResult
    },
    onMutate: async (questId) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: ['quests'] })
      await queryClient.cancelQueries({ queryKey: ['profile'] })

      // Snapshot for rollback
      const previousQuests = queryClient.getQueryData<Quest[]>(['quests', 'active'])
      const previousProfile = queryClient.getQueryData(['profile'])

      // Optimistically remove the quest from active list
      queryClient.setQueryData<Quest[]>(['quests', 'active'], (old) =>
        old?.filter((q) => q.id !== questId) ?? []
      )
      queryClient.setQueryData<Quest[]>(['quests', 'active', undefined], (old) =>
        old?.filter((q) => q.id !== questId) ?? []
      )

      return { previousQuests, previousProfile }
    },
    onError: (err, questId, ctx) => {
      // Rollback
      if (ctx?.previousQuests) {
        queryClient.setQueryData(['quests', 'active'], ctx.previousQuests)
      }
      if (ctx?.previousProfile) {
        queryClient.setQueryData(['profile'], ctx.previousProfile)
      }
    },
    onSuccess: (result) => {
      const am = getAudioManager()

      // SFX priority: rank_up > level_up > complete
      if (result.ranked_up) {
        am.playSFX('rankup')
      } else if (result.leveled_up) {
        am.playSFX('levelup')
      } else {
        am.playSFX('complete')
      }

      // Fire game events (drives animation layer)
      fireEvent({ type: 'quest_complete', payload: result })
      if (result.leveled_up) {
        fireEvent({ type: 'level_up', payload: result })
      }
      if (result.ranked_up) {
        fireEvent({ type: 'rank_up', payload: result })
      }
      if (result.new_soldiers.length > 0) {
        fireEvent({ type: 'soldier_unlock', payload: result })
      }
    },
    onSettled: () => {
      // Always refetch to get authoritative server state
      queryClient.invalidateQueries({ queryKey: ['quests'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// ---------------------------------------------------------------
// Delete quest
// ---------------------------------------------------------------
export function useDeleteQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questId: string) => {
      if (isDemoMode()) {
        const quests = getDemoQuests()
        saveDemoQuests(quests.filter((q) => q.id !== questId))
        return
      }
      const res = await fetch(`/api/quests/${questId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete quest')
    },
    onMutate: async (questId) => {
      await queryClient.cancelQueries({ queryKey: ['quests'] })
      const previousQuests = queryClient.getQueryData<Quest[]>(['quests'])
      queryClient.setQueriesData({ queryKey: ['quests'] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((q) => q.id !== questId)
        }
        return old
      })
      return { previousQuests }
    },
    onError: (err, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
  })
}

// ---------------------------------------------------------------
// Update quest (edit / reorder)
// ---------------------------------------------------------------
export function useUpdateQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/quests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? 'Failed to update quest')
      }
      const data = await res.json()
      return data.quest as Quest
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
  })
}
