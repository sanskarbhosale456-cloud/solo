import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateQuestSchema } from '@/lib/validation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const parsed = updateQuestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // RLS ensures user can only update own quests
    const { data, error } = await supabase
      .from('quests')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('PATCH /api/quests/[id] error:', error)
      return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    return NextResponse.json({ quest: data })
  } catch (err) {
    console.error('PATCH /api/quests/[id] unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('DELETE /api/quests/[id] error:', error)
      return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/quests/[id] unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
