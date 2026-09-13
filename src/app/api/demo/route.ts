import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('life-rpg-demo')?.value === 'true'
  return NextResponse.json({ success: true, data: { demo: isDemo } })
}

export async function POST() {
  const cookieStore = await cookies()

  // Demo session cookie (readable by client JS + proxy + app layout).
  // Demo data lives in localStorage only — it NEVER touches Supabase,
  // so it cannot read or modify any real user's data.
  cookieStore.set('life-rpg-demo', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return NextResponse.json({ success: true, data: { demo: true } })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('life-rpg-demo')
  return NextResponse.json({ success: true, data: { demo: false } })
}
