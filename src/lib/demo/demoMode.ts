/**
 * Life RPG — Demo Mode
 *
 * A fully interactive demo that runs entirely in localStorage.
 * No Supabase required. All game logic mirrors the real server logic.
 * Demo data NEVER touches Supabase — it cannot read or modify real user data.
 */

import type { UserProfile, Quest, ShadowSoldier } from '@/types'
import { SHADOW_SOLDIERS } from '@/lib/progression/engine'

export const DEMO_STORAGE_KEY = 'life-rpg:demo-mode'
export const DEMO_PROFILE_KEY = 'life-rpg:demo-profile'
export const DEMO_QUESTS_KEY = 'life-rpg:demo-quests'
export const DEMO_SOLDIERS_KEY = 'life-rpg:demo-soldiers'
export const DEMO_PURCHASES_KEY = 'life-rpg:demo-purchases'

// ── Initial demo profile ────────────────────────────────────────
export const INITIAL_DEMO_PROFILE: UserProfile = {
  id: 'demo-user',
  username: 'Shadow Hunter',
  title: 'Initiate of the Gate',
  level: 7,
  xp: 1840,
  xp_to_next: 2430,
  rank: 'E',
  gold: 480,
  mana_crystals: 120,
  streak: 3,
  last_active: new Date().toISOString().slice(0, 10),
  stat_int: 14,
  stat_str: 11,
  stat_agi: 9,
  stat_vit: 12,
  stat_per: 8,
  equipped_frame: null,
  equipped_theme: 'void',
  created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
}

// ── Initial demo quests ────────────────────────────────────────
// Empty by default — users assign their own quests
export const INITIAL_DEMO_QUESTS: Quest[] = []

// ── Demo shadow soldiers (keys match SHADOW_SOLDIERS catalog) ──
export const DEMO_SOLDIERS: ShadowSoldier[] = [
  {
    id: 'ds-1',
    user_id: 'demo-user',
    soldier_key: 'initiate',
    soldier_name: 'The Initiate',
    skin: 'default',
    unlocked_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
]

// ── XP / level logic (mirrors server engine) ───────────────────
export function calcXpToNext(level: number): number {
  return Math.max(100, Math.round((100 * Math.pow(level, 1.8)) / 10) * 10)
}

export function calcRank(level: number): UserProfile['rank'] {
  if (level >= 70) return 'S'
  if (level >= 50) return 'A'
  if (level >= 35) return 'B'
  if (level >= 20) return 'C'
  if (level >= 10) return 'D'
  return 'E'
}

export interface DemoCompleteResult {
  newProfile: UserProfile
  xpGained: number
  goldGained: number
  leveledUp: boolean
  rankedUp: boolean
  newLevel: number
  newRank: UserProfile['rank']
  oldRank: UserProfile['rank']
  newSoldiers: ShadowSoldier[]
}

export function demoCompleteQuest(
  profile: UserProfile,
  quest: Quest,
  allSoldiers: ShadowSoldier[],
  completedCount: number
): DemoCompleteResult {
  const oldLevel = profile.level
  const oldRank = profile.rank

  let newXp = profile.xp + quest.xp_reward
  let newLevel = profile.level
  let xpToNext = profile.xp_to_next

  // Level-up loop (mirrors SQL function)
  while (newXp >= xpToNext) {
    newXp -= xpToNext
    newLevel++
    xpToNext = calcXpToNext(newLevel)
  }

  const newRank = calcRank(newLevel)
  const leveledUp = newLevel > oldLevel
  const rankedUp = newRank !== oldRank

  // Shadow soldier unlock logic — mirrors SQL: unlock at completion #1,
  // then every 5 completions up to 100 (keys from SHADOW_SOLDIERS catalog)
  const newSoldiers: ShadowSoldier[] = []
  const newCompletedCount = completedCount + 1
  const unlockedKeys = new Set(allSoldiers.map((s) => s.soldier_key))
  const milestone = SHADOW_SOLDIERS.find((s) => s.unlockAt === newCompletedCount)
  if (milestone && !unlockedKeys.has(milestone.key)) {
    newSoldiers.push({
      id: `ds-${Date.now()}`,
      user_id: 'demo-user',
      soldier_key: milestone.key,
      soldier_name: milestone.name,
      skin: 'default',
      unlocked_at: new Date().toISOString(),
    })
  }

  // Stat gain by discipline
  const statCol =
    quest.discipline === 'intellect'
      ? 'stat_int'
      : quest.discipline === 'strength'
        ? 'stat_str'
        : quest.discipline === 'agility'
          ? 'stat_agi'
          : quest.discipline === 'vitality'
            ? 'stat_vit'
            : 'stat_per'

  const newProfile: UserProfile = {
    ...profile,
    xp: newXp,
    xp_to_next: xpToNext,
    level: newLevel,
    rank: newRank,
    gold: profile.gold + quest.gold_reward,
    streak: profile.streak + (newCompletedCount === 1 ? 0 : 0) || profile.streak,
    last_active: new Date().toISOString().slice(0, 10),
    [statCol]: ((profile as unknown as Record<string, number>)[statCol] ?? 0) + 1,
  } as UserProfile

  return {
    newProfile,
    xpGained: quest.xp_reward,
    goldGained: quest.gold_reward,
    leveledUp,
    rankedUp,
    newLevel,
    newRank,
    oldRank,
    newSoldiers,
  }
}

// ── localStorage helpers ────────────────────────────────────────
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(DEMO_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function enterDemoMode() {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true')
    // Only seed if missing — preserve returning demo progress within 24h cookie window
    if (!localStorage.getItem(DEMO_PROFILE_KEY)) {
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(INITIAL_DEMO_PROFILE))
    }
    if (!localStorage.getItem(DEMO_QUESTS_KEY)) {
      localStorage.setItem(DEMO_QUESTS_KEY, JSON.stringify(INITIAL_DEMO_QUESTS))
    }
    if (!localStorage.getItem(DEMO_SOLDIERS_KEY)) {
      localStorage.setItem(DEMO_SOLDIERS_KEY, JSON.stringify(DEMO_SOLDIERS))
    }
  } catch {}
}

