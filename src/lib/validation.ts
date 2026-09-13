import { z } from 'zod'

const DISCIPLINES = ['intellect', 'strength', 'agility', 'vitality', 'perception'] as const
const DIFFICULTIES = ['E', 'D', 'C', 'B', 'A', 'S'] as const
const QUEST_TYPES = ['quest', 'daily', 'gate'] as const
const QUEST_STATUS = ['active', 'completed', 'abandoned'] as const

/**
 * Frontend sends: title, description?, discipline?, stat_tags?,
 * difficulty?, quest_type?, type? (daily|weekly UI label), due_date?
 * Backend normalizes with safe defaults and computes rewards server-side.
 */
export const createQuestSchema = z.object({
  title: z
    .string()
    .min(1, 'Quest title is required')
    .max(120, 'Quest title must be 120 characters or fewer')
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, 'Quest title is required'),
  description: z.string().max(500).optional().nullable(),
  discipline: z.enum(DISCIPLINES).optional().default('strength'),
  stat_tags: z.array(z.string().max(20)).max(5).optional(),
  difficulty: z.enum(DIFFICULTIES).optional().default('C'),
  quest_type: z.enum(QUEST_TYPES).optional().default('quest'),
  // UI-level alias sent by QuestLogClient: daily | weekly
  type: z.string().max(20).optional(),
  due_date: z
    .union([z.string().date(), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' ? undefined : v ?? undefined)),
})

export const updateQuestSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .max(120)
      .transform((s) => s.trim())
      .refine((s) => s.length > 0, 'Quest title cannot be empty')
      .optional(),
    description: z.string().max(500).nullable().optional(),
    discipline: z.enum(DISCIPLINES).optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    due_date: z.string().date().nullable().optional(),
    sort_order: z.number().int().min(0).max(100000).optional(),
    quest_type: z.enum(QUEST_TYPES).optional(),
  })
  .strict()

export const questQuerySchema = z.object({
  status: z.enum([...QUEST_STATUS, 'all'] as const).optional().default('active'),
  type: z.enum([...QUEST_TYPES, 'weekly'] as const).optional(),
})

export const purchaseSchema = z.object({
  item_key: z.string().min(1).max(64),
})

export const profileUpdateSchema = z
  .object({
    username: z.string().min(3).max(32).optional(),
    equipped_frame: z.string().max(64).nullable().optional(),
    equipped_theme: z.string().max(64).optional(),
    title: z.string().max(64).nullable().optional(),
  })
  .strict()

export const uuidSchema = z.string().uuid()

export type CreateQuestInput = z.infer<typeof createQuestSchema>
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
