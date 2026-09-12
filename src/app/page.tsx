import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Root page — check auth and redirect accordingly.
 * Authenticated users → /dashboard
 * Unauthenticated users → /login (Awakening sequence is handled client-side on /login)
 */
export default async function RootPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
