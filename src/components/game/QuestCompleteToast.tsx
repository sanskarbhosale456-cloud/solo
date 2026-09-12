'use client'

import type { CompleteQuestResult } from '@/types'

export function QuestCompleteToast({ payload }: { payload: CompleteQuestResult }) {
  return (
    <div
      role="status"
      className="pointer-events-auto panel px-4 py-3 flex items-center gap-3 min-w-[220px]"
      style={{ animation: 'toastIn 300ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      {/* Check stamp */}
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-glow-sky" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <div className="font-display text-xs text-glow-sky tracking-wider">QUEST CLEARED</div>
        <div className="font-body text-xs text-white/60 mt-0.5">
          +{payload.xp_gained} XP &nbsp;·&nbsp; +{payload.gold_gained} Gold
        </div>
      </div>
      <style>{`
        @keyframes toastIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
