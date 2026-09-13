import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { SHADOW_SOLDIERS } from '@/lib/progression/engine'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'

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

    const { data: soldiers, error } = await supabase
      .from('shadow_soldiers')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at')

    if (error) {
      console.error('GET /api/army error:', error)
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    const unlockedKeys = new Set((soldiers ?? []).map((s) => s.soldier_key))
    const catalog = SHADOW_SOLDIERS.map((s) => ({
      ...s,
      unlocked: unlockedKeys.has(s.key),
      unlockedAt: soldiers?.find((row) => row.soldier_key === s.key)?.unlocked_at ?? null,
    }))

    const payload = {
      soldiers: soldiers ?? [],
      catalog,
      totalUnlocked: unlockedKeys.size,
      totalAvailable: SHADOW_SOLDIERS.length,
    }

    return apiSuccess(payload, {
      compat: { soldiers: soldiers ?? [], catalog, totalUnlocked: payload.totalUnlocked },
    })
  } catch (err) {
    console.error('GET /api/army unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
