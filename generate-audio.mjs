/**
 * Life RPG — Procedural Audio Generator
 * Generates all 8 required audio files as .wav (then converts to .webm in browser)
 *
 * Usage: node generate-audio.mjs
 * Output: public/audio/*.wav
 *
 * No npm deps — pure Node.js Buffer manipulation.
 * Each file is a 16-bit PCM mono WAV at 44100 Hz.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'public', 'audio')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const SAMPLE_RATE = 44100
const MAX_INT16 = 32767

// ── Helpers ──────────────────────────────────────────────────────────────────

function sine(t, freq) {
  return Math.sin(2 * Math.PI * freq * t)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function envelope(t, dur, attack = 0.01, decay = 0.1, sustain = 0.7, release = 0.2) {
  const a = attack * dur
  const d = decay * dur
  const r = release * dur
  const s = dur - a - d - r

  if (t < a) return t / a
  if (t < a + d) return lerp(1, sustain, (t - a) / d)
  if (t < a + d + s) return sustain
  const rt = t - (a + d + s)
  return Math.max(0, sustain * (1 - rt / r))
}

function noise() {
  return Math.random() * 2 - 1
}

// Write WAV file from Float32Array of samples in [-1, 1]
function writeWav(filename, samples) {
  const numSamples = samples.length
  const numChannels = 1
  const bitsPerSample = 16
  const blockAlign = numChannels * (bitsPerSample / 8)
  const byteRate = SAMPLE_RATE * blockAlign
  const dataSize = numSamples * blockAlign
  const headerSize = 44

  const buffer = Buffer.alloc(headerSize + dataSize)
  let offset = 0

  // RIFF header
  buffer.write('RIFF', offset); offset += 4
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4
  buffer.write('WAVE', offset); offset += 4

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4
  buffer.writeUInt32LE(16, offset); offset += 4         // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2          // PCM
  buffer.writeUInt16LE(numChannels, offset); offset += 2
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4
  buffer.writeUInt32LE(byteRate, offset); offset += 4
  buffer.writeUInt16LE(blockAlign, offset); offset += 2
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2

  // data chunk
  buffer.write('data', offset); offset += 4
  buffer.writeUInt32LE(dataSize, offset); offset += 4

  for (let i = 0; i < numSamples; i++) {
    const s = clamp(Math.round(samples[i] * MAX_INT16), -MAX_INT16, MAX_INT16)
    buffer.writeInt16LE(s, offset)
    offset += 2
  }

  const filepath = path.join(OUT_DIR, filename)
  fs.writeFileSync(filepath, buffer)
  console.log(`✓ ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

function makeSamples(durationSecs, fn) {
  const n = Math.ceil(SAMPLE_RATE * durationSecs)
  const arr = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    arr[i] = fn(i / SAMPLE_RATE, i)
  }
  return arr
}

// ── SFX: Quest Complete ───────────────────────────────────────────────────────
// Short rising arpeggio: C5 → E5 → G5 → C6
{
  const notes = [523.25, 659.25, 783.99, 1046.5]
  const noteDur = 0.08
  const totalDur = notes.length * noteDur + 0.15

  const samples = makeSamples(totalDur, (t) => {
    let out = 0
    for (let ni = 0; ni < notes.length; ni++) {
      const st = ni * noteDur
      const lt = t - st
      if (lt >= 0 && lt < noteDur + 0.12) {
        const env = envelope(lt, noteDur + 0.12, 0.005, 0.05, 0.6, 0.4)
        out += env * sine(t, notes[ni]) * 0.35
        // slight 2nd harmonic
        out += env * sine(t, notes[ni] * 2) * 0.08
      }
    }
    return clamp(out, -1, 1)
  })

  writeWav('sfx-complete.wav', samples)
}

// ── SFX: Level Up ─────────────────────────────────────────────────────────────
// Triumphant 5-note ascending fanfare + shimmer
{
  const dur = 1.4
  const fanfareFreqs = [392, 523.25, 659.25, 783.99, 1046.5]
  const fanfareStarts = [0, 0.12, 0.24, 0.36, 0.5]

  const samples = makeSamples(dur, (t) => {
    let out = 0
    for (let i = 0; i < fanfareFreqs.length; i++) {
      const st = fanfareStarts[i]
      const lt = t - st
      const nd = 0.55
      if (lt >= 0 && lt < nd) {
        const env = envelope(lt, nd, 0.005, 0.1, 0.7, 0.2)
        out += env * (
          sine(t, fanfareFreqs[i]) * 0.35 +
          sine(t, fanfareFreqs[i] * 1.5) * 0.12 +
          sine(t, fanfareFreqs[i] * 2) * 0.06
        )
      }
    }
    // Shimmer: fast modulated high freq
    const shimmer = sine(t, 2800 + 300 * sine(t, 8)) * 0.06 *
      envelope(t, dur, 0.3, 0.2, 0.5, 0.3)
    out += shimmer

    return clamp(out * 0.6, -1, 1)
  })

  writeWav('sfx-levelup.wav', samples)
}

// ── SFX: Rank Up ──────────────────────────────────────────────────────────────
// Deep cinematic boom + ascending choir swell
{
  const dur = 2.5
  const chordFreqs = [130.81, 196, 261.63, 329.63, 392, 523.25]

  const samples = makeSamples(dur, (t) => {
    let out = 0

    // Deep sub boom
    const boomFreq = 60 * Math.pow(0.3, t * 4)
    const boomEnv = Math.max(0, 1 - t * 3)
    out += sine(t, boomFreq) * boomEnv * 0.4

    // Choir chord swells in
    for (const freq of chordFreqs) {
      const phase = Math.random() * 0.1 // slight detuning per partial
      const vib = 1 + 0.003 * sine(t, 5.5 + phase)
      const chordEnv = envelope(t, dur, 0.3, 0.1, 0.8, 0.2)
      out += chordEnv * sine(t, freq * vib) * (0.15 / chordFreqs.length)
      out += chordEnv * sine(t, freq * 2 * vib) * (0.06 / chordFreqs.length)
    }

    // Noise burst at start
    out += noise() * Math.max(0, 0.1 - t * 3) * 0.3

    return clamp(out, -1, 1)
  })

  writeWav('sfx-rankup.wav', samples)
}

// ── SFX: Click ────────────────────────────────────────────────────────────────
// Crisp, short UI click
{
  const dur = 0.06
  const samples = makeSamples(dur, (t) => {
    const env = Math.max(0, 1 - t / dur)
    return env * (
      sine(t, 2200) * 0.5 +
      sine(t, 3100) * 0.2 +
      noise() * 0.05
    )
  })
  writeWav('sfx-click.wav', samples)
}

// ── Ambient: Status (dashboard) ───────────────────────────────────────────────
// Low drone with slow harmonic movement — 8s loop
{
  const dur = 8
  const base = 55 // A1

  const samples = makeSamples(dur, (t) => {
    const lfo1 = sine(t, 0.18)
    const lfo2 = sine(t, 0.07)

    const drone = (
      sine(t, base * (1 + 0.002 * lfo1)) * 0.25 +
      sine(t, base * 2 * (1 + 0.001 * lfo2)) * 0.12 +
      sine(t, base * 3) * 0.05 +
      sine(t, base * 4) * 0.03
    )

    // Subtle pads — filter sweep
    const padFreq = 220 * (1 + 0.1 * sine(t, 0.05))
    const pad = sine(t, padFreq) * 0.06 * (0.5 + 0.5 * sine(t, 0.12))

    // Soft noise bed (wind texture)
    const windEnv = 0.3 + 0.7 * sine(t, 0.09)
    const wind = noise() * 0.018 * windEnv

    return clamp(drone + pad + wind, -1, 1)
  })

  writeWav('ambient-status.wav', samples)
}

// ── Ambient: Quests (quest log) ────────────────────────────────────────────────
// Slightly more tense — minor key, pulsing rhythm, 8s loop
{
  const dur = 8
  const base = 65.41 // C2

  const samples = makeSamples(dur, (t) => {
    // Pulse every 2s
    const pulsePhase = (t % 2) / 2
    const pulseEnv = Math.exp(-pulsePhase * 4) * 0.5

    const drone = (
      sine(t, base) * (0.2 + pulseEnv) +
      sine(t, base * 1.5) * 0.1 +  // minor 5th
      sine(t, base * 1.783) * 0.06  // flat 7th
    )

    // High tension shimmer
    const shimmer = sine(t, 880 + 40 * sine(t, 0.13)) * 0.04 *
      (0.4 + 0.6 * sine(t, 0.06))

    const wind = noise() * 0.015

    return clamp(drone + shimmer + wind, -1, 1)
  })

  writeWav('ambient-quests.wav', samples)
}

// ── Ambient: Shop ──────────────────────────────────────────────────────────────
// Warmer, more curious — light arpeggiated tones, 10s loop
{
  const dur = 10
  const scale = [261.63, 293.66, 329.63, 392, 440, 523.25] // C major

  const samples = makeSamples(dur, (t) => {
    let out = 0

    // Soft arpeggio — one note every ~1.2s
    const arpIdx = Math.floor((t % (dur)) / 1.65) % scale.length
    const arpT = (t % 1.65) / 1.65
    if (arpT < 0.5) {
      const env = envelope(arpT, 0.5, 0.01, 0.05, 0.6, 0.35)
      out += env * sine(t, scale[arpIdx]) * 0.12
      out += env * sine(t, scale[arpIdx] * 2) * 0.05
    }

    // Warm pad
    const pad = sine(t, 130.81 * (1 + 0.003 * sine(t, 0.08))) * 0.12 +
      sine(t, 196 * (1 + 0.002 * sine(t, 0.11))) * 0.08

    out += pad * (0.5 + 0.5 * sine(t, 0.07))

    const wind = noise() * 0.01

    return clamp(out + wind, -1, 1)
  })

  writeWav('ambient-shop.wav', samples)
}

// ── Ambient: Gate ──────────────────────────────────────────────────────────────
// Ominous — used during Awakening sequence. Deep + otherworldly.
{
  const dur = 12

  const samples = makeSamples(dur, (t) => {
    // Sub bass rumble
    const sub = sine(t, 30 + 5 * sine(t, 0.05)) * 0.3

    // Eerie high partials
    const eerie = (
      sine(t, 220 * (1 + 0.015 * sine(t, 0.06))) * 0.08 +
      sine(t, 277.18 * (1 + 0.01 * sine(t, 0.09))) * 0.05 +  // Eb4
      sine(t, 369.99 * (1 + 0.008 * sine(t, 0.07))) * 0.04   // F#4
    ) * (0.5 + 0.5 * sine(t, 0.15))

    // Filtered noise whoosh
    const whoosh = noise() * 0.04 * (0.3 + 0.7 * Math.abs(sine(t, 0.08)))

    // Occasional deep hit
    const hitT = t % 4
    const hit = hitT < 0.3 ? Math.exp(-hitT * 15) * sine(t, 45) * 0.4 : 0

    return clamp(sub + eerie + whoosh + hit, -1, 1)
  })

  writeWav('ambient-gate.wav', samples)
}

console.log('\n✅ All audio files generated in public/audio/')
console.log('Note: These are .wav files. Browsers can play .wav directly.')
console.log('Rename the AudioManager src arrays to use .wav instead of .webm,')
console.log('or convert to .webm with ffmpeg: ffmpeg -i input.wav output.webm')
