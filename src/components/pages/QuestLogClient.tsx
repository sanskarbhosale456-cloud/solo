'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuests, useCreateQuest, useCompleteQuest, useDeleteQuest } from '@/hooks/useQuests'
import { getAudioManager } from '@/lib/audio/AudioManager'
import { useQueryClient } from '@tanstack/react-query'
import type { Quest, Discipline } from '@/types'

const STAT_TAGS = ['STRENGTH', 'AGILITY', 'INTELLECT', 'VITALITY'] as const
type StatTag = typeof STAT_TAGS[number]

const STAT_TAG_STYLES: Record<StatTag, { border: string; text: string; bg: string; shadow: string }> = {
  STRENGTH: {
    border: 'border-amber-400/60',
    text: 'text-amber-300',
    bg: 'bg-amber-950/30',
    shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.25)]',
  },
  AGILITY: {
    border: 'border-cyan-400/60',
    text: 'text-cyan-300',
    bg: 'bg-cyan-950/30',
    shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.25)]',
  },
  INTELLECT: {
    border: 'border-blue-400/60',
    text: 'text-blue-300',
    bg: 'bg-blue-950/30',
    shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.25)]',
  },
  VITALITY: {
    border: 'border-emerald-400/60',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/30',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.25)]',
  },
}

function getQuestTags(quest: Quest): StatTag[] {
  if (quest.stat_tags && quest.stat_tags.length > 0) {
    const valid = quest.stat_tags
      .map((t) => t.toUpperCase() as StatTag)
      .filter((t) => STAT_TAGS.includes(t))
    if (valid.length > 0) return valid
  }
  if (quest.discipline) {
    const disc = quest.discipline.toUpperCase() as StatTag
    if (STAT_TAGS.includes(disc)) return [disc]
  }
  return ['STRENGTH']
}

function getQuestType(quest: Quest): 'daily' | 'weekly' {
  if (quest.type === 'daily' || quest.quest_type === 'daily') {
    return 'daily'
  }
  return 'weekly'
}

