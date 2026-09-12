// ============================================================
// Life RPG — Shared TypeScript Types
// ============================================================

export type Difficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type Discipline = 'intellect' | 'strength' | 'agility' | 'vitality' | 'perception'
export type QuestType = 'quest' | 'daily' | 'gate'
export type QuestStatus = 'active' | 'completed' | 'abandoned'

export interface UserProfile {
  id: string
  username: string
  level: number
  xp: number
  xp_to_next: number
  rank: Rank
  gold: number
  mana_crystals: number
  streak: number
  last_active: string | null
  stat_str: number
  stat_agi: number
  stat_vit: number
  stat_int: number
  stat_per: number
  equipped_frame: string | null
  equipped_theme: string
  title: string | null
  created_at: string
}

export interface Quest {
  id: string
  user_id: string
  title: string
  description: string | null
  discipline: Discipline
  stat_tags?: string[]
  difficulty: Difficulty
  quest_type: QuestType
  type?: string
  xp_reward: number
  gold_reward: number
  status: QuestStatus
  due_date: string | null
  sort_order: number
  completed_at: string | null
  created_at: string
}

export interface QuestCompletion {
  id: string
  user_id: string
  quest_id: string
  xp_gained: number
  gold_gained: number
  stat_gained: Discipline
  level_before: number
  level_after: number
  rank_before: Rank
  rank_after: Rank
  completed_at: string
}

export interface ShadowSoldier {
  id: string
  user_id: string
  soldier_key: string
  soldier_name: string
  unlocked_at: string
  skin: string
}

export interface ShopPurchase {
  id: string
  user_id: string
  item_key: string
  currency_type: 'gold' | 'mana_crystals'
  cost: number
  purchased_at: string
}

// ---------------------------------------------------------------
// API response types
// ---------------------------------------------------------------
export interface CompleteQuestResult {
  xp_gained: number
  gold_gained: number
  stat_gained: Discipline
  level_before: number
  level_after: number
  rank_before: Rank
  rank_after: Rank
  leveled_up: boolean
  ranked_up: boolean
  new_xp: number
  new_xp_to_next: number
  new_soldiers: Array<{ key: string; name: string }>
}

export interface ApiError {
  error: string
  code?: string
}

// ---------------------------------------------------------------
// Form / input types
// ---------------------------------------------------------------
export interface CreateQuestInput {
  title: string
  description?: string
  discipline?: Discipline
  stat_tags?: string[]
  difficulty?: Difficulty
  quest_type?: QuestType
  type?: string
  due_date?: string
}

export interface UpdateQuestInput {
  title?: string
  description?: string
  discipline?: Discipline
  difficulty?: Difficulty
  due_date?: string | null
  sort_order?: number
}

// ---------------------------------------------------------------
// Client-side notification type (drives animation layer)
// ---------------------------------------------------------------
export interface GameEvent {
  type: 'level_up' | 'rank_up' | 'quest_complete' | 'soldier_unlock'
  payload: CompleteQuestResult
}
