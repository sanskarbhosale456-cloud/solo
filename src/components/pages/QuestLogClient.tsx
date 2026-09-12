'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuests, useCreateQuest, useCompleteQuest, useDeleteQuest } from '@/hooks/useQuests'
import { getAudioManager } from '@/lib/audio/AudioManager'
import type { Quest } from '@/types'

export function QuestLogClient() {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const questsQuery = useQuests('active')
  const createQuest = useCreateQuest()
  const completeQuest = useCompleteQuest()
  const deleteQuest = useDeleteQuest()

  const quests = questsQuery.data ?? []

  async function handleQuickAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && newTaskTitle.trim() && !isSubmitting) {
      e.preventDefault()
      setIsSubmitting(true)
      
      const title = newTaskTitle.trim()
      const isBoss = title.toLowerCase().endsWith('/s')
      const cleanTitle = isBoss ? title.replace(/\/?s/i, '').trim() : title

      try {
        await createQuest.mutateAsync({
          title: cleanTitle,
          difficulty: isBoss ? 'S' : 'C',
          quest_type: 'quest',
          discipline: 'strength',
        })
        setNewTaskTitle('')
        getAudioManager().playSFX('click')
      } catch (err: unknown) {
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  async function handleComplete(quest: Quest) {
    getAudioManager().playSFX('complete')
    await completeQuest.mutateAsync(quest.id)
  }

  async function handleDelete(quest: Quest) {
    getAudioManager().playSFX('click')
    await deleteQuest.mutateAsync(quest.id)
  }

  if (questsQuery.isLoading) return null

  return (
    <div className="w-full max-w-3xl mx-auto my-6" style={{ perspective: '1200px' }}>
      <motion.div
        initial={{ opacity: 0, rotateX: 10, y: 20 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-50 flex flex-col items-center drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]"
      >
        {/* TOP GLOW BAR (Anime System Window style) */}
        <div className="relative w-full h-8 flex justify-between items-center mb-[-12px] z-20">
          <div className="w-12 h-full border-l-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6] shadow-blue-500" />
          <div className="flex-1 relative flex items-center justify-center h-full mx-2">
            <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6,0_0_60px_#2563eb]" />
            <div className="absolute w-full h-full flex justify-between px-10">
               <div className="w-16 h-[3px] bg-blue-900/50" />
               <div className="w-16 h-[3px] bg-blue-900/50" />
            </div>
          </div>
          <div className="w-12 h-full border-r-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6] shadow-blue-500" />
        </div>

        {/* MAIN PANEL */}
        <div className="relative w-[96%] bg-[#030914]/90 backdrop-blur-xl border border-blue-500/40 p-8 shadow-[inset_0_0_50px_rgba(37,99,235,0.15)] overflow-hidden">
          
          {/* Background grid / scratches */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'rotate(-2deg) scale(1.1)' }} />
          <div className="absolute inset-2 border border-blue-400/20 pointer-events-none" />

          {/* HEADER SECTION */}
          <div className="relative flex justify-center items-center gap-6 mb-10 pb-6 border-b border-blue-500/30">
            <div className="w-12 h-12 rounded-full border-[3px] border-blue-400 flex items-center justify-center bg-[#030914] shadow-[0_0_15px_#3b82f6]">
              <span className="text-blue-100 font-bold text-2xl drop-shadow-[0_0_10px_#60a5fa]">!</span>
            </div>
            <div className="border border-blue-400/40 px-8 py-2 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)] bg-blue-900/10">
              <h2 className="text-blue-50 font-display tracking-[0.25em] text-xl drop-shadow-[0_0_12px_#60a5fa] uppercase">
                Active Objectives
              </h2>
            </div>
          </div>

          {/* OBJECTIVES LIST */}
          <div className="relative z-10 space-y-3 font-body text-lg px-2 md:px-8">
            <AnimatePresence>
              {quests.map(quest => (
                <TaskRow key={quest.id} quest={quest} onComplete={handleComplete} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
            
            {quests.length === 0 && (
              <div className="text-blue-400/50 text-center py-12 font-display tracking-[0.3em] text-sm uppercase">
                All objectives completed.
              </div>
            )}
          </div>

          {/* ADD NEW TASK (Terminal Style) */}
          <div className="relative z-10 mt-12 pt-6 border-t border-blue-500/30 flex items-center gap-4 px-2 md:px-8">
             <span className="text-blue-400 font-display tracking-[0.2em] text-sm uppercase whitespace-nowrap drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
               [ Assign ]
             </span>
             <input
               type="text"
               value={newTaskTitle}
               onChange={e => setNewTaskTitle(e.target.value)}
               onKeyDown={handleQuickAdd}
               disabled={isSubmitting}
               placeholder="Enter new objective..."
               className="flex-1 bg-transparent border-b border-blue-500/20 focus:border-blue-400 outline-none text-blue-100 font-body placeholder:text-blue-400/20 py-1 transition-colors"
             />
          </div>

          {/* Warning Message */}
          <div className="relative z-10 mt-8 text-center">
            <p className="text-red-500/80 font-display text-[11px] tracking-widest uppercase drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
              * Warning: Failure to complete objectives may result in a penalty.
            </p>
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

function TaskRow({ quest, onComplete, onDelete }: { quest: Quest, onComplete: (q: Quest) => void, onDelete: (q: Quest) => void }) {
  const isBoss = quest.difficulty === 'S'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 hover:bg-blue-500/10 transition-colors border-l-2 border-transparent hover:border-blue-400 relative overflow-hidden"
    >
      <div className="flex items-center gap-4 relative z-10">
        {/* Status Label */}
        <button
          onClick={() => onComplete(quest)}
          className="text-blue-400/80 hover:text-blue-200 hover:drop-shadow-[0_0_8px_#60a5fa] font-display tracking-[0.15em] text-sm uppercase whitespace-nowrap transition-all"
        >
          [ Incomplete ]
        </button>

        {/* Task Title */}
        <span className={`${isBoss ? 'text-red-500 font-bold italic drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'text-blue-50 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]'} tracking-wide text-base md:text-lg`} style={{ fontFamily: 'var(--font-body)' }}>
          {isBoss ? `[${quest.title.toUpperCase()}]` : quest.title}
        </span>
      </div>

      {/* Action / Counters */}
      <div className="flex items-center gap-6 pl-4 md:pl-0 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
         <span className="text-blue-400 font-display tracking-widest text-sm drop-shadow-[0_0_5px_#60a5fa]">
           0 / 1
         </span>
         <button
           onClick={() => onDelete(quest)}
           className="text-red-500/60 hover:text-red-400 font-display tracking-widest text-[11px] uppercase transition-colors"
         >
           [ Abandon ]
         </button>
      </div>
    </motion.div>
  )
}
