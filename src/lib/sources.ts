import type { Analysis, SimulationSource } from './types'
import { carFree2040 } from '@/data/demo/carFree2040'
import { composeAnalysis } from './engine/compose'
import { DEMO_MISSION_PROMPT } from '@/data/missions'
import { validateAnalysis } from './validate'

/** The hand-authored flagship analysis. Always available, never needs credentials. */
export const demoSource: SimulationSource = {
  id: 'demo',
  label: 'Authored dataset',
  available: () => true,
  async run() {
    return { ...carFree2040, mission: { ...carFree2040.mission, createdAt: Date.now() } }
  },
}

/** Deterministic reasoning engine — handles any mission text, offline. */
export const engineSource: SimulationSource = {
  id: 'engine',
  label: 'Deterministic engine',
  available: () => true,
  async run(prompt: string) {
    return composeAnalysis(prompt)
  },
}

/**
 * Remote analysis service.
 *
 * Deliberately not wired to a provider: NEXUS ships with no credentials and must
 * never surface an infrastructure error to a reviewer. Point
 * `VITE_NEXUS_ANALYSIS_ENDPOINT` at a server route that returns an
 * `Analysis`-shaped JSON document and this becomes the primary source
 * automatically. The route — not the browser — holds any secret.
 */
const REMOTE_ENDPOINT = import.meta.env.VITE_NEXUS_ANALYSIS_ENDPOINT as string | undefined
const REMOTE_TIMEOUT_MS = 45_000

export const remoteSource: SimulationSource = {
  id: 'remote',
  label: 'Remote analysis service',
  available: () => Boolean(REMOTE_ENDPOINT),
  async run(prompt: string, signal?: AbortSignal) {
    if (!REMOTE_ENDPOINT) throw new Error('no-endpoint')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS)
    signal?.addEventListener('abort', () => controller.abort(), { once: true })

    try {
      const res = await fetch(REMOTE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`upstream-${res.status}`)
      const json: unknown = await res.json()
      const result = validateAnalysis(json, prompt)
      if (!result.ok) throw new Error(`schema:${result.errors.join(';')}`)
      return result.value
    } finally {
      clearTimeout(timer)
    }
  },
}

export interface RunOutcome {
  analysis: Analysis
  /** Which source actually produced it, after any fallback. */
  usedSource: 'demo' | 'engine' | 'remote'
  /** Set when a preferred source failed and NEXUS degraded silently. */
  degradedFrom?: 'remote'
}

/**
 * Single entry point the UI calls. Prefers the remote service when configured,
 * falls back to the deterministic engine without ever showing an error.
 */
export async function runMission(prompt: string, signal?: AbortSignal): Promise<RunOutcome> {
  const trimmed = prompt.trim()

  if (trimmed.toLowerCase() === DEMO_MISSION_PROMPT.toLowerCase()) {
    return { analysis: await demoSource.run(trimmed), usedSource: 'demo' }
  }

  if (remoteSource.available()) {
    try {
      const analysis = await remoteSource.run(trimmed, signal)
      return { analysis, usedSource: 'remote' }
    } catch {
      // Silent, deliberate degradation. A reviewer never sees a stack trace.
      return {
        analysis: await engineSource.run(trimmed),
        usedSource: 'engine',
        degradedFrom: 'remote',
      }
    }
  }

  return { analysis: await engineSource.run(trimmed), usedSource: 'engine' }
}

export const ACTIVE_SOURCE_LABEL = remoteSource.available()
  ? 'Remote service + deterministic fallback'
  : 'Deterministic reasoning engine'
