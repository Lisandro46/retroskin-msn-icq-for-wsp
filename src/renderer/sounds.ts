/**
 * Synthesized imitations of the classic sounds, used only when no file is found:
 * first the user's sounds folder (store.ensureSoundsDir), then the originals in resources/sounds.
 */
import type { SkinId, SoundId } from '@shared/types'

let ctx: AudioContext | undefined
const audio = (): AudioContext => (ctx ??= new AudioContext())

function tone(
  at: number,
  freq: number,
  duration: number,
  { type = 'sine', gain = 0.25, attack = 0.005, endFreq }: { type?: OscillatorType; gain?: number; attack?: number; endFreq?: number } = {}
): void {
  const c = audio()
  const osc = c.createOscillator()
  const amp = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, at + duration)
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(gain, at + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(amp).connect(c.destination)
  osc.start(at)
  osc.stop(at + duration + 0.05)
}

/** A soft bell: fundamental plus a couple of inharmonic partials. */
function bell(at: number, freq: number, duration = 0.6, gain = 0.18): void {
  tone(at, freq, duration, { gain })
  tone(at, freq * 2.01, duration * 0.6, { gain: gain * 0.35 })
  tone(at, freq * 3.02, duration * 0.35, { gain: gain * 0.15 })
}

function noise(at: number, duration: number, freq: number, gain: number): void {
  const c = audio()
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = 1.2
  const amp = c.createGain()
  amp.gain.setValueAtTime(gain, at)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  src.connect(filter).connect(amp).connect(c.destination)
  src.start(at)
}

/** A voiced vowel: sawtooth through two formant filters, gliding pitch. */
function vowel(at: number, duration: number, pitch: [number, number], formants: [number, number], gain = 0.5): void {
  const c = audio()
  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(pitch[0], at)
  osc.frequency.linearRampToValueAtTime(pitch[1], at + duration)
  const out = c.createGain()
  out.gain.setValueAtTime(0, at)
  out.gain.linearRampToValueAtTime(gain, at + 0.03)
  out.gain.setValueAtTime(gain, at + duration * 0.6)
  out.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  for (const [i, f] of formants.entries()) {
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f
    bp.Q.value = 6
    const g = c.createGain()
    g.gain.value = i === 0 ? 1 : 0.6
    osc.connect(bp).connect(g).connect(out)
  }
  out.connect(c.destination)
  osc.start(at)
  osc.stop(at + duration + 0.05)
}

/** Low buzzing rumble with a wobble, for the nudge. */
function rumble(at: number, duration: number, base: number): void {
  const c = audio()
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(base, at)
  const lfo = c.createOscillator()
  lfo.frequency.value = 14
  const lfoGain = c.createGain()
  lfoGain.gain.value = base * 0.25
  lfo.connect(lfoGain).connect(osc.frequency)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  const amp = c.createGain()
  amp.gain.setValueAtTime(0, at)
  amp.gain.linearRampToValueAtTime(0.16, at + 0.04)
  amp.gain.setValueAtTime(0.16, at + duration * 0.7)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(filter).connect(amp).connect(c.destination)
  osc.start(at)
  lfo.start(at)
  osc.stop(at + duration + 0.05)
  lfo.stop(at + duration + 0.05)
}

const SYNTH: Record<'msn' | 'icq', Record<SoundId, (t: number) => void>> = {
  msn: {
    // Two-note "doo-dun".
    message: (t) => {
      bell(t, 1046.5, 0.5)
      bell(t + 0.14, 784, 0.8)
    },
    // Rising three-note chime.
    online: (t) => {
      bell(t, 659.3, 0.5, 0.14)
      bell(t + 0.12, 880, 0.5, 0.14)
      bell(t + 0.24, 1318.5, 0.9, 0.14)
    },
    nudge: (t) => {
      rumble(t, 0.9, 70)
      noise(t, 0.9, 180, 0.12)
    }
  },
  icq: {
    // "Uh-oh!": two vowels, the second lower.
    message: (t) => {
      vowel(t, 0.16, [235, 225], [640, 1190], 0.55)
      vowel(t + 0.2, 0.32, [185, 160], [520, 920], 0.55)
    },
    // Knock knock on the door.
    online: (t) => {
      for (const dt of [0, 0.16]) {
        tone(t + dt, 150, 0.12, { gain: 0.5, endFreq: 70 })
        noise(t + dt, 0.06, 1200, 0.25)
      }
    },
    nudge: (t) => {
      rumble(t, 0.8, 95)
      tone(t, 880, 0.12, { type: 'square', gain: 0.06 })
      tone(t + 0.15, 660, 0.12, { type: 'square', gain: 0.06 })
    }
  }
}

const fileCache = new Map<string, string | null>()

export async function playSound(skin: SkinId, sound: SoundId): Promise<void> {
  const pack = skin === 'icq' ? 'icq' : 'msn'
  const key = `${pack}/${sound}`
  if (!fileCache.has(key)) fileCache.set(key, await window.messenger.soundFile(pack, sound))
  const file = fileCache.get(key)
  if (file) {
    await new Audio(file).play().catch(() => undefined)
    return
  }
  const c = audio()
  if (c.state === 'suspended') await c.resume()
  SYNTH[pack][sound](c.currentTime + 0.02)
}

/** Forget cached files, so newly dropped sounds are picked up. */
export const clearSoundCache = (): void => fileCache.clear()
