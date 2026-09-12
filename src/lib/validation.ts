import { z } from 'zod'

const DISCIPLINES = ['intellect', 'strength', 'agility', 'vitality', 'perception'] as const
const DIFFICULTIES = ['E', 'D', 'C', 'B', 'A', 'S'] as const
const QUEST_TYPES = ['quest', 'daily', 'gate'] as const

export const createQuestSchema = z.object({
  title: z
    .string()
    .min(1, 'Quest title is required')
    .max(120, 'Quest title must be 120 characters or fewer')
    .transform((s) => s.trim()),
  description: z.string().max(500).optional(),
  discipline: z.enum(DISCIPLINES),
  difficulty: z.enum(DIFFICULTIES),
  quest_type: z.enum(QUEST_TYPES),
  due_date: z.string().date().optional().or(z.literal('')),
})

export const updateQuestSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .max(120)
      .transform((s) => s.trim())
      .optional(),
    description: z.string().max(500).nullable().optional(),
    discipline: z.enum(DISCIPLINES).optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    due_date: z.string().date().nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict()

export type CreateQuestInput = z.infer<typeof createQuestSchema>
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>
