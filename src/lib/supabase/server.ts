import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function requirePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error(
      'Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  return { url, anon }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function createSupabaseServerClient() {
  const { url, anon } = requirePublicEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — cookie writes ignored
        }
      },
    },
  })
}

/**
 * Service role client — bypasses RLS. Only use in trusted API routes,
 * and only AFTER verifying the session with the anon server client.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured, in which
 * case callers must fall back to the authenticated anon client for
 * SECURITY DEFINER RPCs (complete_quest / purchase_shop_item bypass RLS
 * by design, and ownership is enforced by the server-derived user id).
 */
export async function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  const cookieStore = await cookies()
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {},
    },
  })
}

/** Verify session server-side and return the authenticated user id. Never trust client-sent ids. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}
