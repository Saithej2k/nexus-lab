/**
 * Muted-by-default sound.
 *
 * Synthesised with the Web Audio API rather than shipped as assets: four short
 * tones, no files, no autoplay, no network. The context is created lazily on the
 * first user gesture so nothing is initialised for people who never enable it.
 */

type Cue = 'activate' | 'pulse' | 'phase' | 'consensus'

let ctx: AudioContext | null = null
let enabled = false
let last = 0

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const CUES: Record<Cue, { freq: number; to: number; dur: number; gain: number; type: OscillatorType }> = {
  activate: { freq: 320, to: 640, dur: 0.16, gain: 0.05, type: 'sine' },
  pulse: { freq: 880, to: 940, dur: 0.05, gain: 0.018, type: 'sine' },
  phase: { freq: 520, to: 392, dur: 0.22, gain: 0.04, type: 'triangle' },
  consensus: { freq: 261.6, to: 523.2, dur: 0.9, gain: 0.06, type: 'sine' },
}

export const sound = {
  get enabled() {
    return enabled
  },
  setEnabled(v: boolean) {
    enabled = v
    if (v) ensure()
  },
  play(cue: Cue) {
    if (!enabled) return
    const ac = ensure()
    if (!ac) return
    // Rate-limit pulses so a busy run never turns into a buzz.
    const now = ac.currentTime
    if (cue === 'pulse' && now - last < 0.09) return
    last = now

    const spec = CUES[cue]
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = spec.type
    osc.frequency.setValueAtTime(spec.freq, now)
    osc.frequency.exponentialRampToValueAtTime(spec.to, now + spec.dur)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(spec.gain, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + spec.dur + 0.02)
  },
}
