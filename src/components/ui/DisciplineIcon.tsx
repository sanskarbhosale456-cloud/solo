import type { Discipline } from '@/types'

interface DisciplineIconProps {
  discipline: Discipline
  size?: number
  className?: string
}

import Image from 'next/image'

// Emoji-style colored icons matching user reference images
const ICONS: Record<Discipline, React.FC<{ size: number }>> = {
  intellect: ({ size }) => (
    <Image src="/icons/intellect.jpg" alt="Intellect" width={size} height={size} className="rounded-full object-cover shadow-lg" />
  ),
  strength: ({ size }) => (
    <Image src="/icons/strength.jpg" alt="Strength" width={size} height={size} className="rounded-full object-cover shadow-lg" />
  ),
  agility: ({ size }) => (
    <Image src="/icons/agility.jpg" alt="Agility" width={size} height={size} className="rounded-full object-cover shadow-lg" />
  ),
  vitality: ({ size }) => (
    <Image src="/icons/vitality.jpg" alt="Vitality" width={size} height={size} className="rounded-full object-cover shadow-lg" />
  ),
  perception: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
