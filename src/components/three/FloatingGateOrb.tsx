'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FloatingGate() {
  const groupRef = useRef<THREE.Group>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const clock = useRef(0)

  // Icosahedron geometry for the gate core
  const outerGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), [])
  const innerGeo = useMemo(() => new THREE.IcosahedronGeometry(0.75, 0), [])
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.8, 0.012, 8, 48), [])

  const outerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#3B82F6'),
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  }), [])

  const innerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#8B5CF6'),
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  }), [])

  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7DD3FC'),
    transparent: true,
    opacity: 0.6,
  }), [])

  useFrame((_, delta) => {
    clock.current += delta
    const t = clock.current

    // Outer: slow Y rotation + gentle float
    groupRef.current.rotation.y = t * 0.18
    groupRef.current.rotation.x = Math.sin(t * 0.23) * 0.1
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.12

    // Inner: faster, counter-rotate
    innerRef.current.rotation.x = t * 0.35
    innerRef.current.rotation.z = -t * 0.22
  })

  return (
    <group ref={groupRef}>
      {/* Outer icosahedron */}
      <mesh geometry={outerGeo} material={outerMat} />
      {/* Inner icosahedron — counter-rotating */}
      <mesh ref={innerRef} geometry={innerGeo} material={innerMat} />
      {/* Equatorial ring */}
      <mesh geometry={ringGeo} material={ringMat} rotation={[Math.PI / 2, 0, 0]} />
      {/* Second ring — tilted */}
      <mesh geometry={ringGeo} material={ringMat} rotation={[Math.PI / 4, 0, Math.PI / 3]} />
      {/* Core glow point */}
      <pointLight color="#3B82F6" intensity={2} distance={4} decay={2} />
    </group>
  )
}

/**
 * Floating gate 3D orb — used as a decorative hero on the stats page
 * and the Shadow Army page.
 */
export function FloatingGateOrb({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <FloatingGate />
      </Canvas>
    </div>
  )
}
