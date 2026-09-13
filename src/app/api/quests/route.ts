import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { computeQuestRewards } from '@/lib/progression/engine'
import { createQuestSchema } from '@/lib/validation'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const type = searchParams.get('type')

    const allowedStatus = ['active', 'completed', 'abandoned', 'all']
    if (!allowedStatus.includes(status)) {
      return apiError('VALIDATION_ERROR', 'Invalid status filter', 400)
    }

    let query = supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    if (type) {
      // UI sends type=daily for dailies; 'weekly' maps to quest_type=quest
      if (type === 'weekly') {
        query = query.eq('quest_type', 'quest')
      } else if (['quest', 'daily', 'gate'].includes(type)) {
        query = query.eq('quest_type', type)
      } else {
        return apiError('VALIDATION_ERROR', 'Invalid type filter', 400)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('GET /api/quests error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    return apiSuccess({ quests: data }, { compat: { quests: data } })
  } catch (err) {
    console.error('GET /api/quests unhandled:', err)
    if (err instanceof Error && err.message.includes('Missing Supabase env')) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400)
    }

    const parsed = createQuestSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten().fieldErrors)
    }

    const { title, description, discipline, difficulty, due_date } = parsed.data
    // Normalize quest_type: UI `type: weekly` => quest_type quest
    let questType = parsed.data.quest_type
    if (parsed.data.type === 'weekly') questType = 'quest'
    else if (parsed.data.type === 'daily') questType = 'daily'

    // Derive discipline from stat_tags if discipline missing and tags present
    let finalDiscipline = discipline
    const tags = parsed.data.stat_tags
    if (tags && tags.length > 0) {
      const first = tags[0].toLowerCase()
      if (['intellect', 'strength', 'agility', 'vitality', 'perception'].includes(first)) {
        finalDiscipline = first as typeof discipline
      }
    }

    // Server computes rewards — client cannot submit XP/gold values
    const { xpReward, goldReward } = computeQuestRewards(difficulty)

    // Get max sort_order for this user's active quests
    const { data: maxOrder } = await supabase
      .from('quests')
      .select('sort_order')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sortOrder = (maxOrder?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('quests')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        discipline: finalDiscipline,
        difficulty,
        quest_type: questType,
        xp_reward: xpReward,
        gold_reward: goldReward,
        due_date: due_date || null,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('POST /api/quests error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    return apiSuccess({ quest: data }, { status: 201, compat: { quest: data } })
  } catch (err) {
    console.error('POST /api/quests unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
