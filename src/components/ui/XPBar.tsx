'use client'

interface XPBarProps {
  xp: number
  xpToNext: number
  level: number
  className?: string
}

export function XPBar({ xp, xpToNext, level, className = '' }: XPBarProps) {
  const pct = Math.min(100, Math.round((xp / xpToNext) * 100))

  return (
    <div className={`w-full ${className}`} role="group" aria-label="Experience points">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-display text-xs text-glow-sky tracking-widest uppercase">
          LV.{level}
        </span>
        <span
          className="font-body text-xs text-white/50"
          aria-live="polite"
          aria-label={`${xp} of ${xpToNext} XP`}
        >
          {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </span>
      </div>
      <div
        className="xp-bar h-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="XP progress"
      >
        <div
          className="xp-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
