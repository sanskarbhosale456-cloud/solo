'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAudioManager } from '@/lib/audio/AudioManager'

export function VolumeControl() {
  const [muted, setMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.3)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const am = getAudioManager()
    setMuted(am.isMuted())
    setVolumeState(am.getVolume())
  }, [])

  const handleToggleMute = useCallback(() => {
    const am = getAudioManager()
    const nowMuted = am.toggleMute()
    setMuted(nowMuted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    const am = getAudioManager()
    am.setVolume(v)
    setVolumeState(v)
    setMuted(false)
  }, [])

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-40 flex items-center gap-2">
      {/* Volume slider (shown on hover/focus) */}
      {visible && (
        <div className="panel flex items-center gap-2 px-3 py-2">
          <label htmlFor="volume-slider" className="sr-only">Volume</label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 accent-glow-sky h-1 cursor-pointer"
            aria-label="Audio volume"
          />
        </div>
      )}

      {/* Mute button */}
      <button
        onClick={handleToggleMute}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        aria-pressed={muted}
        className="panel w-8 h-8 flex items-center justify-center text-white/40 hover:text-glow-sky transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow rounded"
      >
        {muted || volume === 0 ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : volume < 0.5 ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>
    </div>
  )
}
