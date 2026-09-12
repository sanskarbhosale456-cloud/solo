'use client'

import { useState, useEffect } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let addToast: ((message: string, type?: Toast['type']) => void) | null = null

export function toast(message: string, type: Toast['type'] = 'info') {
  addToast?.(message, type)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToast = (message, type = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }
    return () => { addToast = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto panel px-4 py-3 text-sm font-body flex items-center gap-2
            ${t.type === 'error' ? 'border-danger/40 text-danger' : t.type === 'success' ? 'border-glow-sky/40 text-glow-sky' : 'text-white/80'}`}
          style={{ animation: 'toastSlide 300ms ease-out forwards' }}
        >
          {t.type === 'error' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
            </svg>
          )}
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes toastSlide {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
