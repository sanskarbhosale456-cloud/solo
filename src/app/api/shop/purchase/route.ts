import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { SHOP_ITEMS } from '@/lib/progression/engine'
import { z } from 'zod'

const purchaseSchema = z.object({
  item_key: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const anonSupabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = purchaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid item key' }, { status: 400 })
    }

    const { item_key } = parsed.data

    // Look up item in server-side catalog — client cannot set price
    const item = SHOP_ITEMS.find((i) => i.key === item_key)
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Atomic purchase via DB function (validates balance, deducts, records)
    const serviceSupabase = await createSupabaseServiceClient()
    const { data, error } = await serviceSupabase.rpc('purchase_shop_item', {
      p_user_id: user.id,
      p_item_key: item.key,
      p_currency_type: item.currencyType,
      p_cost: item.cost,
    })

    if (error) {
      console.error('purchase_shop_item RPC error:', error)
      if (error.message?.includes('Insufficient')) {
        return NextResponse.json({ error: error.message }, { status: 402 })
      }
      if (error.message?.includes('already purchased')) {
        return NextResponse.json({ error: 'Item already owned' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, item_key: item.key })
  } catch (err) {
    console.error('POST /api/shop/purchase unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
