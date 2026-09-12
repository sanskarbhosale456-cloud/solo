'use client'

import { useProfile } from '@/hooks/useProfile'
import { SHADOW_SOLDIERS } from '@/lib/progression/engine'
import { motion } from 'framer-motion'

const SOLDIER_COLORS = [
  '#9CA3AF','#6EE7B7','#93C5FD','#C084FC','#FCD34D',
  '#F97316','#F472B6','#34D399','#60A5FA','#A78BFA',
  '#FB923C','#4ADE80','#38BDF8','#E879F9','#FACC15',
  '#F87171','#2DD4BF','#818CF8','#FB7185','#E4E4E7',
]

export function ArmyClient() {
  const { data, isLoading, error, refetch } = useProfile()

  if (error) {
    return (
      <div className="panel p-8 text-center" role="alert">
        <p className="text-danger font-display text-sm tracking-wider">SYSTEM ANOMALY</p>
        <button onClick={() => refetch()} className="btn btn-ghost mt-4 text-xs">RETRY</button>
      </div>
    )
  }

  const unlockedKeys = new Set(data?.soldiers.map((s) => s.soldier_key) ?? [])
  const totalUnlocked = unlockedKeys.size

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display text-2xl text-white tracking-wider uppercase mb-1">PLAYER COLLECTION</h1>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-busy="true">
          {[...Array(8)].map((_, i) => <div key={i} className="panel h-44 skeleton" />)}
        </div>
      ) : (
        <>
          {totalUnlocked === 0 && (
            <div className="panel p-6 text-center">
              <p className="text-white/40 font-body text-sm italic">
                Your collection is empty. Complete your first quest to begin collecting.
              </p>
            </div>
          )}
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            role="list"
            aria-label="Player collection items"
          >
              {SHADOW_SOLDIERS.map((soldier, idx) => {
                const unlocked = unlockedKeys.has(soldier.key)
                const color = SOLDIER_COLORS[idx % SOLDIER_COLORS.length]

                return (
                  <motion.li
                    key={soldier.key}
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2 } }}
                    className={`panel p-4 flex flex-col items-center text-center transition-colors ${
                      unlocked ? 'border-glow/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'opacity-40'
                    }`}
                    aria-label={unlocked ? `${soldier.name} — Collected` : `Locked item — unlock at ${soldier.unlockAt} quests`}
                  >
                    {/* Silhouette */}
                    <div className="mb-3 relative" aria-hidden="true">
                      <svg
                        width="56"
                        height="72"
                        viewBox="0 0 56 72"
                        fill="none"
                        style={{
                          filter: unlocked ? `drop-shadow(0 0 8px ${color}60)` : 'none',
                        }}
                      >
                        <polygon
                          points="28,4 44,14 44,36 36,44 28,48 20,44 12,36 12,14"
                          fill={unlocked ? `${color}20` : 'rgba(60,60,80,0.3)'}
                          stroke={unlocked ? color : 'rgba(100,100,130,0.4)'}
                          strokeWidth="1.5"
                        />
                        {unlocked && (
                          <>
                            <circle cx="22" cy="22" r="2.5" fill={color} opacity="0.9">
                              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="34" cy="22" r="2.5" fill={color} opacity="0.9">
                              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" begin="0.1s" repeatCount="indefinite" />
                            </circle>
                          </>
                        )}
                        <polygon
                          points="12,36 4,52 20,52 28,48 36,52 52,52 44,36"
                          fill={unlocked ? `${color}15` : 'rgba(40,40,60,0.3)'}
                          stroke={unlocked ? color : 'rgba(80,80,110,0.3)'}
                          strokeWidth="1"
                        />
                      </svg>
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" aria-hidden="true">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    <div
                      className="font-display text-xs font-bold tracking-wider mb-1"
                      style={{ color: unlocked ? color : 'rgba(255,255,255,0.2)' }}
                    >
                      {unlocked ? soldier.name : '???'}
                    </div>

                    {unlocked ? (
                      <p className="font-body text-xs text-white/30 leading-snug">{soldier.description}</p>
                    ) : (
                      <p className="font-body text-xs text-white/20">
                        Complete {soldier.unlockAt} quest{soldier.unlockAt !== 1 ? 's' : ''}
                      </p>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          </>
        )}
    </div>
  )
}
