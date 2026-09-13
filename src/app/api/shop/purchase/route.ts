import { NextRequest } from 'next/server'
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from '@/lib/supabase/server'
import { SHOP_ITEMS } from '@/lib/progression/engine'
import { purchaseSchema } from '@/lib/validation'
import { apiSuccess, apiError, dbErrorMessage } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError('CONFIG_ERROR', 'Supabase is not configured', 500)
    }
    const anonSupabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await anonSupabase.auth.getUser()

    if (authError || !user) {
      return apiError('UNAUTHENTICATED', 'Authentication required', 401)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400)
    }

    const parsed = purchaseSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid item key', 400)
    }

    const { item_key } = parsed.data

    // Look up item in server-side catalog — client cannot set price/currency
    const item = SHOP_ITEMS.find((i) => i.key === item_key)
    if (!item) {
      return apiError('INVALID_ITEM', 'Item not found', 404)
    }

    // Atomic purchase via DB function (validates balance, deducts, records).
    // Prefer service role; fall back to authenticated anon client since
    // purchase_shop_item is SECURITY DEFINER and ownership comes from session.
    const serviceSupabase = await createSupabaseServiceClient()
    const rpcClient = serviceSupabase ?? anonSupabase

    const { error } = await rpcClient.rpc('purchase_shop_item', {
      p_user_id: user.id,
      p_item_key: item.key,
      p_currency_type: item.currencyType,
      p_cost: item.cost,
    })

    if (error) {
      console.error('purchase_shop_item RPC error:', error)
      if (error.message?.includes('Insufficient')) {
        return apiError('INSUFFICIENT_BALANCE', error.message, 402)
      }
      if (error.message?.includes('already purchased')) {
        return apiError('ALREADY_OWNED', 'Item already owned', 409)
      }
      const mapped = dbErrorMessage(error)
      return apiError(mapped.code, mapped.message, mapped.status)
    }

    // Return fresh balance
    const { data: profile } = await anonSupabase
      .from('users_profile')
      .select('gold,mana_crystals')
      .eq('id', user.id)
      .single()

    const payload = {
      item_key: item.key,
      balance: {
        gold: profile?.gold ?? 0,
        mana_crystals: profile?.mana_crystals ?? 0,
      },
    }
    return apiSuccess(payload, { compat: { success: true, item_key: item.key } })
  } catch (err) {
    console.error('POST /api/shop/purchase unhandled:', err)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
