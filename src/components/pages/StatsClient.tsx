'use client'

import { useProfile } from '@/hooks/useProfile'
import { DisciplineIcon, DISCIPLINE_COLORS, DISCIPLINE_LABELS } from '@/components/ui/DisciplineIcon'
import type { Discipline, UserProfile } from '@/types'

type StatKey = keyof UserProfile

const STAT_KEYS: Array<{ key: StatKey; label: string; discipline: Discipline; full: string }> = [
  { key: 'stat_int', label: 'INT', discipline: 'intellect',  full: 'Intellect' },
  { key: 'stat_str', label: 'STR', discipline: 'strength',   full: 'Strength' },
  { key: 'stat_agi', label: 'AGI', discipline: 'agility',    full: 'Agility' },
  { key: 'stat_vit', label: 'VIT', discipline: 'vitality',   full: 'Vitality' },
]

export function StatsClient() {
  const { data, isLoading, error, refetch } = useProfile()

  if (error) {
    return (
      <div className="panel p-8 text-center" role="alert">
        <p className="text-danger font-display text-sm tracking-wider">SYSTEM ANOMALY</p>
        <button onClick={() => refetch()} className="btn btn-ghost mt-4 text-xs">RETRY</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl text-white tracking-wider">PLAYER STATS</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {[...Array(4)].map((_, i) => <div key={i} className="panel h-28 skeleton" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {STAT_KEYS.map(({ key, label, discipline, full }) => {
            const value = (data!.profile[key] as number) ?? 0
            const maxVal = Math.max(...STAT_KEYS.map(s => (data!.profile[s.key] as number) ?? 0), 1)
            const pct = Math.min(100, (value / maxVal) * 100)
            const color = DISCIPLINE_COLORS[discipline]

            return (
              <div key={key} className="panel p-5" aria-label={`${full}: ${value} points`}>
                <div className="flex items-center gap-4">
                  {/* Icon + label */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 w-16">
                    <DisciplineIcon discipline={discipline} size={28} />
                    <span className="font-display text-xs font-bold tracking-wider" style={{ color }}>
                      {label}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-sm text-white/80">{full}</span>
                      <span
                        className="font-display text-2xl font-bold"
                        style={{ color, textShadow: `0 0 12px ${color}60` }}
                      >
                        {value}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="h-2 bg-void-surface rounded-full overflow-hidden"
                      role="meter"
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={maxVal}
                      aria-label={`${full} at ${Math.round(pct)}% of your highest stat`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}80, ${color})`,
                          boxShadow: `0 0 10px ${color}60`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
