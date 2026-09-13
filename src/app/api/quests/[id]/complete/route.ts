import { NextRequest } from 'next/server'
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/validation'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'
import type { CompleteQuestResult } from '@/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const { id: questId } = await params
    if (!uuidSchema.safeParse(questId).success) {
      return apiError('VALIDATION_ERROR', 'Invalid quest id', 400)
    }

    // Verify session with anon client — user id comes ONLY from here
    const anonSupabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await anonSupabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    // Prefer service-role for the atomic RPC, fall back to the
    // authenticated anon client (complete_quest is SECURITY DEFINER,
    // so RLS is bypassed by design; ownership is enforced inside
    // the function via p_user_id which we derive from the session).
    const serviceSupabase = await createSupabaseServiceClient()
    const rpcClient = serviceSupabase ?? anonSupabase

    const { data, error } = await rpcClient.rpc('complete_quest', {
      p_quest_id: questId,
      p_user_id: user.id,
    })

    if (error) {
      console.error('complete_quest RPC error:', error)
      if (error.message?.includes('not found or already completed')) {
        return apiError('ALREADY_COMPLETED', 'Quest not found or already completed', 404)
      }
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    const result = data as CompleteQuestResult

    // Fetch fresh profile so client can sync XP/level/rank/streak/currency
    const { data: profile } = await anonSupabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    const payload = { result, profile }
    return apiSuccess(payload, { compat: { result, profile } })
  } catch (err) {
    console.error('POST /api/quests/[id]/complete unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
