import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Deterministic 32-bit hash — every "random" value in NEXUS derives from this. */
export function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Seeded PRNG. Same mission text always produces the same analysis. */
export function rng(seed: string) {
  let s = hash(seed) || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export function pick<T>(arr: readonly T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length]
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

export function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Compress a long mission prompt into an operational title. */
export function deriveTitle(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ').replace(/[."]+$/, '')
  if (cleaned.length <= 52) return cleaned
  const cut = cleaned.slice(0, 52)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 24 ? lastSpace : 52)}…`
}

/** Scroll a labelled section into view and move focus there for keyboard users. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.focus({ preventScroll: true })
}

export function idFrom(prefix: string, seed: string, i: number) {
  return `${prefix}-${(hash(seed + i) % 46656).toString(36).padStart(3, '0')}`
}
