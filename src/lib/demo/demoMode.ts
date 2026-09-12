/**
 * Life RPG — Demo Mode
 *
 * A fully interactive demo that runs entirely in localStorage.
 * No Supabase required. All game logic mirrors the real server logic.
 */

import type { UserProfile, Quest, ShadowSoldier } from '@/types'

export const DEMO_STORAGE_KEY = 'life-rpg:demo-mode'
export const DEMO_PROFILE_KEY = 'life-rpg:demo-profile'
export const DEMO_QUESTS_KEY = 'life-rpg:demo-quests'

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
  stat_int: 14,
  stat_str: 11,
  stat_agi: 9,
  stat_vit: 12,
  stat_per: 8,
  equipped_frame: null,
  equipped_theme: 'void',
  last_active: new Date().toISOString(),
  created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
}

// ── Initial demo quests ────────────────────────────────────────
export const INITIAL_DEMO_QUESTS: Quest[] = [
  {
    id: 'dq-1',
    user_id: 'demo-user',
    title: 'Complete 30-minute workout',
    description: 'Push-ups, squats, and a 2km run.',
    type: 'daily',
    quest_type: 'daily',
    discipline: 'strength',
    stat_tags: ['STRENGTH'],
    difficulty: 'D',
    xp_reward: 80,
    gold_reward: 40,
    status: 'active',
    due_date: null,
    sort_order: 1,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: null,
  },
  {
    id: 'dq-2',
    user_id: 'demo-user',
    title: 'Read 20 pages of a technical book',
    description: null,
    type: 'daily',
    quest_type: 'daily',
    discipline: 'intellect',
    stat_tags: ['INTELLECT'],
    difficulty: 'E',
    xp_reward: 50,
    gold_reward: 25,
    status: 'active',
    due_date: null,
    sort_order: 2,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: null,
  },
  {
    id: 'dq-3',
    user_id: 'demo-user',
    title: 'Meditate for 10 minutes',
    description: 'Focus on breath. No distractions.',
    type: 'daily',
    quest_type: 'daily',
    discipline: 'vitality',
    stat_tags: ['VITALITY'],
    difficulty: 'E',
    xp_reward: 40,
    gold_reward: 20,
    status: 'completed',
    due_date: null,
    sort_order: 3,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    completed_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'wq-1',
    user_id: 'demo-user',
    title: 'Build a side project for 2 hours',
    description: 'Work on Life RPG or another passion project.',
    type: 'weekly',
    quest_type: 'quest',
    discipline: 'intellect',
    stat_tags: ['INTELLECT'],
    difficulty: 'C',
    xp_reward: 180,
    gold_reward: 90,
    status: 'active',
    due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    sort_order: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: null,
  },
  {
    id: 'wq-2',
    user_id: 'demo-user',
    title: 'Run 20km this week',
    description: null,
    type: 'weekly',
    quest_type: 'quest',
    discipline: 'agility',
    stat_tags: ['AGILITY'],
    difficulty: 'B',
    xp_reward: 340,
    gold_reward: 170,
    status: 'active',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    sort_order: 2,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed_at: null,
  },
  {
    id: 'wq-3',
    user_id: 'demo-user',
    title: 'Complete 5 strength workouts',
    description: 'Push your physical limits.',
    type: 'weekly',
    quest_type: 'quest',
    discipline: 'strength',
    stat_tags: ['STRENGTH'],
    difficulty: 'A',
    xp_reward: 600,
    gold_reward: 300,
    status: 'completed',
    due_date: new Date(Date.now() + 6 * 86400000).toISOString(),
    sort_order: 3,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

// ── Demo shadow soldiers ────────────────────────────────────────
export const DEMO_SOLDIERS: ShadowSoldier[] = [
  { id: 'ds-1', user_id: 'demo-user', soldier_key: 'soldier_01', soldier_name: 'Shadow Infantry', skin: 'default', unlocked_at: new Date(Date.now() - 6*86400000).toISOString() },
]

// ── XP / level logic (mirrors server engine) ───────────────────
export function calcXpToNext(level: number): number {
  return Math.round(100 * Math.pow(level, 1.8) / 10) * 10
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

  // Level-up loop
  while (newXp >= xpToNext) {
    newXp -= xpToNext
    newLevel++
    xpToNext = calcXpToNext(newLevel)
  }

  const newRank = calcRank(newLevel)
  const leveledUp = newLevel > oldLevel
  const rankedUp = newRank !== oldRank

  // Shadow soldier unlock logic: 1 at quest 1, then every 5
  const newSoldiers: ShadowSoldier[] = []
  const newCompletedCount = completedCount + 1
  const shouldUnlock =
    newCompletedCount === 1 ||
    (newCompletedCount > 1 && (newCompletedCount - 1) % 5 === 0)

  if (shouldUnlock && allSoldiers.length < 21) {
    const soldierKey = `soldier_${String(allSoldiers.length + 1).padStart(2, '0')}`
    newSoldiers.push({
      id: `ds-${Date.now()}`,
      user_id: 'demo-user',
      soldier_key: soldierKey,
      soldier_name: `Shadow Knight ${allSoldiers.length + 1}`,
      skin: 'default',
      unlocked_at: new Date().toISOString(),
    })
  }

  const newProfile: UserProfile = {
    ...profile,
    xp: newXp,
    xp_to_next: xpToNext,
    level: newLevel,
    rank: newRank,
    gold: profile.gold + quest.gold_reward,
    last_active: new Date().toISOString(),
  }

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
  try { return localStorage.getItem(DEMO_STORAGE_KEY) === 'true' } catch { return false }
}

export function enterDemoMode() {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true')
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(INITIAL_DEMO_PROFILE))
    localStorage.setItem(DEMO_QUESTS_KEY, JSON.stringify(INITIAL_DEMO_QUESTS))
  } catch {}
}

export function exitDemoMode() {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY)
    localStorage.removeItem(DEMO_PROFILE_KEY)
    localStorage.removeItem(DEMO_QUESTS_KEY)
  } catch {}
}

export function getDemoProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(DEMO_PROFILE_KEY)
    return raw ? JSON.parse(raw) : INITIAL_DEMO_PROFILE
  } catch { return INITIAL_DEMO_PROFILE }
}

export function getDemoQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(DEMO_QUESTS_KEY)
    return raw ? JSON.parse(raw) : INITIAL_DEMO_QUESTS
  } catch { return INITIAL_DEMO_QUESTS }
}

export function saveDemoProfile(profile: UserProfile) {
  try { localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile)) } catch {}
}

export function saveDemoQuests(quests: Quest[]) {
  try { localStorage.setItem(DEMO_QUESTS_KEY, JSON.stringify(quests)) } catch {}
}
