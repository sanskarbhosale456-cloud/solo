import type { Rank } from '@/types'

interface RankBadgeProps {
  rank: Rank
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const RANK_COLORS: Record<Rank, string> = {
  E: '#9CA3AF',
  D: '#6EE7B7',
  C: '#93C5FD',
  B: '#C084FC',
  A: '#FCD34D',
  S: '#F97316',
}

const SIZES = {
  sm: { outer: 32, inner: 26, font: 11 },
  md: { outer: 48, inner: 40, font: 16 },
  lg: { outer: 72, inner: 60, font: 24 },
}

export function RankBadge({ rank, size = 'md', className = '' }: RankBadgeProps) {
  const color = RANK_COLORS[rank]
  const { outer, inner, font } = SIZES[size]

  return (
    <svg
      width={outer}
      height={outer}
      viewBox="0 0 100 100"
      aria-label={`${rank}-Rank Hunter`}
      role="img"
      className={className}
      style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
    >
      {/* Outer hexagon */}
      <polygon
        points="50,4 93,27 93,73 50,96 7,73 7,27"
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.9"
      />
      {/* Inner hexagon */}
      <polygon
        points="50,14 83,32 83,68 50,86 17,68 17,32"
        fill={`${color}12`}
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Rank letter */}
      <text
        x="50"
        y="57"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={font}
        fontFamily="Orbitron, sans-serif"
        fontWeight="700"
        letterSpacing="2"
      >
        {rank}
      </text>
      {/* Corner accents */}
      <line x1="50" y1="4" x2="50" y2="10" stroke={color} strokeWidth="2" opacity="0.7" />
      <line x1="50" y1="90" x2="50" y2="96" stroke={color} strokeWidth="2" opacity="0.7" />
    </svg>
  )
}
