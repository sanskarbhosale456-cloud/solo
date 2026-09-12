// ============================================================
// Life RPG — Server-Side Progression Engine
// All XP/reward math lives here. Never trust client-submitted values.
// ============================================================

export type Difficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type Discipline = 'intellect' | 'strength' | 'agility' | 'vitality' | 'perception'
export type QuestType = 'quest' | 'daily' | 'gate'

// ---------------------------------------------------------------
// XP Curve: non-linear polynomial
// Level n → n+1 requires: round(100 * n^1.8 / 10) * 10
// Level 1→2:  100 XP   Level 10→11: 6,310 XP
// Level 20→21: 20,720 XP   Level 50→51: ~99,500 XP
// ---------------------------------------------------------------
export function xpRequired(level: number): number {
  return Math.max(100, Math.round((100 * Math.pow(level, 1.8)) / 10) * 10)
}

// ---------------------------------------------------------------
// Reward Tables (by difficulty)
// ---------------------------------------------------------------
export const XP_TABLE: Record<Difficulty, number> = {
  E: 30,
  D: 70,
  C: 140,
  B: 280,
  A: 500,
  S: 1000,
}

export const GOLD_TABLE: Record<Difficulty, number> = {
  E: 10,
  D: 25,
  C: 50,
  B: 100,
  A: 200,
  S: 500,
}

export const MANA_TABLE: Record<Difficulty, number> = {
  E: 0,
  D: 0,
  C: 0,
  B: 5,
  A: 15,
  S: 40,
}

// ---------------------------------------------------------------
// Rank Thresholds (by level)
// ---------------------------------------------------------------
export const RANK_THRESHOLDS: Record<number, Rank> = {
  1: 'E',
  10: 'D',
  20: 'C',
  35: 'B',
  50: 'A',
  70: 'S',
}

export function rankForLevel(level: number): Rank {
  if (level >= 70) return 'S'
  if (level >= 50) return 'A'
  if (level >= 35) return 'B'
  if (level >= 20) return 'C'
  if (level >= 10) return 'D'
  return 'E'
}

// ---------------------------------------------------------------
// Compute quest rewards server-side
// ---------------------------------------------------------------
export function computeQuestRewards(difficulty: Difficulty): {
  xpReward: number
  goldReward: number
  manaReward: number
} {
  return {
    xpReward: XP_TABLE[difficulty],
    goldReward: GOLD_TABLE[difficulty],
    manaReward: MANA_TABLE[difficulty],
  }
}

// ---------------------------------------------------------------
// Stat column mapping
// ---------------------------------------------------------------
export const DISCIPLINE_TO_STAT: Record<Discipline, string> = {
  intellect: 'stat_int',
  strength: 'stat_str',
  agility: 'stat_agi',
  vitality: 'stat_vit',
  perception: 'stat_per',
}

// ---------------------------------------------------------------
// Shop items catalog
// ---------------------------------------------------------------
export const SHOP_ITEMS = [
  {
    key: 'frame_silver',
    name: 'Silver Hunter Frame',
    description: 'A clean silver border for seasoned hunters.',
    currencyType: 'gold' as const,
    cost: 50,
    category: 'frame',
  },
  {
    key: 'frame_void',
    name: 'Void Frame',
    description: 'Darkness given form. For those who walk the void.',
    currencyType: 'gold' as const,
    cost: 150,
    category: 'frame',
  },
  {
    key: 'frame_shadow_monarch',
    name: 'Shadow Monarch Frame',
    description: 'Reserved for the strongest. A frame of pure dominance.',
    currencyType: 'gold' as const,
    cost: 300,
    category: 'frame',
  },
  {
    key: 'skin_ember',
    name: 'Ember Soldier Skin',
    description: 'Cloaks your shadow soldiers in ember-glow.',
    currencyType: 'mana_crystals' as const,
    cost: 200,
    category: 'soldier_skin',
  },
  {
    key: 'skin_frost',
    name: 'Frost Soldier Skin',
    description: 'Your soldiers take on an icy, spectral form.',
    currencyType: 'mana_crystals' as const,
    cost: 500,
    category: 'soldier_skin',
  },
  {
    key: 'theme_shadow_monarch',
    name: 'Shadow Monarch Theme',
    description: 'A rare UI theme reserved for the strongest hunters. Violet-black with gold accents.',
    currencyType: 'gold' as const,
    cost: 1000,
    category: 'theme',
  },
] as const

