import { NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { SHOP_ITEMS } from '@/lib/progression/engine'
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

    const [profileRes, purchasesRes] = await Promise.all([
      supabase
        .from('users_profile')
        .select('gold,mana_crystals')
        .eq('id', user.id)
        .single(),
      supabase.from('shop_purchases').select('*').eq('user_id', user.id).order('purchased_at', { ascending: false }),
    ])

    if (profileRes.error) {
      console.error('GET /api/shop profile error:', profileRes.error)
      const mapped = dbErrorMessage(profileRes.error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }
    if (purchasesRes.error) {
      console.error('GET /api/shop purchases error:', purchasesRes.error)
      const mapped = dbErrorMessage(purchasesRes.error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    const ownedKeys = new Set((purchasesRes.data ?? []).map((p) => p.item_key))
    const items = SHOP_ITEMS.map((item) => ({
      ...item,
      owned: ownedKeys.has(item.key),
      affordable:
        item.currencyType === 'gold'
          ? (profileRes.data?.gold ?? 0) >= item.cost
          : (profileRes.data?.mana_crystals ?? 0) >= item.cost,
    }))

    const payload = {
      items,
      balance: {
        gold: profileRes.data?.gold ?? 0,
        mana_crystals: profileRes.data?.mana_crystals ?? 0,
      },
      purchases: purchasesRes.data ?? [],
    }

    return apiSuccess(payload, {
      compat: { items, balance: payload.balance, purchases: payload.purchases },
    })
  } catch (err) {
    console.error('GET /api/shop unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
