'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { VolumeControl } from '@/components/audio/VolumeControl'
import { PageAmbientWatcher } from '@/hooks/usePageAmbient'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Status Window',
    shortLabel: 'STATUS',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/quests',
    label: 'Quest Log',
    shortLabel: 'QUESTS',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/stats',
    label: 'Player Stats',
    shortLabel: 'STATS',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
        <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="8.5" x2="22" y2="8.5"/>
      </svg>
    ),
  },
  {
    href: '/army',
    label: 'Collection',
    shortLabel: 'ARMY',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/shop',
    label: 'Shop',
    shortLabel: 'SHOP',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },

] as const

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      // Handle demo mode exit
      if (typeof window !== 'undefined' && localStorage.getItem('life-rpg:demo-mode') === 'true') {
        const { exitDemoMode } = await import('@/lib/demo/demoMode')
        exitDemoMode()
        await fetch('/api/demo', { method: 'DELETE' })
        window.location.href = '/login'
        return
      }

      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      // Also clear server cookies + demo cookie via API for reliability
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      window.location.href = '/login'
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-transparent relative">
      {/* Sidebar — desktop */}
      <nav
        aria-label="Main navigation"
        className="hidden md:flex flex-col w-64 border-r border-cyan-500/30 bg-[#070414] flex-shrink-0 relative shadow-[5px_0_30px_rgba(139,92,246,0.25)] z-20 overflow-hidden"
        style={{
          backgroundImage: 'url(/sidebar-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark transparent gradient overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060411]/50 via-[#060411]/35 to-[#060411]/70 pointer-events-none z-0" />
        {/* Subtle cosmic vignette */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />
        {/* Faint tech grid in sidebar */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none z-0" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(147,51,234,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Logo */}
        <div className="px-3.5 py-3 border-b border-cyan-500/25 relative z-10 bg-[#060411]/50 backdrop-blur-sm shadow-[0_5px_15px_rgba(0,240,255,0.08)]">
          <Link href="/dashboard" className="block relative w-full h-[76px] group" aria-label="Life RPG — System Interface">
            <Image
              src="/life-rpg-logo-cropped.png"
              alt="Life RPG — System Interface"
              fill
              unoptimized
              priority
              className="object-contain object-left transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>
        </div>

        {/* Nav links */}
        <ul className="flex-1 px-3 py-6 space-y-2 relative z-10" role="list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-display tracking-widest transition-all duration-150 group uppercase rounded-sm
                    ${active
                      ? 'bg-cyan-500/15 border-l-2 border-cyan-400 text-cyan-200 shadow-[inset_15px_0_20px_-15px_rgba(0,240,255,0.4)] backdrop-blur-sm'
                      : 'text-blue-100/60 hover:text-white hover:bg-purple-950/30 hover:border-l-2 hover:border-purple-400/50 border-l-2 border-transparent'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`flex-shrink-0 transition-colors ${active ? 'text-cyan-300 drop-shadow-[0_0_8px_#00f0ff]' : 'text-white/40 group-hover:text-white/80'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]" aria-hidden="true" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Sign out with Hunter Avatar */}
        <div className="px-4 py-4 border-t border-purple-500/20 relative z-10 bg-[#060411]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border border-cyan-400/60 bg-purple-950/80 flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.4)] flex-shrink-0">
              <span className="font-display font-bold text-cyan-300 text-xs">N</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-white/50 hover:text-cyan-300 transition-colors font-body tracking-wider"
              aria-label="Sign out"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header 
          className="md:hidden flex items-center justify-between px-4 py-3 border-b border-purple-500/30 bg-[#070414] relative shadow-[0_5px_20px_rgba(139,92,246,0.2)]"
          style={{
            backgroundImage: 'url(/sidebar-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        >
          <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />
          <div className="flex items-center relative z-10">
            <Link href="/dashboard" className="block relative w-36 h-9" aria-label="Life RPG — System Interface">
              <Image
                src="/life-rpg-logo-cropped.png"
                alt="Life RPG — System Interface"
                fill
                unoptimized
                priority
                className="object-contain object-left"
              />
            </Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            className="text-white/70 hover:text-white p-1.5 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow relative z-10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {mobileMenuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </header>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="md:hidden bg-[#070414]/95 backdrop-blur-xl border-b-2 border-cyan-500/40 px-3 py-2 shadow-[0_5px_20px_rgba(139,92,246,0.3)] relative z-30"
          >
            <ul className="space-y-1" role="list">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-display tracking-widest uppercase transition-all
                        ${active ? 'bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 shadow-[inset_10px_0_15px_-10px_rgba(0,240,255,0.4)]' : 'text-blue-100/60 hover:text-blue-100 border-l-2 border-transparent'}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto relative z-10 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#070414]/90 backdrop-blur-xl border-t border-cyan-500/30 z-40 shadow-[0_-5px_20px_rgba(139,92,246,0.3)]"
      >
        <ul className="flex items-center justify-around py-2" role="list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-colors
                    ${active ? 'text-cyan-300 drop-shadow-[0_0_8px_#00f0ff]' : 'text-blue-100/40 hover:text-blue-100/70'}`}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.icon}
                  <span className="text-[9px] font-display tracking-wider uppercase">{item.shortLabel}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <VolumeControl />
      <PageAmbientWatcher />
    </div>
  )
}
