import type { Discipline } from '@/types'

interface DisciplineIconProps {
  discipline: Discipline
  size?: number
  className?: string
}

import Image from 'next/image'

const ICONS: Record<Discipline, React.FC<{ size: number }>> = {
  intellect: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  ),
  strength: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  ),
  agility: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  vitality: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  perception: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
}

const DISCIPLINE_COLORS: Record<Discipline, string> = {
  intellect: '#FFB6C1',
  strength: '#FFD700',
  agility: '#5588FF',
  vitality: '#E0323C',
  perception: '#C084FC',
}

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  intellect: 'Intellect',
  strength: 'Strength',
  agility: 'Agility',
  vitality: 'Vitality',
  perception: 'Perception',
}

export function DisciplineIcon({ discipline, size = 16, className = '' }: DisciplineIconProps) {
  const Icon = ICONS[discipline]
  const color = DISCIPLINE_COLORS[discipline]
  const label = DISCIPLINE_LABELS[discipline]

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color }}
      title={label}
      aria-label={label}
    >
      <Icon size={size} />
    </span>
  )
}

export { DISCIPLINE_COLORS, DISCIPLINE_LABELS }
