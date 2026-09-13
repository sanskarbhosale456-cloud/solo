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
    <div className="w-full max-w-2xl md:max-w-3xl mx-auto">
      {/* HEADER SECTION: PLAYER STATS & GLOWING DIAMOND */}
      <div className="relative mb-5 flex items-center justify-between px-1">
        <div>
          <h1 
            className="font-display text-2xl md:text-3xl text-blue-100 tracking-[0.25em] font-bold uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
            style={{ fontFamily: '"Cinzel", serif' }}
          >
            PLAYER STATS
          </h1>
          {/* Glowing diamond accent directly aligned below title */}
          <div className="flex items-center gap-1.5 mt-1 text-blue-300">
            <span className="text-sm drop-shadow-[0_0_8px_#60a5fa]">✦</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton bg-blue-950/20 border border-blue-500/20" />)}
        </div>
      ) : (
        /* 4 SEPARATE INDIVIDUAL STAT CARDS (WITH CLEAR GAPS AND BACKGROUND VISIBLE AROUND THEM) */
        <div className="space-y-4 md:space-y-5">
          {STAT_KEYS.map(({ key, label, discipline, full }, idx) => {
            const value = (data!.profile[key] as number) ?? 0
            const maxVal = Math.max(...STAT_KEYS.map(s => (data!.profile[s.key] as number) ?? 0), 1)
            const pct = Math.min(100, (value / maxVal) * 100)
            const color = DISCIPLINE_COLORS[discipline]

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
                className="relative bg-[#040814]/75 backdrop-blur-sm border border-blue-400/40 hover:border-blue-400/70 transition-all px-5 py-4 md:px-7 md:py-5 shadow-[0_0_20px_rgba(37,99,235,0.25),inset_0_0_25px_rgba(37,99,235,0.08)] rounded-none group overflow-hidden"
                aria-label={`${full}: ${value} points`}
              >
                {/* Ornate corner bracket lights on each card */}
                <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-blue-300 shadow-[0_0_6px_#60a5fa] z-10" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-blue-300 shadow-[0_0_6px_#60a5fa] z-10" />
                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-blue-300 shadow-[0_0_6px_#60a5fa] z-10" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-blue-300 shadow-[0_0_6px_#60a5fa] z-10" />

                <div className="flex items-center gap-5 md:gap-6 relative z-10">
                  {/* Icon & Label */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 w-12 md:w-14">
                    <DisciplineIcon discipline={discipline} size={28} />
                    <span 
                      className="font-display text-[11px] md:text-xs font-bold tracking-widest mt-1 drop-shadow-[0_0_6px_currentColor]" 
                      style={{ color }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Name & Animated Sliding Bar */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-sm md:text-base text-white/95 font-medium tracking-wide">
                        {full}
                      </span>
                    </div>

                    {/* Sliding Progress Bar Track */}
                    <div
                      className="h-2 md:h-2.5 bg-black/60 rounded-full overflow-hidden border border-blue-900/40 relative"
                      role="meter"
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={maxVal}
                      aria-label={`${full} at ${Math.round(pct)}% of your highest stat`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ 
                          duration: 1.4, 
                          delay: 0.15 + idx * 0.12, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                          background: `linear-gradient(90deg, ${color}95, ${color})`,
                          boxShadow: `0 0 12px ${color}`,
                        }}
                      >
                        {/* Shimmer light slide effect across the bar */}
                        <div 
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" 
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Large Stat Number */}
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.12, type: 'spring' }}
                    className="flex-shrink-0 text-right w-12 md:w-16"
                  >
                    <span
                      className="font-display text-2xl md:text-3xl font-bold"
                      style={{ 
                        color, 
                        textShadow: `0 0 15px ${color}90` 
                      }}
                    >
                      {value}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
