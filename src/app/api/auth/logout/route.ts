import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  } catch {
    // ignore — still clear demo cookie
  }
  const res = NextResponse.json({ success: true, data: { loggedOut: true } })
  res.cookies.delete('life-rpg-demo')
  return res
}
