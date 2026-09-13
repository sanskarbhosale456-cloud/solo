import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDemoMode = request.cookies.get('life-rpg-demo')?.value === 'true'
  const pathname = request.nextUrl.pathname

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname === '/awakening'

  const isApiRoute = pathname.startsWith('/api')
  const isRoot = pathname === '/'

  // If Supabase is not configured, allow demo + auth pages + APIs through.
  // APIs return CONFIG_ERROR; demo mode works fully offline via localStorage.
  if (!supabaseUrl || !supabaseAnon) {
    if (!isDemoMode && !isAuthPage && !isApiRoute && !isRoot) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (isDemoMode && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — IMPORTANT: do not add logic between client creation and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all app routes (demo mode bypasses Supabase session)
  if (!user && !isAuthPage && !isApiRoute && !isRoot) {
    if (!isDemoMode) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated or demo users away from auth pages
  if ((user || isDemoMode) && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp3|wav|ico|glb)$).*)',
  ],
}
