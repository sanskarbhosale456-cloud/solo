'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
  count?: number
  color?: string
  opacity?: number
  className?: string
}

function Particles({ count, color }: { count: number; color: string }) {
  const mesh = useRef<THREE.Points>(null!)
  const clock = useRef(0)

  // Generate random positions and velocities once, stored in refs
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return pos
  }, [count])

  const velocities = useRef<Float32Array | null>(null)
  if (!velocities.current) {
    velocities.current = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      velocities.current[i * 3]     = (Math.random() - 0.5) * 0.002
      velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      velocities.current[i * 3 + 2] = 0
    }
  }

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  const material = useMemo(() => new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.04,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  }), [color])

  useFrame((_, delta) => {
    clock.current += delta
    const vel = velocities.current!
    const pos = mesh.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3]     += vel[i * 3]
      pos[i * 3 + 1] += vel[i * 3 + 1]
      // Wrap around edges
      if (pos[i * 3] > 10)  pos[i * 3] = -10
      if (pos[i * 3] < -10) pos[i * 3] = 10
      if (pos[i * 3 + 1] > 6)  pos[i * 3 + 1] = -6
      if (pos[i * 3 + 1] < -6) pos[i * 3 + 1] = 6
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
    // Slow drift rotation
    mesh.current.rotation.z = Math.sin(clock.current * 0.05) * 0.1
  })

  return <points ref={mesh} geometry={geometry} material={material} />
}

/**
 * Ambient particle field background — renders behind page content.
 * Respects prefers-reduced-motion: passes count=0 which renders nothing.
 */
export function ParticleField({ count = 300, color = '#3B82F6', opacity = 0.5, className = '' }: ParticleFieldProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Particles count={count} color={color} />
      </Canvas>
    </div>
  )
}
