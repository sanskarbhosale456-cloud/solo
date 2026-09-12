'use client'

import { useProfile } from '@/hooks/useProfile'
import { useQuests, useCompleteQuest } from '@/hooks/useQuests'
import { getAudioManager } from '@/lib/audio/AudioManager'
import { SystemNotification } from '@/components/ui/SystemNotification'
import { motion, AnimatePresence } from 'framer-motion'
import type { Quest, Rank } from '@/types'
import { useState, useEffect } from 'react'

const STAT_KEYS = [
  { key: 'stat_str', label: 'STR' },
  { key: 'stat_vit', label: 'VIT' },
  { key: 'stat_agi', label: 'AGI' },
  { key: 'stat_int', label: 'INT' },
  { key: 'stat_per', label: 'PER' },
]

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

export function StatusWindowClient() {
  const profileQuery = useProfile()
  const dailyQuestsQuery = useQuests('active', 'daily')
  const completeQuest = useCompleteQuest()

  // Trigger for glitch effect
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    // Randomly glitch the system every 3-7 seconds
    const glitchInterval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }, Math.random() * 4000 + 3000)
    return () => clearInterval(glitchInterval)
  }, [])

  if (profileQuery.error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 font-display tracking-widest uppercase">
        System Anomaly Detected
      </div>
    )
  }

  if (profileQuery.isLoading) return null

  const { profile } = profileQuery.data!

  // Derived mock lore stats
  const hp = 100 + (profile.stat_vit * 20) + (profile.level * 50)
  const mp = 50 + (profile.stat_int * 15) + (profile.mana_crystals * 10)
  
  const rankIndex = RANKS.indexOf(profile.rank)
  const maxStat = Math.max(profile.stat_int, profile.stat_str, profile.stat_agi, profile.stat_vit, profile.stat_per, 1)

  async function handleComplete(quest: Quest) {
    getAudioManager().playSFX('complete')
    await completeQuest.mutateAsync(quest.id)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12" style={{ perspective: '1200px' }}>
      {/* INJECTED HACKATHON ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        @keyframes lightning-border {
          0%, 94%, 98% { box-shadow: 0 0 0px transparent, inset 0 0 0px transparent; border-color: rgba(0, 240, 255, 0.3); }
          95%, 99% { box-shadow: 0 0 40px #00f0ff, inset 0 0 30px #00f0ff; border-color: #ffffff; }
          100% { box-shadow: 0 0 0px transparent, inset 0 0 0px transparent; border-color: rgba(0, 240, 255, 0.3); }
        }
        @keyframes text-glitch {
          0%, 100% { transform: translate(0); text-shadow: 0 0 15px rgba(0,240,255,0.8); }
          20% { transform: translate(-2px, 1px); text-shadow: -2px 0px red, 2px 0px blue; }
          40% { transform: translate(2px, -1px); text-shadow: 2px 0px #00f0ff, -2px 0px #ff00ff; }
          60% { transform: translate(-1px, -1px); }
        }
        @keyframes float-hologram {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-10px) rotateX(2deg); }
        }
      `}} />

      <SystemNotification />

      <motion.div
        initial={{ opacity: 0, rotateX: 30, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 flex flex-col items-center drop-shadow-[0_0_30px_rgba(0,240,255,0.15)]"
        style={{ animation: 'float-hologram 6s ease-in-out infinite' }}
      >
        {/* LIGHTNING FLASH OVERLAYS */}
        <div className="absolute inset-0 z-0 pointer-events-none rounded-sm" style={{ animation: 'lightning-border 4s infinite' }} />

        {/* MAIN STATUS PANEL */}
        <div className="relative w-[98%] bg-black/70 backdrop-blur-xl border border-cyan-500/30 p-8 md:p-12 shadow-[inset_0_0_80px_rgba(0,240,255,0.1)] overflow-hidden rounded-sm group">
          {/* Animated Scanline Grid */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none mix-blend-screen" 
            style={{ 
              backgroundImage: 'linear-gradient(rgba(0,240,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.2) 1px, transparent 1px)', 
              backgroundSize: '40px 40px',
              animation: 'scanline-scroll 3s linear infinite'
            }} 
          />

          {/* HEADER TITLE */}
          <div className="relative z-10 flex flex-col items-center mb-12">
            <h1 
              className={`text-cyan-400 font-bold tracking-[0.3em] text-3xl md:text-4xl uppercase transition-all duration-75 ${glitch ? 'scale-105' : ''}`} 
              style={{ 
                fontFamily: '"Cinzel", serif', 
                animation: glitch ? 'text-glitch 0.2s linear infinite' : 'none',
                textShadow: "0 0 15px rgba(0,240,255,0.8)" 
              }}
            >
              [ STATUS ]
            </h1>
            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-4 opacity-50 shadow-[0_0_10px_#00f0ff]" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* LEFT COLUMN: IDENTIFICATION & LEVEL */}
            <div className="space-y-8">
              
              {/* Name & Basic Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-cyan-500/20 pb-2 group-hover:border-cyan-400/50 transition-colors">
                  <span className="text-cyan-500/70 font-display tracking-widest text-xs uppercase font-bold">Name</span>
                  <span className="text-white font-body text-xl tracking-wider text-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{profile.username || 'PLAYER'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-cyan-500/20 pb-2 group-hover:border-cyan-400/50 transition-colors">
                  <span className="text-cyan-500/70 font-display tracking-widest text-xs uppercase font-bold">Job</span>
                  <span className="text-white font-body text-lg tracking-wider opacity-40">None</span>
                </div>
                <div className="flex justify-between items-end border-b border-cyan-500/20 pb-2 group-hover:border-cyan-400/50 transition-colors">
                  <span className="text-cyan-500/70 font-display tracking-widest text-xs uppercase font-bold">Title</span>
                  <span className="text-white font-body text-lg tracking-wider">{profile.title || 'None'}</span>
                </div>
              </div>

              {/* Level & XP */}
              <div className="pt-2 space-y-4 bg-cyan-950/20 p-6 border border-cyan-500/10 rounded-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-end relative z-10">
                  <span className="text-cyan-400 font-display tracking-widest text-sm uppercase font-bold">LEVEL</span>
                  <motion.span 
                    initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                    className="text-white font-display text-5xl font-bold" 
                    style={{ textShadow: "0 0 20px rgba(0,240,255,0.8)" }}
                  >
                    {profile.level}
                  </motion.span>
                </div>
                
                {/* Animated Custom XP Bar */}
                <div className="relative w-full h-1.5 bg-black border border-cyan-900/50 rounded-none overflow-hidden mt-2 z-10">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(profile.xp / profile.xp_to_next) * 100}%` }}
                     transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                     className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_15px_#00f0ff]"
                   />
                </div>
                <div className="flex justify-between items-center text-cyan-500/50 font-mono text-[10px] tracking-widest uppercase mt-1 relative z-10">
                  <span>Experience</span>
                  <span>{profile.xp} / {profile.xp_to_next}</span>
                </div>
              </div>

              {/* Dynamic Animated HP / MP */}
              <div className="pt-4 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-display font-bold tracking-widest w-12 text-xs">HP</span>
                  <div className="flex-1 h-3 bg-black/60 border border-green-900/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(0,0,0,0.5)_90%)] bg-[size:10%_100%] z-10" />
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, delay: 1 }}
                      className="h-full bg-green-500 shadow-[0_0_15px_#22c55e] relative z-0" 
                    />
                  </div>
                  <span className="text-green-100 font-mono text-xs w-20 text-right">{hp}/{hp}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-cyan-400 font-display font-bold tracking-widest w-12 text-xs">MP</span>
                  <div className="flex-1 h-3 bg-black/60 border border-cyan-900/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(0,0,0,0.5)_90%)] bg-[size:10%_100%] z-10" />
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, delay: 1.1 }}
                      className="h-full bg-cyan-500 shadow-[0_0_15px_#00f0ff] relative z-0" 
                    />
                  </div>
                  <span className="text-cyan-100 font-mono text-xs w-20 text-right">{mp}/{mp}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-orange-500 font-display font-bold tracking-widest w-16 text-xs">FATIGUE</span>
                  <span className="text-orange-200 font-mono text-xs w-20 drop-shadow-[0_0_5px_#f97316]">0</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: ATTRIBUTES & RANK */}
            <div className="space-y-10 flex flex-col justify-between">
              
              {/* Rank Progression Roadmap */}
              <div className="space-y-6">
                <div className="text-cyan-500/70 font-display tracking-[0.2em] text-[10px] uppercase font-bold border-b border-cyan-500/20 pb-2">
                  Hunter Evaluation Rank
                </div>
                <div className="flex justify-between items-center relative px-2 pt-2">
                  <motion.div 
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
                    className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-900/40 z-0 origin-left" 
                  />
                  
                  {RANKS.map((r, i) => {
                    const isAchieved = i <= rankIndex
                    const isCurrent = i === rankIndex
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + (i * 0.1) }}
                        key={r} className="relative z-10 flex flex-col items-center"
                      >
                        <div className={`w-8 h-8 rotate-45 border flex items-center justify-center transition-all duration-500
                          ${isCurrent ? 'bg-cyan-950 border-cyan-400 shadow-[0_0_20px_#00f0ff] scale-125' 
                          : isAchieved ? 'bg-black border-cyan-700/50' 
                          : 'bg-black border-cyan-900/20 opacity-30'}
                        `}>
                          <span className={`-rotate-45 font-display text-xs font-bold
                            ${isCurrent ? 'text-cyan-300 drop-shadow-[0_0_5px_#00f0ff]' 
                            : isAchieved ? 'text-cyan-600' 
                            : 'text-cyan-900'}
                          `}>
                            {r}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Attributes Terminal Style */}
              <div className="bg-cyan-950/10 p-6 border border-cyan-500/10 rounded-sm relative overflow-hidden">
                {/* Sweep animation overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[200%] -top-[100%] animate-[scanline-scroll_4s_linear_infinite]" />
                
                <div className="text-cyan-500/70 font-display tracking-[0.2em] text-[10px] uppercase mb-6 font-bold relative z-10">
                  Attributes
                </div>
                <div className="space-y-4 relative z-10">
                  {STAT_KEYS.map(({ key, label }, i) => {
                    const value = profile[key as keyof typeof profile] as number
                    const pct = Math.min(100, (value / Math.max(maxStat, 1)) * 100)
                    return (
                      <div key={key} className="flex items-center gap-4 group">
                        <span className="text-cyan-200 font-display tracking-widest text-xs w-12 font-bold">{label}</span>
                        <span className="text-white font-mono text-sm w-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{value}</span>
                        <div className="flex-1 h-[2px] bg-cyan-950">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, delay: 1 + (i * 0.1), ease: "easeOut" }}
                            className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] relative"
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white drop-shadow-[0_0_5px_#ffffff]" />
                          </motion.div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-8 pt-4 border-t border-cyan-500/20 flex justify-between text-cyan-500/50 font-display text-[9px] tracking-[0.2em] uppercase font-bold relative z-10">
                  <span>Available Points: 0</span>
                  <span className="animate-pulse text-cyan-400/80">Distribute Manually</span>
                </div>
              </div>

            </div>
          </div>

          {/* ASSETS (Gold / Mana / Shadows) */}
          <div className="relative z-10 mt-12 pt-8 border-t border-cyan-500/30 grid grid-cols-3 text-center divide-x divide-cyan-500/20">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="group hover:bg-yellow-500/10 transition-colors py-2 cursor-default">
              <div className="text-yellow-400 font-display text-2xl md:text-3xl font-bold drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">{profile.gold.toLocaleString()}</div>
              <div className="text-yellow-500/50 font-display tracking-[0.2em] text-[10px] uppercase mt-2 font-bold group-hover:text-yellow-400/80 transition-colors">Gold</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="group hover:bg-purple-500/10 transition-colors py-2 cursor-default">
              <div className="text-purple-400 font-display text-2xl md:text-3xl font-bold drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">{profile.mana_crystals.toLocaleString()}</div>
              <div className="text-purple-500/50 font-display tracking-[0.2em] text-[10px] uppercase mt-2 font-bold group-hover:text-purple-400/80 transition-colors">Mana Crystals</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }} className="group hover:bg-cyan-500/10 transition-colors py-2 cursor-default">
              <div className="text-white font-display text-2xl md:text-3xl font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{profile.streak}</div>
              <div className="text-cyan-500/50 font-display tracking-[0.2em] text-[10px] uppercase mt-2 font-bold group-hover:text-cyan-400/80 transition-colors">Day Streak</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* COMPACT DAILY QUEST HUB */}
      {dailyQuestsQuery.data && dailyQuestsQuery.data.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 2, duration: 0.8, type: "spring" }}
          className="relative max-w-2xl mx-auto border border-cyan-500/30 bg-black/80 backdrop-blur-md p-8 shadow-[0_0_30px_rgba(0,240,255,0.05)] rounded-sm group overflow-hidden"
        >
           {/* Electric Border Hover Effect */}
           <div className="absolute inset-0 border border-cyan-400/0 group-hover:border-cyan-400/50 transition-colors duration-500 pointer-events-none z-0" />
           <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none z-0" />

           <h3 className="relative z-10 text-cyan-400 font-bold tracking-[0.2em] text-sm uppercase mb-6 text-center" style={{ fontFamily: '"Cinzel", serif', textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>
             [ Daily Quests ]
           </h3>
           <div className="space-y-3 relative z-10">
             {dailyQuestsQuery.data.map((quest, i) => (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 + (i * 0.1) }}
                 key={quest.id} className="flex items-center gap-4 group/item p-3 hover:bg-cyan-900/40 border border-transparent hover:border-cyan-500/50 transition-all cursor-pointer backdrop-blur-sm"
               >
                 <button
                   onClick={(e) => { e.stopPropagation(); handleComplete(quest); }}
                   className="text-cyan-500/60 hover:text-cyan-200 hover:drop-shadow-[0_0_8px_#00f0ff] font-display tracking-[0.1em] text-[10px] uppercase font-bold transition-all"
                 >
                   [ Incomplete ]
                 </button>
                 <span className="text-white font-body text-sm flex-1 opacity-80 group-hover/item:opacity-100 group-hover/item:text-shadow-[0_0_5px_#fff] transition-all">{quest.title}</span>
                 <span className="text-cyan-500/40 font-mono text-xs font-bold group-hover/item:text-cyan-300">0/1</span>
               </motion.div>
             ))}
           </div>
           {/* Penalty Warning Footer */}
           <div className="mt-6 pt-4 border-t border-red-500/30 text-center relative z-10">
             <span className="text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold animate-pulse drop-shadow-[0_0_5px_#ef4444]">
               Failure to complete daily quests will result in a penalty.
             </span>
           </div>
        </motion.div>
      )}
    </div>
  )
}
