'use client'

import Link from 'next/link'
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
    label: 'Stat Allocation',
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
    label: 'Shadow Army',
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
  {
    href: '/settings',
    label: 'Settings',
    shortLabel: 'SET',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
        router.push('/login')
        router.refresh()
        return
      }

      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-transparent relative">
      {/* Sidebar — desktop */}
      <nav
        aria-label="Main navigation"
        className="hidden md:flex flex-col w-64 border-r-2 border-blue-500/50 bg-[#030914]/80 backdrop-blur-xl flex-shrink-0 relative shadow-[5px_0_30px_rgba(37,99,235,0.15)] z-20"
      >
        {/* Faint tech grid in sidebar */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Logo */}
        <div className="px-6 py-6 border-b border-blue-500/30 relative shadow-[0_5px_15px_rgba(59,130,246,0.1)]">
          <div className="font-display text-base text-glow-sky tracking-[0.3em] uppercase drop-shadow-[0_0_8px_#38bdf8]">
            THE SYSTEM
          </div>
          <div className="font-body text-xs text-blue-200/40 mt-1 uppercase tracking-widest">Hunter Interface v2.0</div>
        </div>

        {/* Nav links */}
        <ul className="flex-1 px-4 py-6 space-y-2 relative" role="list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-display tracking-widest transition-all duration-150 group uppercase
                    ${active
                      ? 'bg-blue-500/10 border-l-2 border-blue-400 text-blue-200 shadow-[inset_15px_0_20px_-15px_rgba(59,130,246,0.3)]'
                      : 'text-blue-100/40 hover:text-blue-200 hover:bg-blue-500/5 border-l-2 border-transparent'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`flex-shrink-0 transition-colors ${active ? 'text-glow-sky' : 'text-white/30 group-hover:text-white/60'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1 h-4 bg-glow rounded-full" aria-hidden="true" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-glow/10">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded text-sm text-white/40 hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all duration-150 font-body"
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-glow/10 bg-void-surface">
          <span className="font-display text-sm text-glow-sky tracking-widest">THE SYSTEM</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            className="text-white/50 hover:text-white p-1.5 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow"
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
            className="md:hidden bg-[#030914]/90 backdrop-blur-xl border-b-2 border-blue-500/50 px-3 py-2 shadow-[0_5px_20px_rgba(37,99,235,0.2)]"
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
                        ${active ? 'bg-blue-500/10 text-glow-sky border-l-2 border-blue-400' : 'text-blue-100/60 hover:text-blue-100 border-l-2 border-transparent'}`}
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
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#030914]/90 backdrop-blur-xl border-t-2 border-blue-500/50 z-40 shadow-[0_-5px_20px_rgba(37,99,235,0.2)]"
      >
        <ul className="flex items-center justify-around py-2" role="list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-colors
                    ${active ? 'text-glow-sky drop-shadow-[0_0_8px_#38bdf8]' : 'text-blue-100/40 hover:text-blue-100/70'}`}
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