export function QuestLogClient() {
  const [modalOpen, setModalOpen] = useState(false)
  
  // Assign Quest form state
  const [description, setDescription] = useState('')
  const [questType, setQuestType] = useState<'DAILY' | 'WEEKLY' | null>(null)
  const [selectedTags, setSelectedTags] = useState<StatTag[]>([])
  const [systemWarning, setSystemWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Completion toast: { xp, gold, tags }
  const [completionToast, setCompletionToast] = useState<{ xp: number; gold: number; tags: string[] } | null>(null)

  // Only show ACTIVE quests — completed ones disappear
  const questsQuery = useQuests('active')
  const createQuest = useCreateQuest()
  const completeQuest = useCompleteQuest()
  const deleteQuest = useDeleteQuest()
  const queryClient = useQueryClient()

  const allQuests = questsQuery.data ?? []
  const dailyQuests = allQuests.filter((q) => getQuestType(q) === 'daily')
  const weeklyQuests = allQuests.filter((q) => getQuestType(q) === 'weekly')

  function toggleTag(tag: StatTag) {
    getAudioManager().playSFX('click')
    setSystemWarning(null)
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleToggleStatus(quest: Quest) {
    if (quest.status === 'completed') {
      // Already completed — do nothing (quest should have disappeared)
      return
    }
    // Complete quest: show reward toast then remove
    getAudioManager().playSFX('complete')

    // Capture stat tags before completing
    const tags = getQuestTags(quest)

    try {
      await completeQuest.mutateAsync(quest.id)

      // Show the completion reward toast
      setCompletionToast({
        xp: quest.xp_reward,
        gold: quest.gold_reward,
        tags,
      })

      // Auto-hide toast after 3 seconds
      setTimeout(() => setCompletionToast(null), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(quest: Quest) {
    getAudioManager().playSFX('click')
    await deleteQuest.mutateAsync(quest.id)
  }

  function handleOpenModal(presetType?: 'DAILY' | 'WEEKLY') {
    getAudioManager().playSFX('click')
    setDescription('')
    setQuestType(presetType ?? null)
    setSelectedTags([])
    setSystemWarning(null)
    setModalOpen(true)
  }

  function handleCloseModal() {
    getAudioManager().playSFX('click')
    setModalOpen(false)
    setSystemWarning(null)
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 1. Validate description
    if (!description.trim()) {
      getAudioManager().playSFX('click')
      setSystemWarning('! QUEST DESCRIPTION REQUIRED')
      return
    }

    // 2. Validate quest type
    if (!questType) {
      getAudioManager().playSFX('click')
      setSystemWarning('! QUEST TYPE REQUIRED')
      return
    }

    // 3. Validate at least one stat tag
    if (selectedTags.length === 0) {
      getAudioManager().playSFX('click')
      setSystemWarning('! SELECT AT LEAST ONE STAT')
      return
    }

    setIsSubmitting(true)
    setSystemWarning(null)

    const title = description.trim()
    const isBoss = title.toLowerCase().endsWith('/s')
    const cleanTitle = isBoss ? title.replace(/\/?s/i, '').trim() : title
    const primaryDiscipline = selectedTags[0].toLowerCase() as Discipline

    try {
      await createQuest.mutateAsync({
        title: cleanTitle,
        difficulty: isBoss ? 'S' : 'C',
        quest_type: questType === 'DAILY' ? 'daily' : 'quest',
        type: questType === 'DAILY' ? 'daily' : 'weekly',
        discipline: primaryDiscipline,
        stat_tags: selectedTags,
      })

      getAudioManager().playSFX('rankup')
      setModalOpen(false)
      setDescription('')
      setQuestType(null)
      setSelectedTags([])
    } catch (err: unknown) {
      console.error(err)
      setSystemWarning('! ANOMALY DETECTED: FAILED TO CREATE QUEST')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (questsQuery.isLoading) return null

  return (
    <div className="w-full max-w-7xl mx-auto my-6 px-3 md:px-6" style={{ perspective: '1200px' }}>

      {/* QUEST COMPLETE TOAST */}
      <AnimatePresence>
        {completionToast && (
          <motion.div
            key="completion-toast"
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] min-w-[320px] max-w-[90vw]"
          >
            <div className="relative bg-gradient-to-b from-blue-950/95 to-black/95 border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.55)] backdrop-blur-md px-8 py-5 text-center">
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-200" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-200" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-200" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-200" />
              <p className="font-display tracking-[0.35em] text-blue-100 text-xs uppercase mb-1 drop-shadow-[0_0_8px_#60a5fa]">
                — Quest Cleared —
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                <span className="font-display text-yellow-300 text-sm tracking-widest drop-shadow-[0_0_6px_#fbbf24]">
                  +{completionToast.xp} XP
                </span>
                <span className="text-blue-400/60 text-xs">·</span>
                <span className="font-display text-amber-400 text-sm tracking-widest drop-shadow-[0_0_6px_#f59e0b]">
                  +{completionToast.gold} Gold
                </span>
                {completionToast.tags.map((tag) => {
                  const style = STAT_TAG_STYLES[tag as StatTag] ?? STAT_TAG_STYLES.STRENGTH
                  return (
                    <span key={tag} className={`text-[10px] font-display tracking-widest uppercase border px-2 py-0.5 ${style.border} ${style.text} ${style.bg}`}>
                      +1 {tag}
                    </span>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TWO SEPARATE WINDOWS: DAILY & WEEKLY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* WINDOW 1: DAILY QUEST */}
        <QuestWindow
          title="Daily Quest"
          quests={dailyQuests}
          onToggle={handleToggleStatus}
          onDelete={handleDelete}
          emptyText="No daily quests assigned."
        />

        {/* WINDOW 2: WEEKLY QUEST */}
        <QuestWindow
          title="Weekly Quest"
          quests={weeklyQuests}
          onToggle={handleToggleStatus}
          onDelete={handleDelete}
          emptyText="No weekly quests assigned."
        />
      </div>

      {/* PROMINENT ASSIGN QUEST BUTTON */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => handleOpenModal()}
          className="group relative px-10 py-4 bg-gradient-to-r from-blue-950/80 via-blue-900/60 to-blue-950/80 border-2 border-blue-400 text-blue-100 font-display tracking-[0.25em] text-sm md:text-base uppercase shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:shadow-[0_0_40px_#3b82f6] hover:border-blue-300 hover:text-white transition-all overflow-hidden"
        >
          {/* Futuristic ambient corner lights */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-200" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-blue-200" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-blue-200" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-blue-200" />
          
          <span className="relative z-10 flex items-center gap-3 drop-shadow-[0_0_8px_#60a5fa]">
            [ Assign Quest ]
          </span>

          {/* Hover scanline highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        </button>
      </div>

      {/* SYSTEM PENALTY WARNING BANNER */}
      <div className="mt-8 mb-4 flex justify-center">
        <div className="relative border border-red-500/40 bg-red-950/20 backdrop-blur-sm px-6 py-2.5 shadow-[0_0_20px_rgba(239,68,68,0.15)] max-w-2xl text-center">
          <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-red-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-red-400" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-red-400" />
          <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-red-400" />
          <p className="text-red-400/90 font-display text-[11px] md:text-xs tracking-[0.2em] uppercase drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
            * WARNING: FAILURE TO COMPLETE OBJECTIVES MAY RESULT IN A PENALTY.
          </p>
        </div>
      </div>

      {/* DEDICATED ASSIGN QUEST MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-xl"
            >
              {/* MODAL TOP GLOW BAR */}
              <div className="relative w-full h-8 flex justify-between items-center mb-[-12px] z-20">
                <div className="w-12 h-full border-l-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
                <div className="flex-1 relative flex items-center justify-center h-full mx-2">
                  <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6]" />
                </div>
                <div className="w-12 h-full border-r-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
              </div>

              {/* MODAL BODY */}
              <div className="relative w-full bg-[#030914] border border-blue-500/50 p-6 md:p-8 shadow-[inset_0_0_60px_rgba(37,99,235,0.25),0_0_50px_rgba(37,99,235,0.3)] overflow-hidden">
                {/* Tech grid overlay */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* MODAL HEADER */}
                <div className="relative flex justify-between items-center pb-4 mb-6 border-b border-blue-500/30">
                  <div className="border border-blue-400/40 px-5 py-1.5 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)] bg-blue-900/10">
                    <h2 className="text-blue-50 font-display tracking-[0.25em] text-base md:text-lg uppercase drop-shadow-[0_0_10px_#60a5fa]">
                      Assign Quest
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-blue-400 hover:text-white font-display tracking-widest text-xs uppercase px-2 py-1 border border-blue-500/30 hover:border-blue-400 transition-colors"
                  >
                    [ Close ]
                  </button>
                </div>

                {/* ASSIGNMENT FORM */}
                <form onSubmit={handleAssignSubmit} className="space-y-6 relative z-10">
                  
                  {/* 1. QUEST DESCRIPTION */}
                  <div className="space-y-2">
                    <label className="block text-blue-400 font-display tracking-[0.2em] text-xs uppercase">
                      [ Quest Objective ]
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value)
                        setSystemWarning(null)
                      }}
                      placeholder="Enter Quest"
                      autoFocus
                      className="w-full bg-blue-950/20 border border-blue-500/40 focus:border-blue-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] outline-none text-blue-50 font-body px-4 py-3 placeholder:text-blue-400/30 transition-all text-sm md:text-base"
                    />
                  </div>

                  {/* 2. QUEST TYPE SELECTION */}
                  <div className="space-y-2">
                    <label className="block text-blue-400 font-display tracking-[0.2em] text-xs uppercase">
                      [ Quest Classification ] <span className="text-blue-400/60 font-mono text-[10px]">(SELECT ONE)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['DAILY', 'WEEKLY'] as const).map((type) => {
                        const isSelected = questType === type
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              getAudioManager().playSFX('click')
                              setQuestType(type)
                              setSystemWarning(null)
                            }}
                            className={`py-3 px-4 font-display tracking-[0.2em] text-xs md:text-sm uppercase border transition-all ${
                              isSelected
                                ? 'border-blue-400 bg-blue-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                                : 'border-blue-900/40 bg-black/40 text-blue-400/50 hover:border-blue-500/40 hover:text-blue-300'
                            }`}
                          >
                            [ {type} ]
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 3. STAT TAG SELECTION */}
                  <div className="space-y-2">
                    <label className="block text-blue-400 font-display tracking-[0.2em] text-xs uppercase">
                      [ Stat Attributes ] <span className="text-blue-400/60 font-mono text-[10px]">(AT LEAST ONE)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {STAT_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag)
                        const style = STAT_TAG_STYLES[tag]
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`py-2 px-2 font-display tracking-[0.15em] text-[11px] uppercase border transition-all ${
                              isSelected
                                ? `${style.border} ${style.bg} ${style.text} ${style.shadow} scale-[1.03]`
                                : 'border-blue-950 bg-black/50 text-blue-400/30 hover:border-blue-800/60 hover:text-blue-300'
                            }`}
                          >
                            [ {tag} ]
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 4. SYSTEM WARNING / VALIDATION ERROR */}
                  {systemWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-red-500/60 bg-red-950/40 p-3 shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-3"
                    >
                      <span className="text-red-400 font-bold text-sm">⚠</span>
                      <span className="text-red-400 font-display tracking-widest text-xs uppercase drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                        {systemWarning}
                      </span>
                    </motion.div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <div className="pt-4 flex justify-end gap-4 border-t border-blue-500/20">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 border border-blue-900/40 text-blue-400/60 hover:text-blue-300 font-display tracking-widest text-xs uppercase transition-colors"
                    >
                      [ Cancel ]
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-2.5 bg-blue-600 border border-blue-300 text-white font-display tracking-[0.2em] text-xs uppercase shadow-[0_0_20px_#3b82f6] hover:bg-blue-500 hover:shadow-[0_0_30px_#60a5fa] transition-all disabled:opacity-50"
                    >
                      [ Assign Quest ]
                    </button>
                  </div>
                </form>
              </div>

              {/* MODAL BOTTOM GLOW BAR */}
              <div className="relative w-full h-8 flex justify-between items-center mt-[-12px] z-20">
                <div className="w-12 h-full border-l-4 border-b-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
                <div className="flex-1 relative flex items-center justify-center h-full mx-2">
                  <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6]" />
                </div>
                <div className="w-12 h-full border-r-4 border-b-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------
// SUB-COMPONENT: RPG SYSTEM QUEST WINDOW
// ---------------------------------------------------------------
function QuestWindow({
  title,
  quests,
  onToggle,
  onDelete,
  emptyText,
}: {
  title: string
  quests: Quest[]
  onToggle: (quest: Quest) => void
  onDelete: (quest: Quest) => void
  emptyText: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: 6, y: 20 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-20 flex flex-col items-center drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]"
    >
      {/* TOP GLOW BAR (Bracket corners + glowing line) */}
      <div className="relative w-full h-8 flex justify-between items-center mb-[-12px] z-20">
        <div className="w-10 h-full border-l-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
        <div className="flex-1 relative flex items-center justify-center h-full mx-2">
          <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6,0_0_60px_#2563eb]" />
          <div className="absolute w-full h-full flex justify-between px-8">
            <div className="w-12 h-[3px] bg-blue-900/50" />
            <div className="w-12 h-[3px] bg-blue-900/50" />
          </div>
        </div>
        <div className="w-10 h-full border-r-4 border-t-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
      </div>

      {/* MAIN PANEL */}
      <div className="relative w-[98%] bg-[#030914]/90 backdrop-blur-xl border border-blue-500/40 p-6 md:p-8 shadow-[inset_0_0_50px_rgba(37,99,235,0.15)] overflow-hidden min-h-[440px] flex flex-col justify-between">
        
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-2 border border-blue-400/20 pointer-events-none" />

        <div>
          {/* HEADER SECTION (Framed Title Box) */}
          <div className="relative flex justify-center items-center mb-8 pb-6 border-b border-blue-500/30">
            <div className="border border-blue-400/40 px-8 py-2 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)] bg-blue-900/10">
              <h2 className="text-blue-50 font-display tracking-[0.25em] text-lg drop-shadow-[0_0_12px_#60a5fa] uppercase">
                {title}
              </h2>
            </div>
          </div>

          {/* OBJECTIVES LIST */}
          <div className="relative z-10 space-y-3 font-body">
            <AnimatePresence>
              {quests.map((quest) => (
                <TaskRow
                  key={quest.id}
                  quest={quest}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>

            {quests.length === 0 && (
              <div className="text-blue-400/40 text-center py-16 font-display tracking-[0.25em] text-xs uppercase">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM GLOW BAR */}
      <div className="relative w-full h-8 flex justify-between items-center mt-[-12px] z-20">
        <div className="w-10 h-full border-l-4 border-b-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
        <div className="flex-1 relative flex items-center justify-center h-full mx-2">
          <div className="absolute w-full h-[3px] bg-blue-100 shadow-[0_0_20px_#60a5fa,0_0_40px_#3b82f6,0_0_60px_#2563eb]" />
          <div className="absolute w-full h-full flex justify-between px-8">
            <div className="w-12 h-[3px] bg-blue-900/50" />
            <div className="w-12 h-[3px] bg-blue-900/50" />
          </div>
        </div>
        <div className="w-10 h-full border-r-4 border-b-4 border-blue-400 opacity-90 shadow-[0_0_15px_#3b82f6]" />
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------
// SUB-COMPONENT: SINGLE TASK / QUEST ROW
// ---------------------------------------------------------------
function TaskRow({
  quest,
  onToggle,
  onDelete,
}: {
  quest: Quest
  onToggle: (q: Quest) => void
  onDelete: (q: Quest) => void
}) {
  const isBoss = quest.difficulty === 'S'
  const isCompleted = quest.status === 'completed'
  const tags = getQuestTags(quest)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`group flex items-start justify-between gap-3 p-3 transition-colors border-l-2 relative overflow-hidden ${
        isCompleted
          ? 'bg-emerald-950/10 border-emerald-500/40 hover:bg-emerald-950/20'
          : 'hover:bg-blue-500/10 border-transparent hover:border-blue-400'
      }`}
    >
      <div className="flex items-start gap-3.5 relative z-10 flex-1 min-w-0">
        {/* Status Toggle Button: [ INCOMPLETE ] vs [ COMPLETE ] */}
        <button
          onClick={() => onToggle(quest)}
          className={`font-display tracking-[0.15em] text-xs uppercase whitespace-nowrap mt-0.5 transition-all flex-shrink-0 ${
            isCompleted
              ? 'text-emerald-400 hover:text-emerald-200 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
              : 'text-blue-400/90 hover:text-blue-200 hover:drop-shadow-[0_0_8px_#60a5fa]'
          }`}
        >
          {isCompleted ? '[ Complete ]' : '[ Incomplete ]'}
        </button>

        {/* Quest Info: Title & Stat Tags */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span
            className={`tracking-wide text-sm md:text-base leading-snug break-words transition-colors ${
              isCompleted
                ? 'text-blue-200/50 line-through'
                : isBoss
                ? 'text-red-500 font-bold italic drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                : 'text-blue-50 drop-shadow-[0_0_5px_rgba(96,165,250,0.3)]'
            }`}
          >
            {isBoss ? `[${quest.title.toUpperCase()}]` : quest.title}
          </span>

          {/* Stat Badges / Chips */}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const style = STAT_TAG_STYLES[tag] || STAT_TAG_STYLES.STRENGTH
              return (
                <span
                  key={tag}
                  className={`font-display text-[9px] tracking-widest uppercase px-2 py-0.5 border ${style.border} ${style.bg} ${style.text} ${style.shadow} flex items-center gap-1`}
                >
                  [{tag}]
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Progress & Abandon */}
      <div className="flex items-center gap-3 pl-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10 flex-shrink-0">
        <span
          className={`font-display tracking-widest text-xs ${
            isCompleted ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-blue-400 drop-shadow-[0_0_5px_#60a5fa]'
          }`}
        >
          {isCompleted ? '1 / 1' : '0 / 1'}
        </span>
        <button
          onClick={() => onDelete(quest)}
          className="text-red-500/60 hover:text-red-400 font-display tracking-widest text-[10px] uppercase transition-colors"
        >
          [ Abandon ]
        </button>
      </div>
    </motion.div>
  )
}
