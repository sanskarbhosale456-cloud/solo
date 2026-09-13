import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { updateQuestSchema, uuidSchema } from '@/lib/validation'
import { computeQuestRewards } from '@/lib/progression/engine'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return apiError('VALIDATION_ERROR', 'Invalid quest id', 400)
    }
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('GET /api/quests/[id] error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }
    if (!data) {
      return apiError('NOT_FOUND', 'Quest not found', 404)
    }

    return apiSuccess({ quest: data }, { compat: { quest: data } })
  } catch (err) {
    console.error('GET /api/quests/[id] unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return apiError('VALIDATION_ERROR', 'Invalid quest id', 400)
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

    const parsed = updateQuestSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten().fieldErrors)
    }

    // Verify ownership first (distinguish 404 from 403/unauthorized)
    const { data: existing, error: fetchError } = await supabase
      .from('quests')
      .select('id,user_id,status')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error('PATCH /api/quests/[id] fetch error:', fetchError)
      const mapped = dbErrorMessage(fetchError)
      return apiError(mapped.code, mapped.message, mapped.status)
    }
    if (!existing) {
      return apiError('NOT_FOUND', 'Quest not found', 404)
    }
    if (existing.user_id !== user.id) {
      return apiError('UNAUTHORIZED', 'You do not own this quest', 403)
    }
    if (existing.status !== 'active') {
      return apiError('ALREADY_COMPLETED', 'Only active quests can be updated', 409)
    }

    // If difficulty changes, recompute rewards server-side
    const updatePayload: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.difficulty) {
      const { xpReward, goldReward } = computeQuestRewards(parsed.data.difficulty)
      updatePayload.xp_reward = xpReward
      updatePayload.gold_reward = goldReward
    }
    // Never allow status / rewards to be set directly
    delete (updatePayload as Record<string, unknown>).status
    delete (updatePayload as Record<string, unknown>).xp_reward_from_client

    const { data, error } = await supabase
      .from('quests')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('PATCH /api/quests/[id] error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    return apiSuccess({ quest: data }, { compat: { quest: data } })
  } catch (err) {
    console.error('PATCH /api/quests/[id] unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return apiError('VALIDATION_ERROR', 'Invalid quest id', 400)
    }
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    // Verify ownership first for correct 404 vs 403
    const { data: existing, error: fetchError } = await supabase
      .from('quests')
      .select('id,user_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error('DELETE /api/quests/[id] fetch error:', fetchError)
      const mapped = dbErrorMessage(fetchError)
      return apiError(mapped.code, mapped.message, mapped.status)
    }
    if (!existing) {
      return apiError('NOT_FOUND', 'Quest not found', 404)
    }
    if (existing.user_id !== user.id) {
      return apiError('UNAUTHORIZED', 'You do not own this quest', 403)
    }

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('DELETE /api/quests/[id] error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    return apiSuccess({ deleted: true, id }, { compat: { success: true } })
  } catch (err) {
    console.error('DELETE /api/quests/[id] unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
