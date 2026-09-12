import type { Discipline } from '@/types'

interface DisciplineIconProps {
  discipline: Discipline
  size?: number
  className?: string
}

const ICONS: Record<Discipline, React.FC<{ size: number }>> = {
  intellect: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  ),
  strength: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L12 22M8 6L16 6M8 18L16 18" />
      <rect x="6" y="10" width="12" height="4" />
    </svg>
  ),
  agility: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4,14 8,6 12,16 16,4 20,12" />
    </svg>
  ),
  vitality: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  perception: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
    </svg>
  ),
}

const DISCIPLINE_COLORS: Record<Discipline, string> = {
  intellect: '#93C5FD',
  strength: '#F97316',
  agility: '#6EE7B7',
  vitality: '#F472B6',
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
