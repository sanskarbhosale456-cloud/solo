import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
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
    const limitRaw = searchParams.get('limit') ?? '50'
    const limit = Math.min(200, Math.max(1, Number.parseInt(limitRaw, 10) || 50))

    const { data, error } = await supabase
      .from('quest_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('GET /api/completions error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    return apiSuccess({ completions: data ?? [] }, { compat: { completions: data ?? [] } })
  } catch (err) {
    console.error('GET /api/completions unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
