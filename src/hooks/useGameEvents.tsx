'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { GameEvent } from '@/types'

interface GameEventsContextType {
  events: GameEvent[]
  fireEvent: (event: GameEvent) => void
  dismissEvent: (index: number) => void
}

const GameEventsContext = createContext<GameEventsContextType | null>(null)

export function GameEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<GameEvent[]>([])

  const fireEvent = useCallback((event: GameEvent) => {
    setEvents((prev) => [...prev, event])
    // Auto-dismiss after 6s
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e !== event))
    }, 6000)
  }, [])

  const dismissEvent = useCallback((index: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <GameEventsContext.Provider value={{ events, fireEvent, dismissEvent }}>
      {children}
    </GameEventsContext.Provider>
  )
}

export function useGameEvents() {
  const ctx = useContext(GameEventsContext)
  if (!ctx) throw new Error('useGameEvents must be used within GameEventsProvider')
  return ctx
}
