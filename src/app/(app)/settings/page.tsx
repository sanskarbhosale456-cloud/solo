'use client'

import { useHasAwakened } from '@/hooks/useHasAwakened'
import { getAudioManager } from '@/lib/audio/AudioManager'
import { useState } from 'react'

export default function SettingsPage() {
  const { hasAwakened, resetAwakened } = useHasAwakened()
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    return getAudioManager().isMuted()
  })
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.3
    return getAudioManager().getVolume()
  })

  function handleReplayAwakening() {
    if (!confirm('This will replay the opening sequence next time you visit the login page. Continue?')) return
    resetAwakened()
  }

  function handleMuteToggle() {
    const am = getAudioManager()
    const nowMuted = am.toggleMute()
    setMuted(nowMuted)
  }

  function handleVolumeChange(v: number) {
    const am = getAudioManager()
    am.setVolume(v)
    setVolume(v)
    setMuted(false)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-xl">
      <div className="mb-6">
        <div className="font-display text-xs text-glow-sky/60 tracking-[0.3em] uppercase mb-1">CONFIGURATION</div>
        <h1 className="font-display text-2xl text-white tracking-wider">SETTINGS</h1>
      </div>

      <div className="space-y-4">
        {/* Audio section */}
        <section className="panel p-5" aria-label="Audio settings">
          <h2 className="font-display text-xs text-glow-sky tracking-widest uppercase mb-4">AUDIO</h2>

          <div className="space-y-4">
            {/* Master volume */}
            <div>
              <label
                htmlFor="settings-volume"
                className="flex items-center justify-between font-display text-xs text-white/60 tracking-widest uppercase mb-2"
              >
                <span>Master Volume</span>
                <span className="text-glow-sky">{Math.round(volume * 100)}%</span>
              </label>
              <input
                id="settings-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-glow-sky h-1 cursor-pointer"
              />
            </div>

            {/* Mute toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="settings-mute" className="font-display text-xs text-white/60 tracking-widest uppercase">
                Mute All Audio
              </label>
              <button
                id="settings-mute"
                role="switch"
                aria-checked={muted}
                onClick={handleMuteToggle}
                className={`relative w-10 h-5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-glow ${
                  muted ? 'bg-danger/40' : 'bg-glow/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    muted ? 'translate-x-0.5' : 'translate-x-5'
                  }`}
                />
                <span className="sr-only">{muted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Gameplay section */}
        <section className="panel p-5" aria-label="Gameplay settings">
          <h2 className="font-display text-xs text-glow-sky tracking-widest uppercase mb-4">GAMEPLAY</h2>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs text-white/60 tracking-widest uppercase">
                Opening Sequence
              </p>
              <p className="font-body text-xs text-white/30 mt-1">
                {hasAwakened
                  ? 'Awakening sequence has been completed.'
                  : 'Awakening sequence is pending — shown on next login.'}
              </p>
            </div>
            <button
              onClick={handleReplayAwakening}
              className="btn btn-ghost text-xs flex-shrink-0"
              disabled={!hasAwakened}
              aria-label="Replay awakening sequence"
            >
              REPLAY
            </button>
          </div>
        </section>

        {/* About section */}
        <section className="panel p-5" aria-label="About">
          <h2 className="font-display text-xs text-glow-sky tracking-widest uppercase mb-3">SYSTEM INFO</h2>
          <dl className="space-y-2 text-xs font-body">
            <div className="flex justify-between">
              <dt className="text-white/40">Version</dt>
              <dd className="text-white/70 font-display">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/40">Interface</dt>
              <dd className="text-white/70">THE SYSTEM v2.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/40">Source</dt>
              <dd>
                <a
                  href="https://github.com/YOUR_USERNAME/life-rpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-glow-sky hover:text-glow transition-colors"
                >
                  GitHub ↗
                </a>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
