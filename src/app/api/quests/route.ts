import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeQuestRewards } from '@/lib/progression/engine'
import { createQuestSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const type = searchParams.get('type')

    let query = supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('quest_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('GET /api/quests error:', error)
      return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 })
    }

    return NextResponse.json({ quests: data })
  } catch (err) {
    console.error('GET /api/quests unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = createQuestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, discipline, difficulty, quest_type, due_date } = parsed.data

    // Server computes rewards — client cannot submit XP/gold values
    const { xpReward, goldReward } = computeQuestRewards(difficulty)

    // Get max sort_order for this user
    const { data: maxOrder } = await supabase
      .from('quests')
      .select('sort_order')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (maxOrder?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('quests')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        discipline,
        difficulty,
        quest_type,
        xp_reward: xpReward,
        gold_reward: goldReward,
        due_date: due_date || null,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('POST /api/quests error:', error)
      return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 })
    }

    return NextResponse.json({ quest: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/quests unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