export function exitDemoMode() {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY)
    localStorage.removeItem(DEMO_PROFILE_KEY)
    localStorage.removeItem(DEMO_QUESTS_KEY)
    localStorage.removeItem(DEMO_SOLDIERS_KEY)
    localStorage.removeItem(DEMO_PURCHASES_KEY)
  } catch {}
}

export function getDemoProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(DEMO_PROFILE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : INITIAL_DEMO_PROFILE
  } catch {
    return INITIAL_DEMO_PROFILE
  }
}

export function getDemoQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(DEMO_QUESTS_KEY)
    return raw ? (JSON.parse(raw) as Quest[]) : INITIAL_DEMO_QUESTS
  } catch {
    return INITIAL_DEMO_QUESTS
  }
}

export function getDemoSoldiers(): ShadowSoldier[] {
  try {
    const raw = localStorage.getItem(DEMO_SOLDIERS_KEY)
    return raw ? (JSON.parse(raw) as ShadowSoldier[]) : DEMO_SOLDIERS
  } catch {
    return DEMO_SOLDIERS
  }
}

export function getDemoPurchases(): string[] {
  try {
    const raw = localStorage.getItem(DEMO_PURCHASES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveDemoProfile(profile: UserProfile) {
  try {
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile))
  } catch {}
}

export function saveDemoQuests(quests: Quest[]) {
  try {
    localStorage.setItem(DEMO_QUESTS_KEY, JSON.stringify(quests))
  } catch {}
}

export function saveDemoSoldiers(soldiers: ShadowSoldier[]) {
  try {
    localStorage.setItem(DEMO_SOLDIERS_KEY, JSON.stringify(soldiers))
  } catch {}
}

export function saveDemoPurchases(keys: string[]) {
  try {
    localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(keys))
  } catch {}
}
