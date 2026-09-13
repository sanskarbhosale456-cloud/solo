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
    border: 'border-amber-500/60',
    text: 'text-amber-300',
    bg: 'bg-amber-950/40',
    shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.25)]',
  },
  AGILITY: {
    border: 'border-yellow-600/60',
    text: 'text-yellow-300',
    bg: 'bg-yellow-950/40',
    shadow: 'shadow-[0_0_10px_rgba(202,138,4,0.25)]',
  },
  INTELLECT: {
    border: 'border-amber-300/60',
    text: 'text-amber-200',
    bg: 'bg-amber-900/40',
    shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.25)]',
  },
  VITALITY: {
    border: 'border-emerald-500/60',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/40',
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
    <div className="w-full max-w-5xl mx-auto my-2 px-2 md:px-4" style={{ perspective: '1200px' }}>

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
            <div className="relative bg-gradient-to-b from-[#181108]/95 to-black/95 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.45)] backdrop-blur-md px-8 py-5 text-center">
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-200" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-200" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-200" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-200" />
              <p className="font-display tracking-[0.35em] text-amber-200 text-xs uppercase mb-1 drop-shadow-[0_0_8px_#f59e0b]">
                — Quest Cleared —
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                <span className="font-display text-yellow-300 text-sm tracking-widest drop-shadow-[0_0_6px_#fbbf24]">
                  +{completionToast.xp} XP
                </span>
                <span className="text-amber-500/60 text-xs">·</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* WINDOW 1: DAILY */}
        <QuestWindow
          title="DAILY"
          quests={dailyQuests}
          onToggle={handleToggleStatus}
          onDelete={handleDelete}
          emptyText="NO DAILY QUESTS ASSIGNED."
        />

        {/* WINDOW 2: WEEKLY */}
        <QuestWindow
          title="WEEKLY"
          quests={weeklyQuests}
          onToggle={handleToggleStatus}
          onDelete={handleDelete}
          emptyText="NO WEEKLY QUESTS ASSIGNED."
        />
      </div>

      {/* PROMINENT ASSIGN QUEST BUTTON */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => handleOpenModal()}
          className="group relative px-10 py-3.5 bg-black/75 border-2 border-amber-500/70 text-amber-200 font-display tracking-[0.25em] text-xs md:text-sm uppercase shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 hover:text-amber-100 hover:shadow-[0_0_35px_rgba(245,158,11,0.45)] transition-all overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            [ ASSIGN QUEST ]
          </span>

          {/* Golden hover scanline highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        </button>
      </div>

      {/* SYSTEM PENALTY WARNING BANNER */}
      <div className="mt-7 mb-4 flex justify-center">
        <div className="relative border border-red-800/60 bg-red-950/40 px-6 py-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] max-w-2xl text-center">
          <p className="text-red-400/90 font-display text-[10px] md:text-xs tracking-[0.2em] uppercase drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
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
                <div className="w-12 h-full border-l-4 border-t-4 border-amber-400 opacity-90 shadow-[0_0_15px_#f59e0b]" />
                <div className="flex-1 relative flex items-center justify-center h-full mx-2">
                  <div className="absolute w-full h-[3px] bg-amber-200 shadow-[0_0_20px_#f59e0b,0_0_40px_#d97706]" />
                </div>
                <div className="w-12 h-full border-r-4 border-t-4 border-amber-400 opacity-90 shadow-[0_0_15px_#f59e0b]" />
              </div>

              {/* MODAL BODY */}
              <div className="relative w-full bg-[#0c0805] border border-amber-600/50 p-6 md:p-8 shadow-[inset_0_0_60px_rgba(180,83,9,0.2),0_0_50px_rgba(0,0,0,0.85)] overflow-hidden">
                {/* Subtle parchment grid overlay */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(245,158,11,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.25) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* MODAL HEADER */}
                <div className="relative flex justify-between items-center pb-4 mb-6 border-b border-amber-600/30">
                  <div className="border border-amber-500/40 px-5 py-1.5 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)] bg-amber-950/30">
                    <h2 className="text-amber-100 font-display tracking-[0.25em] text-base md:text-lg uppercase drop-shadow-[0_0_10px_#f59e0b]">
                      Assign Quest
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-amber-400/70 hover:text-amber-200 font-display tracking-widest text-xs uppercase px-2 py-1 border border-amber-600/30 hover:border-amber-400 transition-colors"
                  >
                    [ Close ]
                  </button>
                </div>

                {/* ASSIGNMENT FORM */}
                <form onSubmit={handleAssignSubmit} className="space-y-6 relative z-10">
                  
                  {/* 1. QUEST DESCRIPTION */}
                  <div className="space-y-2">
                    <label className="block text-amber-400 font-display tracking-[0.2em] text-xs uppercase">
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
                      className="w-full bg-black/60 border border-amber-600/40 focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.3)] outline-none text-amber-100 font-body px-4 py-3 placeholder:text-amber-700/50 transition-all text-sm md:text-base"
                    />
                  </div>

                  {/* 2. QUEST TYPE SELECTION */}
                  <div className="space-y-2">
                    <label className="block text-amber-400 font-display tracking-[0.2em] text-xs uppercase">
                      [ Quest Classification ] <span className="text-amber-400/60 font-mono text-[10px]">(SELECT ONE)</span>
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
                                ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                : 'border-amber-900/40 bg-black/40 text-amber-400/50 hover:border-amber-500/40 hover:text-amber-300'
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
                    <label className="block text-amber-400 font-display tracking-[0.2em] text-xs uppercase">
                      [ Stat Attributes ] <span className="text-amber-400/60 font-mono text-[10px]">(AT LEAST ONE)</span>
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
                                : 'border-amber-950 bg-black/50 text-amber-400/40 hover:border-amber-800/60 hover:text-amber-300'
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
                  <div className="pt-4 flex justify-end gap-4 border-t border-amber-600/30">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 border border-amber-900/40 text-amber-400/60 hover:text-amber-300 font-display tracking-widest text-xs uppercase transition-colors"
                    >
                      [ Cancel ]
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border border-amber-300 text-black font-bold font-display tracking-[0.2em] text-xs uppercase shadow-[0_0_20px_#f59e0b] hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      [ Assign Quest ]
                    </button>
                  </div>
                </form>
              </div>

              {/* MODAL BOTTOM GLOW BAR */}
              <div className="relative w-full h-8 flex justify-between items-center mt-[-12px] z-20">
                <div className="w-12 h-full border-l-4 border-b-4 border-amber-400 opacity-90 shadow-[0_0_15px_#f59e0b]" />
                <div className="flex-1 relative flex items-center justify-center h-full mx-2">
                  <div className="absolute w-full h-[3px] bg-amber-200 shadow-[0_0_20px_#f59e0b,0_0_40px_#d97706]" />
                </div>
                <div className="w-12 h-full border-r-4 border-b-4 border-amber-400 opacity-90 shadow-[0_0_15px_#f59e0b]" />
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-20 w-full flex flex-col items-center"
    >
      {/* MAIN PANEL */}
      <div className="relative w-full bg-[#0a0604]/75 backdrop-blur-md border border-amber-600/35 p-6 md:p-8 shadow-[0_0_30px_rgba(217,119,6,0.12),inset_0_0_40px_rgba(0,0,0,0.8)] min-h-[380px] md:min-h-[420px] flex flex-col justify-between rounded-none group overflow-hidden">
        
        {/* Subtle warm glow background highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-black/40 pointer-events-none z-0" />

        <div className="relative z-10">
          {/* HEADER SECTION (Framed Title Box) */}
          <div className="relative flex flex-col items-center mb-6">
            <div className="border border-amber-500/50 bg-black/70 px-10 py-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <h2 className="text-amber-100 font-display tracking-[0.3em] text-sm md:text-base font-bold uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                {title}
              </h2>
            </div>
            {/* Subtle ornamental divider line under header box */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-600/30 to-transparent mt-4" />
          </div>

          {/* OBJECTIVES LIST */}
          <div className="space-y-3 font-body">
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
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-amber-200/60 font-display tracking-[0.25em] text-xs uppercase text-center">
                  {emptyText}
                </div>
                {/* Ornamental flourish matching Image 1 */}
                <div className="flex items-center justify-center gap-3 mt-4 text-amber-500/50">
                  <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-amber-500/40" />
                  <span className="text-xs">✦</span>
                  <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-amber-500/40" />
                </div>
              </div>
            )}
          </div>
        </div>
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
          ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-950/30'
          : 'hover:bg-amber-950/20 border-transparent hover:border-amber-500/50'
      }`}
    >
      <div className="flex items-start gap-3.5 relative z-10 flex-1 min-w-0">
        {/* Status Toggle Button: [ INCOMPLETE ] vs [ COMPLETE ] */}
        <button
          onClick={() => onToggle(quest)}
          className={`font-display tracking-[0.15em] text-xs uppercase whitespace-nowrap mt-0.5 transition-all flex-shrink-0 ${
            isCompleted
              ? 'text-emerald-400 hover:text-emerald-200 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
              : 'text-amber-400/90 hover:text-amber-200 hover:drop-shadow-[0_0_8px_#f59e0b]'
          }`}
        >
          {isCompleted ? '[ Complete ]' : '[ Incomplete ]'}
        </button>

        {/* Quest Info: Title & Stat Tags */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span
            className={`tracking-wide text-sm md:text-base leading-snug break-words transition-colors ${
              isCompleted
                ? 'text-amber-200/40 line-through'
                : isBoss
                ? 'text-red-500 font-bold italic drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                : 'text-amber-50 drop-shadow-[0_0_5px_rgba(245,158,11,0.25)]'
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
            isCompleted ? 'text-emerald-400 drop-shadow-[0_0_5px_#10b981]' : 'text-amber-400 drop-shadow-[0_0_5px_#f59e0b]'
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
