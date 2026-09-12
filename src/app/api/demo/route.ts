import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()

  // Set demo session cookie (httpOnly=false so client JS can also read)
  cookieStore.set('life-rpg-demo', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('life-rpg-demo')
  return NextResponse.json({ ok: true })
}
