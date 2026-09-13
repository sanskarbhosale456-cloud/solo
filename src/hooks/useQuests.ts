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
  getDemoSoldiers,
  saveDemoSoldiers,
  demoCompleteQuest,
} from '@/lib/demo/demoMode'

function parseError(json: unknown, fallback: string): string {
  const obj = json as Record<string, unknown> | null
  const err = obj?.error as { message?: string } | string | undefined
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  if (typeof obj?.errorMessage === 'string') return obj.errorMessage as string
  return fallback
}

function unwrap<T>(json: Record<string, unknown>, key: string): T {
  const inner = (json.data as Record<string, unknown>) ?? {}
  return ((inner[key] ?? json[key]) as T) ?? (json.data as T)
}

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
          const matchType =
            !type ||
            q.type === type ||
            q.quest_type === type ||
            (type === 'weekly' && (q.type === 'weekly' || q.quest_type === 'quest'))
          return matchStatus && matchType
        })
      }

      const params = new URLSearchParams({ status })
      if (type) params.set('type', type)
      const res = await fetch(`/api/quests?${params}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(parseError(json, `Failed to fetch quests: ${res.status}`))
      return unwrap<Quest[]>(json, 'quests') ?? []
    },
    retry: false,
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
      // Demo mode: add to localStorage (mirror server reward tables)
      if (isDemoMode()) {
        const xpMap: Record<string, number> = { E: 30, D: 70, C: 140, B: 280, A: 500, S: 1000 }
        const goldMap: Record<string, number> = { E: 10, D: 25, C: 50, B: 100, A: 200, S: 500 }
        const assignedType = input.type ?? (input.quest_type === 'daily' ? 'daily' : 'weekly')
        const newQuest: Quest = {
          id: `demo-${Date.now()}`,
          user_id: 'demo-user',
          title: input.title,
          description: input.description ?? null,
          type: assignedType,
          quest_type: assignedType === 'daily' ? 'daily' : 'quest',
          discipline: input.discipline ?? 'strength',
          stat_tags:
            input.stat_tags && input.stat_tags.length > 0
              ? input.stat_tags
              : [(input.discipline ?? 'strength').toUpperCase()],
          difficulty: input.difficulty ?? 'C',
          xp_reward: xpMap[input.difficulty ?? 'C'] ?? 140,
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
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(parseError(json, 'Failed to create quest'))
      }
      return unwrap<Quest>(json, 'quest')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
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
        if (quest.status !== 'active') throw new Error('Quest already completed')

        const profile = getDemoProfile()
        const completedCount = quests.filter((q) => q.status === 'completed').length
        const soldiers = getDemoSoldiers()

        const result = demoCompleteQuest(profile, quest, soldiers, completedCount)

        // Persist updated state
        saveDemoProfile(result.newProfile)
        const updatedQuests = quests.map((q) =>
          q.id === questId
            ? { ...q, status: 'completed' as const, completed_at: new Date().toISOString() }
            : q
        )
        saveDemoQuests(updatedQuests)
        saveDemoSoldiers([...soldiers, ...result.newSoldiers])

        return {
          xp_gained: result.xpGained,
          gold_gained: result.goldGained,
          stat_gained: quest.discipline,
          level_before: profile.level,
          level_after: result.newLevel,
          rank_before: result.oldRank,
          rank_after: result.newRank,
          leveled_up: result.leveledUp,
          ranked_up: result.rankedUp,
          new_xp: result.newProfile.xp,
          new_xp_to_next: result.newProfile.xp_to_next,
          new_soldiers: result.newSoldiers.map((s) => ({ key: s.soldier_key, name: s.soldier_name })),
        } as CompleteQuestResult
      }

      const res = await fetch(`/api/quests/${questId}/complete`, {
        method: 'POST',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(parseError(json, 'Failed to complete quest'))
      }
      return unwrap<CompleteQuestResult>(json, 'result')
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
    onError: (_err, _questId, ctx) => {
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
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['army'] })
      queryClient.invalidateQueries({ queryKey: ['completions'] })
      queryClient.invalidateQueries({ queryKey: ['shop'] })
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
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(parseError(json, 'Failed to delete quest'))
    },
    onMutate: async (questId) => {
      await queryClient.cancelQueries({ queryKey: ['quests'] })
      const previousQuests = queryClient.getQueryData<Quest[]>(['quests'])
      queryClient.setQueriesData({ queryKey: ['quests'] }, (old: unknown) => {
        if (Array.isArray(old)) {
          return (old as Quest[]).filter((q) => q.id !== questId)
        }
        return old
      })
      return { previousQuests }
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
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
      if (isDemoMode()) {
        const quests = getDemoQuests()
        const updated = quests.map((q) => (q.id === id ? { ...q, ...input } : q))
        saveDemoQuests(updated)
        const found = updated.find((q) => q.id === id)
        if (!found) throw new Error('Quest not found')
        return found
      }
      const res = await fetch(`/api/quests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(parseError(json, 'Failed to update quest'))
      }
      return unwrap<Quest>(json, 'quest')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
    },
  })
}
