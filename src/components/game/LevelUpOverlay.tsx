'use client'

import { useEffect, useRef } from 'react'
import type { CompleteQuestResult } from '@/types'

interface LevelUpOverlayProps {
  payload: CompleteQuestResult
  onDismiss: () => void
}

export function LevelUpOverlay({ payload, onDismiss }: LevelUpOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Trap focus
    closeRef.current?.focus()
    // Auto-dismiss after 5s
    const timer = setTimeout(onDismiss, 5000)
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
      aria-label="Level Up!"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Flash overlay */}
      <div
        className="absolute inset-0 bg-glow/5 animate-[flash_0.4s_ease-out_forwards]"
        aria-hidden="true"
        style={{
          animation: 'flash 0.4s ease-out forwards',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 text-center px-8 py-12 max-w-sm w-full mx-4"
        style={{ animation: 'levelUpScale 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {/* Particle ring (CSS) */}
        <div className="relative inline-block mb-6" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border-2 border-gold/40 animate-[ping_1s_ease-out_infinite]" />
          <div className="absolute inset-2 rounded-full border border-gold/20 animate-[ping_1s_ease-out_0.2s_infinite]" />
        </div>

        {/* XP gained */}
        <div className="font-display text-xs text-glow-sky tracking-[0.3em] uppercase mb-3">
          Quest Cleared
        </div>

        {/* LEVEL UP */}
        <h2
          className="font-display text-5xl font-black tracking-wider text-gold text-glow-gold leading-none mb-2"
          style={{ textShadow: '0 0 40px rgba(251,191,36,0.9), 0 0 80px rgba(251,191,36,0.4)' }}
        >
          LEVEL UP
        </h2>

        <p className="font-display text-2xl text-white tracking-widest mb-1">
          You are now Level {payload.level_after}.
        </p>
        <p className="font-body text-white/50 text-sm">
          +{payload.xp_gained} XP &nbsp;·&nbsp; +{payload.gold_gained} Gold
        </p>

        {/* Dismiss */}
        <button
          ref={closeRef}
          onClick={onDismiss}
          className="mt-8 btn btn-primary"
          aria-label="Dismiss level up notification"
        >
          ACKNOWLEDGED
        </button>
      </div>

      <style>{`
        @keyframes levelUpScale {
          0% { transform: scale(0.7); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flash {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
