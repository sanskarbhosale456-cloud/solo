'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getAudioManager } from '@/lib/audio/AudioManager'

export function SystemNotification() {
  const [accepted, setAccepted] = useState(true) // default true to prevent hydration mismatch blink
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    // Only show if they haven't accepted it yet
    if (localStorage.getItem('life-rpg:player-accepted') !== 'true') {
      setAccepted(false)
    }
  }, [])

  if (accepted) return null

  const handleAccept = () => {
    const am = getAudioManager()
    am.playSFX('click')
    localStorage.setItem('life-rpg:player-accepted', 'true')
    setAccepted(true)
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto my-12" style={{ perspective: '1200px' }}>
      <motion.div
        initial={{ opacity: 0, rotateX: 25, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 flex flex-col items-center drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]"
      >
        {/* Animated ambient backglow */}
        <div className="absolute inset-0 bg-blue-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />

        {/* TOP GLOW BAR */}
        <div className="relative w-full h-8 flex justify-between items-center mb-[-12px] z-20">
          <div className="w-12 h-full border-l-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6] shadow-blue-500" />
          
          <div className="flex-1 relative flex items-center justify-center h-full mx-2">
            {/* Core bright beam */}
            <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6,0_0_60px_#2563eb]" />
            {/* Notches overlay */}
            <div className="absolute w-full h-full flex justify-between px-10">
               <div className="w-16 h-[3px] bg-blue-900/50" />
               <div className="w-16 h-[3px] bg-blue-900/50" />
            </div>
          </div>

          <div className="w-12 h-full border-r-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6] shadow-blue-500" />
        </div>

        {/* MAIN PANEL */}
        <div className="relative w-[96%] bg-[#030914]/80 backdrop-blur-xl border border-blue-500/40 p-10 pb-12 overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.2)_inset]">
          {/* Cracked / techy background texture (CSS repeating gradient grid) */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              transform: 'rotate(-5deg) scale(1.2)',
            }}
          />
          {/* Diagonal scratch/crack simulation */}
          <div className="absolute top-1/4 left-0 w-full h-[1px] bg-blue-400/20 rotate-[15deg] blur-[1px]" />
          <div className="absolute top-3/4 left-10 w-[80%] h-[1px] bg-blue-400/10 -rotate-[10deg] blur-[1px]" />

          {/* Inner dashed/faint border */}
          <div className="absolute inset-2 border border-blue-400/20 pointer-events-none" />

          {/* HEADER SECTION */}
          <div className="relative flex justify-center items-center gap-6 mb-12">
            {/* (!) Icon */}
            <motion.div 
              animate={{ boxShadow: ['0 0 10px #3b82f6', '0 0 25px #60a5fa', '0 0 10px #3b82f6'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-full border-[3px] border-blue-300 flex items-center justify-center bg-[#030914]"
            >
              <span className="text-blue-100 font-bold text-3xl drop-shadow-[0_0_10px_#60a5fa]">!</span>
            </motion.div>

            {/* NOTIFICATION Title Box */}
            <div className="border-[1.5px] border-blue-400/60 px-10 py-3 shadow-[0_0_20px_rgba(59,130,246,0.3)_inset] bg-blue-950/20">
              <h2 className="text-blue-50 font-display tracking-[0.3em] text-2xl drop-shadow-[0_0_12px_#60a5fa]">
                NOTIFICATION
              </h2>
            </div>
          </div>

          {/* BODY TEXT */}
          <div className="relative text-center font-body text-blue-100/90 leading-loose text-lg tracking-wide z-10">
            <p className="drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
              You have acquired the qualifications<br />
              to be a <span className="italic font-bold text-blue-50 drop-shadow-[0_0_15px_#60a5fa]">Player</span>. Will you accept?
            </p>
          </div>

          {/* ACCEPT BUTTON (Interactive addition for the web) */}
          <div className="relative z-20 mt-10 flex justify-center">
            <button
              onClick={handleAccept}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="group relative px-8 py-2 font-display tracking-widest text-sm text-blue-100 uppercase overflow-hidden"
            >
              <div className="absolute inset-0 border border-blue-400/40 transition-colors group-hover:border-blue-300" />
              <div className="absolute inset-0 bg-blue-500/10 transition-opacity group-hover:bg-blue-400/20" />
              <motion.div
                animate={{ opacity: isHovering ? 1 : 0.5 }}
                className="absolute inset-0 shadow-[0_0_20px_rgba(96,165,250,0.5)_inset]"
              />
              <span className="relative drop-shadow-[0_0_8px_#60a5fa]">Accept</span>
            </button>
          </div>
        </div>

        {/* BOTTOM GLOW BAR */}
        <div className="relative w-full h-8 flex justify-between items-center mt-[-12px] z-20">
          <div className="w-12 h-full border-l-4 border-b-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
          
          <div className="flex-1 relative flex items-center justify-center h-full mx-2">
            <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6,0_0_60px_#2563eb]" />
            <div className="absolute w-full h-full flex justify-between px-10">
               <div className="w-16 h-[3px] bg-blue-900/50" />
               <div className="w-16 h-[3px] bg-blue-900/50" />
            </div>
          </div>

          <div className="w-12 h-full border-r-4 border-b-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
        </div>
      </motion.div>
    </div>
  )
}
