import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'
import { profileUpdateSchema } from '@/lib/validation'

export async function GET(_request: NextRequest) {
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

    const { data: profile, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('GET /api/profile error:', error)
      // PGRST116 = no rows: profile trigger may have lagged; return clear error
      if (error.code === 'PGRST116') {
        return apiError('NOT_FOUND', 'Profile not found', 404)
      }
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    // Soldiers + purchases for full profile view (RLS-scoped to own rows)
    const [soldiersRes, purchasesRes, questsRes, completionsRes] = await Promise.all([
      supabase
        .from('shadow_soldiers')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at'),
      supabase.from('shop_purchases').select('item_key').eq('user_id', user.id),
      supabase.from('quests').select('id,status,xp_reward').eq('user_id', user.id),
      supabase
        .from('quest_completions')
        .select('xp_gained,completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(100),
    ])

    const soldiers = soldiersRes.data ?? []
    const purchasedItems = purchasesRes.data?.map((p) => p.item_key) ?? []
    const quests = questsRes.data ?? []
    const completions = completionsRes.data ?? []

    const totalQuests = quests.length
    const completedQuests = quests.filter((q) => q.status === 'completed').length
    const pendingQuests = quests.filter((q) => q.status === 'active').length
    const totalXpEarned = completions.reduce((sum, c) => sum + (c.xp_gained ?? 0), 0)

    const payload = {
      profile,
      soldiers,
      purchasedItems,
      stats: {
        totalQuests,
        completedQuests,
        pendingQuests,
        totalXpEarned,
        level: profile.level,
        rank: profile.rank,
        streak: profile.streak,
      },
    }

    // Envelope + legacy compat fields
    return NextResponse.json(
      {
        success: true,
        data: payload,
        profile,
        soldiers,
        purchasedItems,
        stats: payload.stats,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('GET /api/profile unhandled:', err)
    if (err instanceof Error && err.message.includes('Missing Supabase env')) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

/** Update cosmetic profile fields only. XP/level/rank/currency are server-controlled. */
export async function PATCH(request: NextRequest) {
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

    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten().fieldErrors)
    }

    // If equipping a frame, verify ownership (frames come from shop purchases)
    if (parsed.data.equipped_frame) {
      const { data: owned } = await supabase
        .from('shop_purchases')
        .select('item_key')
        .eq('user_id', user.id)
        .eq('item_key', parsed.data.equipped_frame)
        .maybeSingle()
      if (!owned) {
        return apiError('UNAUTHORIZED', 'Frame not owned', 403)
      }
    }

    const { data, error } = await supabase
      .from('users_profile')
      .update(parsed.data)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('PATCH /api/profile error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    return apiSuccess({ profile: data }, { compat: { profile: data } })
  } catch (err) {
    console.error('PATCH /api/profile unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
