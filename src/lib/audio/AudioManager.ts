/**
 * Life RPG — AudioManager (Howler.js singleton)
 *
 * Rules:
 * - Never autoplay on load — wait for user gesture (unlocked by Threshold screen)
 * - One loopable ambient bed per major page, crossfade 600ms on route change
 * - SFX fired async — never block UI
 * - Volume stored in localStorage (preference, not game data — explicitly exempt)
 * - Default to low-but-audible: 0.3 master
 */

import { Howl, Howler } from 'howler'

type AmbientPage = 'status' | 'quests' | 'shop' | 'gate'
type SFXName = 'complete' | 'levelup' | 'rankup' | 'click'

const VOLUME_KEY = 'life-rpg:volume'
const MUTED_KEY = 'life-rpg:muted'

const AMBIENT_SRCS: Record<AmbientPage, string> = {
  status: '/audio/ambient-status.wav',
  quests: '/audio/ambient-quests.wav',
  shop: '/audio/ambient-shop.wav',
  gate: '/audio/ambient-gate.wav',
}

const SFX_SRCS: Record<SFXName, string> = {
  complete: '/audio/sfx-complete.wav',
  levelup: '/audio/sfx-levelup.wav',
  rankup: '/audio/sfx-rankup.wav',
  click: '/audio/sfx-click.wav',
}

class AudioManagerClass {
  private unlocked = false
  private currentAmbient: Howl | null = null
  private currentAmbientKey: AmbientPage | null = null
  private sfxCache: Map<SFXName, Howl> = new Map()
  private volume = 0.3
  private muted = false

  constructor() {
    if (typeof window === 'undefined') return
    try {
      const storedVol = localStorage.getItem(VOLUME_KEY)
      const storedMuted = localStorage.getItem(MUTED_KEY)
      if (storedVol) this.volume = parseFloat(storedVol)
      if (storedMuted) this.muted = storedMuted === 'true'
    } catch {
      // localStorage unavailable
    }
  }

  /** Must be called on first user interaction — unlocks audio context */
  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    Howler.volume(this.muted ? 0 : this.volume)
  }

  /** Play ambient bed for a page, crossfading from any currently playing track */
  playAmbient(page: AmbientPage) {
    if (!this.unlocked) return
    if (this.currentAmbientKey === page && this.currentAmbient?.playing()) return

    const newHowl = new Howl({
      src: [AMBIENT_SRCS[page]],
      loop: true,
      volume: 0,
      html5: true, // streaming — don't preload entire file
      onloaderror: () => {
        // Audio files not present in dev — silently skip
      },
    })

    // Fade out old track
    if (this.currentAmbient) {
      const old = this.currentAmbient
      old.fade(old.volume(), 0, 600)
      setTimeout(() => old.stop(), 650)
    }

    // Fade in new track
    newHowl.play()
    newHowl.fade(0, this.muted ? 0 : this.volume * 0.7, 600)

    this.currentAmbient = newHowl
    this.currentAmbientKey = page
  }

  /** Stop ambient (e.g. during awakening sequence) */
  stopAmbient(fadeDuration = 600) {
    if (!this.currentAmbient) return
    const old = this.currentAmbient
    old.fade(old.volume(), 0, fadeDuration)
    setTimeout(() => old.stop(), fadeDuration + 50)
    this.currentAmbient = null
    this.currentAmbientKey = null
  }

  /** Fire a one-shot SFX — non-blocking */
  playSFX(name: SFXName) {
    if (!this.unlocked || this.muted) return

    let sfx = this.sfxCache.get(name)
    if (!sfx) {
      sfx = new Howl({
        src: [SFX_SRCS[name]],
        volume: name === 'levelup' || name === 'rankup' ? this.volume : this.volume * 0.6,
        onloaderror: () => {},
      })
      this.sfxCache.set(name, sfx)
    }
    sfx.play()
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    this.muted = false
    Howler.volume(this.volume)
    if (this.currentAmbient) {
      this.currentAmbient.volume(this.volume * 0.7)
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(this.volume))
      localStorage.setItem(MUTED_KEY, 'false')
    } catch {}
  }

  mute() {
    this.muted = true
    Howler.volume(0)
    try { localStorage.setItem(MUTED_KEY, 'true') } catch {}
  }

  unmute() {
    this.muted = false
    Howler.volume(this.volume)
    try { localStorage.setItem(MUTED_KEY, 'false') } catch {}
  }

  toggleMute() {
    this.muted ? this.unmute() : this.mute()
    return this.muted
  }

  isMuted() { return this.muted }
  getVolume() { return this.volume }
  isUnlocked() { return this.unlocked }
}

// Singleton — safe in SSR (lazy init)
let instance: AudioManagerClass | null = null
export function getAudioManager(): AudioManagerClass {
  if (!instance) instance = new AudioManagerClass()
  return instance
}

export type { AmbientPage, SFXName }
