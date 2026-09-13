import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Root page — check auth and redirect accordingly.
 * Authenticated users → /dashboard
 * Demo users (life-rpg-demo cookie) → /dashboard  ← FIX: previously ignored demo mode
 * Unauthenticated users → /login
 */
export default async function RootPage() {
  // Demo mode short-circuit (no Supabase session required)
  try {
    const cookieStore = await cookies()
    if (cookieStore.get('life-rpg-demo')?.value === 'true') {
      redirect('/dashboard')
    }
  } catch {
    // ignore cookie errors
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    } else {
      redirect('/login')
    }
  } catch {
    // Supabase not configured — still allow demo, else login
    redirect('/login')
  }
}
