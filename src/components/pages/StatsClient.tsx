'use client'

import { useProfile } from '@/hooks/useProfile'
import { DisciplineIcon, DISCIPLINE_COLORS } from '@/components/ui/DisciplineIcon'
import { motion } from 'framer-motion'
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
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-2xl text-white tracking-wider">PLAYER STATS</h1>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {[...Array(4)].map((_, i) => <div key={i} className="panel h-28 skeleton" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {STAT_KEYS.map(({ key, label, discipline, full }, idx) => {
            const value = (data!.profile[key] as number) ?? 0
            const maxVal = Math.max(...STAT_KEYS.map(s => (data!.profile[s.key] as number) ?? 0), 1)
            const pct = Math.min(100, (value / maxVal) * 100)
            const color = DISCIPLINE_COLORS[discipline]

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
                whileHover={{ scale: 1.015, x: 4, transition: { duration: 0.2 } }}
                className="panel p-5 border border-glow/10 hover:border-glow/40 transition-colors shadow-lg"
                aria-label={`${full}: ${value} points`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon + label */}
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.3 } }}
                    className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
                  >
                    <DisciplineIcon discipline={discipline} size={32} />
                    <span className="font-display text-xs font-bold tracking-wider mt-1" style={{ color }}>
                      {label}
                    </span>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-sm text-white/80">{full}</span>
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.1, type: 'spring' }}
                        className="font-display text-2xl font-bold"
                        style={{ color, textShadow: `0 0 12px ${color}60` }}
                      >
                        {value}
                      </motion.span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="h-2.5 bg-void-surface rounded-full overflow-hidden"
                      role="meter"
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={maxVal}
                      aria-label={`${full} at ${Math.round(pct)}% of your highest stat`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, delay: 0.2 + idx * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${color}80, ${color})`,
                          boxShadow: `0 0 12px ${color}80`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
