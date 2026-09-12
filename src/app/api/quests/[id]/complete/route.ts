import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { CompleteQuestResult } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params

    // Verify session with anon client
    const anonSupabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role for the atomic complete_quest function
    // (the function itself is SECURITY DEFINER and validates ownership internally)
    const serviceSupabase = await createSupabaseServiceClient()

    const { data, error } = await serviceSupabase.rpc('complete_quest', {
      p_quest_id: questId,
      p_user_id: user.id,
    })

    if (error) {
      console.error('complete_quest RPC error:', error)
      if (error.message?.includes('not found or already completed')) {
        return NextResponse.json(
          { error: 'Quest not found or already completed' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: 'Failed to complete quest' }, { status: 500 })
    }

    const result = data as CompleteQuestResult
    return NextResponse.json({ result })
  } catch (err) {
    console.error('POST /api/quests/[id]/complete unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
