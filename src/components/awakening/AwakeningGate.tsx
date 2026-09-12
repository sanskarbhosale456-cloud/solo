'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

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

function GateModel() {
  const { scene } = useGLTF('/gate.glb')
  return (
    <primitive 
      object={scene} 
      position={[0, -1, 0]} 
      scale={4.5} 
    />
  )
}

useGLTF.preload('/gate.glb')

export function AwakeningGate({ onComplete }: AwakeningGateProps) {
  const [showText, setShowText] = useState(true)
  const [isEntering, setIsEntering] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowText(false), 4500)
    return () => clearTimeout(timer)
  }, [])

  const handleEnterClick = () => {
    setIsEntering(true)
    setTimeout(() => {
      onComplete()
    }, 1500)
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
                  >
                    ENTER
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
