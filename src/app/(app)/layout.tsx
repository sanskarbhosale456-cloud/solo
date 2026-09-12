import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { GameOverlays } from '@/components/game/GameOverlays'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Allow demo mode through without a real Supabase session
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get('life-rpg-demo')?.value === 'true'

  if (!isDemoMode) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/login')
      }
    } catch {
      // Supabase not configured — redirect to login
      redirect('/login')
    }
  }

  return (
    <AppShell>
      {children}
      <GameOverlays />
    </AppShell>
  )
}
