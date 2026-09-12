'use client'

import { motion } from 'framer-motion'

interface StatItem {
  key: string
  label: string
  value: number
}

interface RadarChartProps {
  stats: StatItem[]
  maxVal?: number
}

export function RadarChart({ stats, maxVal }: RadarChartProps) {
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const radius = 75

  // Calculate dynamic max value for scaling
  const max = maxVal && maxVal > 0 ? maxVal * 1.25 : Math.max(...stats.map((s) => s.value), 10) * 1.2

  const numPoints = stats.length
  const angleStep = (2 * Math.PI) / numPoints

  // Grid concentric pentagons (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const getCoordinates = (index: number, level: number) => {
    const angle = -Math.PI / 2 + index * angleStep
    return {
      x: cx + radius * level * Math.cos(angle),
      y: cy + radius * level * Math.sin(angle),
    }
  }

  // Generate grid polygon paths
  const gridPaths = gridLevels.map((level) => {
    const points = stats.map((_, i) => {
      const { x, y } = getCoordinates(i, level)
      return `${x},${y}`
    })
    return points.join(' ')
  })

  // Generate stat polygon data points
  const dataPoints = stats.map((stat, i) => {
    const normalizedVal = Math.min(1, Math.max(0.15, stat.value / max))
    const { x, y } = getCoordinates(i, normalizedVal)
    return { x, y, value: stat.value, label: stat.label }
  })

  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Label anchor positions based on vertex angle
  const getLabelPos = (index: number): { x: number; y: number; textAnchor: 'start' | 'end' | 'middle' } => {
    const angle = -Math.PI / 2 + index * angleStep
    const labelRadius = radius + 24
    const x = cx + labelRadius * Math.cos(angle)
    const y = cy + labelRadius * Math.sin(angle)

    let textAnchor: 'start' | 'end' | 'middle' = 'middle'
    if (Math.abs(Math.cos(angle)) > 0.3) {
      textAnchor = Math.cos(angle) > 0 ? 'start' : 'end'
    }

    return { x, y, textAnchor }
  }

  return (
    <div className="flex flex-col items-center justify-center relative w-full py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
          </radialGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background glow */}
        <circle cx={cx} cy={cy} r={radius} fill="url(#radarGlow)" />

        {/* Grid Web Pentagons */}
        {gridPaths.map((path, idx) => (
          <polygon
            key={idx}
            points={path}
            fill="none"
            stroke="#06b6d4"
            strokeOpacity={idx === gridLevels.length - 1 ? 0.4 : 0.15}
            strokeWidth={idx === gridLevels.length - 1 ? 1.5 : 1}
            strokeDasharray={idx < gridLevels.length - 1 ? '3 3' : undefined}
          />
        ))}

        {/* Axis lines from center to outer vertices */}
        {stats.map((_, i) => {
          const outer = getCoordinates(i, 1)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#06b6d4"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
          )
        })}

        {/* Animated Data Polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          points={polygonPath}
          fill="rgba(6, 182, 212, 0.3)"
          stroke="#00f0ff"
          strokeWidth="2"
          filter="url(#neonGlow)"
        />

        {/* Vertex Glowing Dots */}
        {dataPoints.map((p, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
          >
            <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" filter="url(#neonGlow)" />
            <circle cx={p.x} cy={p.y} r="2" fill="#00f0ff" />
          </motion.g>
        ))}

        {/* Stat Labels and Values at Vertices */}
        {stats.map((stat, i) => {
          const { x, y, textAnchor } = getLabelPos(i)
          return (
            <g key={stat.key}>
              <text
                x={x}
                y={y - 4}
                textAnchor={textAnchor}
                className="fill-cyan-300 font-display text-[11px] font-bold tracking-widest"
              >
                {stat.label}
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor={textAnchor}
                className="fill-white font-mono text-[12px] font-bold drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]"
              >
                {stat.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
