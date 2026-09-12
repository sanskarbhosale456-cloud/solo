'use client'

import { useGameEvents } from '@/hooks/useGameEvents'
import { LevelUpOverlay } from './LevelUpOverlay'
import { RankUpOverlay } from './RankUpOverlay'
import { QuestCompleteToast } from './QuestCompleteToast'

export function GameOverlays() {
  const { events, dismissEvent } = useGameEvents()

  const levelUpEvent = events.find((e) => e.type === 'level_up')
  const rankUpEvent = events.find((e) => e.type === 'rank_up')
  const completeEvents = events.filter((e) => e.type === 'quest_complete')

  return (
    <>
      {/* Rank-up takes priority over level-up */}
      {rankUpEvent && (
        <RankUpOverlay
          payload={rankUpEvent.payload}
          onDismiss={() => dismissEvent(events.indexOf(rankUpEvent))}
        />
      )}
      {!rankUpEvent && levelUpEvent && (
        <LevelUpOverlay
          payload={levelUpEvent.payload}
          onDismiss={() => dismissEvent(events.indexOf(levelUpEvent))}
        />
      )}
      {/* Quest complete toasts */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {completeEvents.slice(0, 3).map((e, i) => (
          <QuestCompleteToast key={i} payload={e.payload} />
        ))}
      </div>
    </>
  )
}
