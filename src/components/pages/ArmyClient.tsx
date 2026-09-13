'use client'

import { useProfile } from '@/hooks/useProfile'
import { SHADOW_SOLDIERS } from '@/lib/progression/engine'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Map each soldier key to its artwork path in /public/collection/
const SOLDIER_IMAGES: Record<string, string> = {
  initiate:        '/collection/initiate.jpg',
  shadow_rogue:    '/collection/shadow_rogue.jpg',
  iron_sentinel:   '/collection/iron_sentinel.jpg',
  voidwalker:      '/collection/voidwalker.jpg',
  ember_knight:    '/collection/ember_knight.jpg',
  storm_caller:    '/collection/storm_caller.jpg',
  silent_blade:    '/collection/silent_blade.jpg',
  bone_warden:     '/collection/bone_warden.jpg',
  ash_revenant:    '/collection/ash_revenant.jpg',
  plague_herald:   '/collection/plague_herald.jpg',
  obsidian_giant:  '/collection/obsidian_giant.jpg',
  frost_specter:   '/collection/frost_specter.jpg',
  crimson_warden:  '/collection/crimson_warden.jpg',
  eclipse_hunter:  '/collection/eclipse_hunter.jpg',
  void_sovereign:  '/collection/void_sovereign.jpg',
  nether_wraith:   '/collection/nether_wraith.jpg',
  chaos_herald:    '/collection/chaos_herald.jpg',
  time_weaver:     '/collection/time_weaver.jpg',
  death_sovereign: '/collection/death_sovereign.jpg',
  abyss_titan:     '/collection/abyss_titan.jpg',
  shadow_monarch:  '/collection/shadow_monarch.jpg',
}

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
              const imageSrc = SOLDIER_IMAGES[soldier.key]

              return (
                <motion.li
                  key={soldier.key}
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  whileHover={{ y: -6, scale: 1.03, transition: { duration: 0.2 } }}
                  className={`panel p-0 flex flex-col items-center text-center overflow-hidden transition-colors ${
                    unlocked
                      ? 'border-glow/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'opacity-50'
                  }`}
                  aria-label={unlocked ? `${soldier.name} — Collected` : `Locked item — unlock at ${soldier.unlockAt} quests`}
                >
                  {/* Artwork area */}
                  <div className="relative w-full h-40 sm:h-44 overflow-hidden" aria-hidden="true">
                    {imageSrc && (
                      <Image
                        src={imageSrc}
                        alt={unlocked ? soldier.name : 'Locked collection item'}
                        fill
                        unoptimized
                        className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        style={{
                          filter: unlocked
                            ? `drop-shadow(0 0 6px ${color}50)`
                            : 'grayscale(100%) brightness(0.25) blur(1px)',
                        }}
                      />
                    )}

                    {/* Locked overlay */}
                    {!unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(255,255,255,0.35)"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                    )}

                    {/* Unlocked glow gradient at bottom edge */}
                    {unlocked && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                        style={{
                          background: `linear-gradient(to top, ${color}30, transparent)`,
                        }}
                      />
                    )}
                  </div>

                  {/* Card text area */}
                  <div className="w-full px-3 py-2.5 space-y-0.5">
                    <div
                      className="font-display text-xs font-bold tracking-wider"
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
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