export type ShopItemKey = (typeof SHOP_ITEMS)[number]['key']

// ---------------------------------------------------------------
// Shadow Army soldiers catalog
// ---------------------------------------------------------------
export const SHADOW_SOLDIERS = [
  { key: 'initiate',        name: 'The Initiate',      unlockAt: 1,   description: 'First to rise. Quiet and resolute.' },
  { key: 'shadow_rogue',    name: 'Shadow Rogue',      unlockAt: 5,   description: 'Moves in silence. Strikes from darkness.' },
  { key: 'iron_sentinel',   name: 'Iron Sentinel',     unlockAt: 10,  description: 'Unbreakable will. Immovable as stone.' },
  { key: 'voidwalker',      name: 'Voidwalker',        unlockAt: 15,  description: 'Exists between moments. Feared by all.' },
  { key: 'ember_knight',    name: 'Ember Knight',      unlockAt: 20,  description: 'Burns with quiet fury. Never retreats.' },
  { key: 'storm_caller',    name: 'Storm Caller',      unlockAt: 25,  description: 'Commands the chaos. Thrives in the storm.' },
  { key: 'silent_blade',    name: 'Silent Blade',      unlockAt: 30,  description: 'No sound. No mercy. Just results.' },
  { key: 'bone_warden',     name: 'Bone Warden',       unlockAt: 35,  description: 'Guards the gate between life and death.' },
  { key: 'ash_revenant',    name: 'Ash Revenant',      unlockAt: 40,  description: 'Rises from every defeat stronger.' },
  { key: 'plague_herald',   name: 'Plague Herald',     unlockAt: 45,  description: 'Carries the weight of fallen worlds.' },
  { key: 'obsidian_giant',  name: 'Obsidian Giant',    unlockAt: 50,  description: 'A titan carved from the void itself.' },
  { key: 'frost_specter',   name: 'Frost Specter',     unlockAt: 55,  description: 'Time slows in its presence.' },
  { key: 'crimson_warden',  name: 'Crimson Warden',    unlockAt: 60,  description: 'Blood-sworn protector of the sovereign.' },
  { key: 'eclipse_hunter',  name: 'Eclipse Hunter',    unlockAt: 65,  description: 'Hunts in the space between light and dark.' },
  { key: 'void_sovereign',  name: 'Void Sovereign',    unlockAt: 70,  description: 'Rules over emptiness with absolute authority.' },
  { key: 'nether_wraith',   name: 'Nether Wraith',     unlockAt: 75,  description: 'Ancient. Patient. Inevitable.' },
  { key: 'chaos_herald',    name: 'Chaos Herald',      unlockAt: 80,  description: 'Order collapses before it. Chaos follows.' },
  { key: 'time_weaver',     name: 'Time Weaver',       unlockAt: 85,  description: 'Bends moments like thread on a loom.' },
  { key: 'death_sovereign', name: 'Death Sovereign',   unlockAt: 90,  description: 'Commands the final threshold.' },
  { key: 'abyss_titan',     name: 'Abyss Titan',       unlockAt: 95,  description: 'Born from the deepest dark. Unstoppable.' },
  { key: 'shadow_monarch',  name: 'Shadow Monarch',    unlockAt: 100, description: 'The pinnacle. Ruler of all shadows.' },
] as const

export type SoldierKey = (typeof SHADOW_SOLDIERS)[number]['key']

// ---------------------------------------------------------------
// Rank display helpers
// ---------------------------------------------------------------
export const RANK_COLORS: Record<Rank, string> = {
  E: '#9CA3AF', // gray
  D: '#6EE7B7', // green
  C: '#93C5FD', // light blue
  B: '#C084FC', // purple
  A: '#FCD34D', // gold-yellow
  S: '#F97316', // orange (legendary)
}

export const RANK_LABELS: Record<Rank, string> = {
  E: 'E-Rank Hunter',
  D: 'D-Rank Hunter',
  C: 'C-Rank Hunter',
  B: 'B-Rank Hunter',
  A: 'A-Rank Hunter',
  S: 'S-Rank Hunter',
}
