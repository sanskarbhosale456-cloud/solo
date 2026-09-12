'use client'

import { useEffect, useRef } from 'react'
import { RankBadge } from '@/components/ui/RankBadge'
import type { CompleteQuestResult } from '@/types'
import type { Rank } from '@/types'

const RANK_LABELS: Record<Rank, string> = {
  E: 'E-Rank Hunter',
  D: 'D-Rank Hunter',
  C: 'C-Rank Hunter',
  B: 'B-Rank Hunter',
  A: 'A-Rank Hunter',
  S: 'S-Rank Hunter',
}

const RANK_MESSAGES: Record<Rank, string> = {
  E: 'Your journey has begun.',
  D: 'The weak have been left behind.',
  C: 'The gates fear your name.',
  B: 'You walk among the elite.',
  A: 'Few hunters reach this height.',
  S: 'You stand above all others.',
}

interface RankUpOverlayProps {
  payload: CompleteQuestResult
  onDismiss: () => void
}

export function RankUpOverlay({ payload, onDismiss }: RankUpOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const rank = payload.rank_after as Rank

  useEffect(() => {
    closeRef.current?.focus()
    const timer = setTimeout(onDismiss, 7000)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onDismiss])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Rank Up — ${RANK_LABELS[rank]}`}
      aria-live="assertive"
      className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-auto"
    >
      {/* Full-screen takeover — darker than level-up */}
      <div className="absolute inset-0 bg-void/95 backdrop-blur-md" onClick={onDismiss} aria-hidden="true" />

      {/* Horizontal scan lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-glow/10"
            style={{ top: `${(i + 1) * 16}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      <div
        className="relative z-10 text-center px-8 py-12 max-w-md w-full mx-4"
        style={{ animation: 'rankUpReveal 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {/* System announcement header */}
        <div className="font-display text-xs text-danger tracking-[0.4em] uppercase mb-8 animate-flicker">
          ⚠ SYSTEM ANNOUNCEMENT ⚠
        </div>

        {/* Rank badge — large */}
        <div className="flex justify-center mb-6" aria-hidden="true">
          <div style={{ animation: 'badgePulse 1.5s ease-in-out infinite' }}>
            <RankBadge rank={rank} size="lg" />
          </div>
        </div>

        {/* RANK UP headline */}
        <h2
          className="font-display text-4xl font-black tracking-wider text-gold leading-tight mb-2"
          style={{ textShadow: '0 0 60px rgba(251,191,36,1), 0 0 120px rgba(251,191,36,0.5)' }}
        >
          RANK UP
        </h2>

        <p className="font-display text-xl text-white tracking-widest mb-1">
          {RANK_LABELS[rank]}
        </p>
        <p className="font-body text-white/60 text-sm mb-2 italic">
          {RANK_MESSAGES[rank]}
        </p>
        <p className="font-body text-white/40 text-xs">
          From {payload.rank_before}-Rank · Level {payload.level_after}
        </p>

        <button
          ref={closeRef}
          onClick={onDismiss}
          className="mt-10 btn btn-primary text-base px-8 py-3"
          aria-label="Acknowledge rank up"
        >
          ACCEPT RANK
        </button>
      </div>

      <style>{`
        @keyframes rankUpReveal {
          0% { transform: scale(0.5) translateY(40px); opacity: 0; }
          70% { transform: scale(1.03) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes badgePulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.4) drop-shadow(0 0 20px currentColor); }
        }
      `}</style>
    </div>
  )
}
