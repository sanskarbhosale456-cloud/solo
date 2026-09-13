'use client'

import { useState, useEffect, Suspense, Component, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getAudioManager } from '@/lib/audio/AudioManager'

interface AwakeningGateProps {
  onComplete: () => void
}

function CameraController({ isEntering }: { isEntering: boolean }) {
  useFrame((state, delta) => {
    if (isEntering) {
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, -5, delta * 3)
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.5, delta * 3)
    }
  })
  return null
}

export function ElectricSparks({ opacity = 1 }: { opacity?: number }) {
  const [particles, setParticles] = useState<any[]>([])

  useEffect(() => {
    // Generate random particles only on the client to avoid SSR hydration mismatch
    const generated = Array.from({ length: 60 }).map(() => ({
      width: Math.random() * 2 + 1,
      height: Math.random() * 20 + 10,
      left: Math.random() * 100,
      duration: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 2
    }))
    setParticles(generated)
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{ 
            y: "-10vh", 
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: Infinity }}
          className="absolute bg-white"
          style={{
            width: p.width,
            height: p.height,
            left: `${p.left}%`,
            boxShadow: `0 0 15px 4px rgba(0, 240, 255, 0.9)`,
          }}
        />
      ))}
    </div>
  )
}

function ProceduralGate() {
  const groupRef = useRef<THREE.Group>(null!)
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  
  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.4
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.6
  })

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Rotating Outer Gate Arch */}
      <mesh ref={ring1Ref} position={[0, 3, 0]}>
        <torusGeometry args={[4, 0.25, 16, 64]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={2.5} wireframe />
      </mesh>

      {/* Rotating Inner Mana Ring */}
      <mesh ref={ring2Ref} position={[0, 3, 0]}>
        <torusGeometry args={[3.5, 0.1, 16, 64]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={3} />
      </mesh>

      {/* Portal Energy Disc */}
      <mesh position={[0, 3, 0]}>
        <circleGeometry args={[3.4, 32]} />
        <meshBasicMaterial color="#00d8ff" opacity={0.35} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Left Monolith Pillar */}
      <mesh position={[-4.5, 2.5, 0]}>
        <boxGeometry args={[0.8, 8, 0.8]} />
        <meshStandardMaterial color="#0a1020" emissive="#0055ff" emissiveIntensity={0.6} />
      </mesh>

      {/* Right Monolith Pillar */}
      <mesh position={[4.5, 2.5, 0]}>
        <boxGeometry args={[0.8, 8, 0.8]} />
        <meshStandardMaterial color="#0a1020" emissive="#0055ff" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

class GateErrorBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: any) {
    console.warn('GLTF gate model fallback activated:', err)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function SafeGLTFGate() {
  const { scene } = useGLTF('/gate.glb')
  return <primitive object={scene} position={[0, -1, 0]} scale={4.5} />
}

function GateModel() {
  return (
    <GateErrorBoundary fallback={<ProceduralGate />}>
      <SafeGLTFGate />
    </GateErrorBoundary>
  )
}

try {
  useGLTF.preload('/gate.glb')
} catch {}

export function AwakeningGate({ onComplete }: AwakeningGateProps) {
  const [showText, setShowText] = useState(true)
  const [isEntering, setIsEntering] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowText(false), 4500)

    // Attempt immediate playback upon entering the website
    getAudioManager().playWebsiteIntro()

    // Browser policy fallback: If browser blocks unprompted autoplay before user interaction,
    // immediately trigger on the first touch/click/key anywhere on the page
    const unlockAndPlay = () => {
      getAudioManager().playWebsiteIntro()
      window.removeEventListener('pointerdown', unlockAndPlay)
      window.removeEventListener('click', unlockAndPlay)
      window.removeEventListener('keydown', unlockAndPlay)
      window.removeEventListener('touchstart', unlockAndPlay)
    }

    window.addEventListener('pointerdown', unlockAndPlay, { once: true })
    window.addEventListener('click', unlockAndPlay, { once: true })
    window.addEventListener('keydown', unlockAndPlay, { once: true })
    window.addEventListener('touchstart', unlockAndPlay, { once: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', unlockAndPlay)
      window.removeEventListener('click', unlockAndPlay)
      window.removeEventListener('keydown', unlockAndPlay)
      window.removeEventListener('touchstart', unlockAndPlay)
    }
  }, [])

  const handleEnterClick = () => {
    try {
      getAudioManager().playWebsiteIntro()
    } catch {
      try {
        const audio = new Audio('/audio/websiteIntro.mp3')
        audio.volume = 0.85
        audio.play().catch(() => {})
      } catch {}
    }

    setIsEntering(true)
    setTimeout(() => {
      onComplete()
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-[200] w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      
      <AnimatePresence>
        {isEntering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }} 
            className="absolute inset-0 bg-white z-[300] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <ElectricSparks />

      <AnimatePresence>
        {showText ? (
          <motion.h1 
            key="awakening-text"
            initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.1em", filter: "blur(10px)" }}
            animate={{ 
              opacity: [0, 1, 0.4, 1, 0.8, 1], 
              scale: 1, 
              letterSpacing: "0.3em", 
              filter: "blur(0px)" 
            }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ 
              duration: 4, 
              opacity: { times: [0, 0.1, 0.15, 0.2, 0.3, 1], duration: 4 },
              ease: "easeOut" 
            }}
            className="text-white text-5xl md:text-7xl font-bold uppercase absolute z-10"
            style={{ 
              fontFamily: '"Cinzel", serif',
              textShadow: "0px 0px 10px #ffffff, 0px 0px 30px #00f0ff, 0px 0px 60px #00aaff, 0px 0px 100px #0055ff"
            }}
          >
            Awakening
          </motion.h1>
        ) : (
          <motion.div 
            key="gate-model"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="w-full h-full relative z-10"
          >
            <Canvas camera={{ position: [0, 2, 12], fov: 50 }}>
              <ambientLight intensity={0.5} color="#0055ff" />
              <directionalLight position={[5, 10, 5]} intensity={2} color="#ffffff" />
              <pointLight position={[0, 3, 2]} intensity={150} color="#00f0ff" />
              
              <CameraController isEntering={isEntering} />
              <Suspense fallback={null}>
                <GateModel />
              </Suspense>
            </Canvas>

            <AnimatePresence>
              {!isEntering && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="absolute bottom-20 w-full flex justify-center z-50"
                >
                  <button 
                    onClick={handleEnterClick}
                    className="btn-lightning px-14 py-4 uppercase tracking-[0.4em] font-bold text-xl transition-all duration-300 cursor-pointer rounded-sm"
                    aria-label="Start Awakening"
                  >
                    START
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
