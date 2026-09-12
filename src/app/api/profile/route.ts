import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('GET /api/profile error:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Also fetch shadow soldiers and purchases for the full profile view
    const [soldiersRes, purchasesRes] = await Promise.all([
      supabase.from('shadow_soldiers').select('*').eq('user_id', user.id).order('unlocked_at'),
      supabase.from('shop_purchases').select('item_key').eq('user_id', user.id),
    ])

    return NextResponse.json({
      profile,
      soldiers: soldiersRes.data ?? [],
      purchasedItems: purchasesRes.data?.map((p) => p.item_key) ?? [],
    })
  } catch (err) {
    console.error('GET /api/profile unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
