import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(_request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return apiError('UNAUTHENTICATED', 'No active session', 401)
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    return apiSuccess(
      { user: { id: user.id, email: user.email }, profile },
      { compat: { user, profile } }
    )
  } catch (err) {
    console.error('GET /api/auth/me unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
