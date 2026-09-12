'use client'

import Tilt from 'react-parallax-tilt'
import { DisciplineIcon } from '@/components/ui/DisciplineIcon'
import type { Quest, Difficulty } from '@/types'

interface QuestCardProps {
  quest: Quest
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
  isPending?: boolean
  className?: string
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  E: 'text-rank-e border-rank-e',
  D: 'text-rank-d border-rank-d',
  C: 'text-rank-c border-rank-c',
  B: 'text-rank-b border-rank-b',
  A: 'text-rank-a border-rank-a',
  S: 'text-rank-s border-rank-s',
}

const DIFFICULTY_GLOW: Record<Difficulty, string> = {
  E: 'rgba(156,163,175,0.2)',
  D: 'rgba(110,231,183,0.2)',
  C: 'rgba(147,197,253,0.2)',
  B: 'rgba(192,132,252,0.2)',
  A: 'rgba(252,211,77,0.2)',
  S: 'rgba(249,115,22,0.2)',
}

export function QuestCard({ quest, onComplete, onDelete, isPending, className = '' }: QuestCardProps) {
  const glowColor = DIFFICULTY_GLOW[quest.difficulty]

  return (
    <Tilt
      tiltMaxAngleX={4}
      tiltMaxAngleY={6}
      glareEnable
      glareMaxOpacity={0.06}
      glareColor="#3B82F6"
      glarePosition="bottom"
      scale={1.01}
      transitionSpeed={600}
      className={className}
    >
      <div
        className="panel panel-hover p-5 h-full flex flex-col gap-3"
        style={{
          boxShadow: `0 0 0 1px rgba(59,130,246,0.12), 0 8px 24px ${glowColor}`,
          transition: 'box-shadow 300ms ease',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <DisciplineIcon discipline={quest.discipline} size={16} className="flex-shrink-0" />
            <h3 className="font-body text-sm text-white/90 leading-snug line-clamp-2">
              {quest.title}
            </h3>
          </div>
          <span className={`diff-badge flex-shrink-0 text-xs ${DIFFICULTY_COLORS[quest.difficulty]}`}>
            {quest.difficulty}
          </span>
        </div>

        {/* Description */}
        {quest.description && (
          <p className="font-body text-xs text-white/40 leading-relaxed line-clamp-2">
            {quest.description}
          </p>
        )}

        {/* Due date */}
        {quest.due_date && (
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{new Date(quest.due_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Rewards + actions */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-glow/10">
          <div className="flex gap-3 text-xs">
            <span className="text-glow-sky font-display">+{quest.xp_reward} XP</span>
            <span className="text-gold font-display">+{quest.gold_reward}G</span>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => onDelete(quest.id)}
                aria-label={`Abandon: ${quest.title}`}
                className="text-white/20 hover:text-danger transition-colors p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            {onComplete && (
              <button
                onClick={() => onComplete(quest.id)}
                disabled={isPending}
                aria-label={`Complete: ${quest.title}`}
                aria-busy={isPending}
                className="btn btn-primary text-xs px-2.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow disabled:opacity-50"
              >
                {isPending ? (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'CLEAR'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Tilt>
  )
}
