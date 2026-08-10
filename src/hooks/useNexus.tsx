import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Agent, AgentId, AgentStatus, Analysis, PhaseId } from '@/lib/types'
import { AGENT_LIST, PHASES, PHASE_STARTS, RUN_DURATION, phaseIndex } from '@/lib/agents'
import { runMission, type RunOutcome } from '@/lib/sources'
import { clamp } from '@/lib/utils'
import { sound } from '@/lib/sound'
import { useReducedMotion } from './useMedia'

export type Screen = 'compose' | 'lab'
export type RunStatus = 'idle' | 'running' | 'complete'

export interface NexusState {
  screen: Screen
  status: RunStatus
  analysis: Analysis | null
  outcome: RunOutcome | null
  /** Position on the analysis timeline, in ms. Doubles as the replay head. */
  t: number
  playing: boolean
  speed: 1 | 2 | 4
  phase: PhaseId
  phaseProgress: number
  agentStatus: Record<AgentId, AgentStatus>
  selectedAgent: AgentId | null
  selectedNode: string | null
  scenario: 'conservative' | 'balanced' | 'moonshot'
  focusMode: boolean
  singularity: boolean
  soundOn: boolean
  theme: 'dark' | 'light'
  reducedMotion: boolean
  paletteOpen: boolean
  /** The initialization sequence overlay is showing. */
  ignition: boolean
}

export interface NexusApi extends NexusState {
  initialize: (prompt: string, opts?: { at?: number; autoplay?: boolean }) => void
  reset: () => void
  seek: (t: number) => void
  setPlaying: (v: boolean) => void
  togglePlay: () => void
  setSpeed: (s: 1 | 2 | 4) => void
  jumpToPhase: (p: PhaseId) => void
  selectAgent: (id: AgentId | null) => void
  selectNode: (id: string | null) => void
  setScenario: (s: 'conservative' | 'balanced' | 'moonshot') => void
  toggleFocus: () => void
  toggleSound: () => void
  toggleTheme: () => void
  setSingularity: (v: boolean) => void
  setPaletteOpen: (v: boolean) => void
  agents: Agent[]
  /** Everything visible at the current timeline position. */
  visible: {
    nodes: Analysis['nodes']
    edges: Analysis['edges']
    insights: Analysis['insights']
    events: Analysis['threads'][number]['events']
    telemetry: Analysis['telemetry']
  }
}

const NexusContext = createContext<NexusApi | null>(null)

/** Agents wake in a deliberate stagger during phase 03. */
const WAKE_ORDER: AgentId[] = ['strategist', 'researcher', 'skeptic', 'designer', 'operator', 'futurist']

function phaseAt(t: number): { phase: PhaseId; progress: number } {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    const p = PHASES[i]
    if (t >= PHASE_STARTS[p.id]) {
      return { phase: p.id, progress: clamp((t - PHASE_STARTS[p.id]) / p.duration, 0, 1) }
    }
  }
  return { phase: 'parse', progress: 0 }
}

export function NexusProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()

  // A shared link opens directly in the lab: the composer is never mounted, so
  // there is no entry transition to wait on before the analysis appears.
  const sharedPrompt =
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('m')

  const [screen, setScreen] = useState<Screen>(sharedPrompt?.trim() ? 'lab' : 'compose')
  const [status, setStatus] = useState<RunStatus>('idle')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [scenario, setScenario] = useState<'conservative' | 'balanced' | 'moonshot'>('balanced')
  const [focusMode, setFocusMode] = useState(false)
  const [singularity, setSingularity] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [ignition, setIgnition] = useState(false)

  const raf = useRef<number | null>(null)
  const lastFrame = useRef(0)
  const lastCommit = useRef(0)
  const tRef = useRef(0)
  const lastPhase = useRef<PhaseId>('parse')

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    sound.setEnabled(soundOn)
  }, [soundOn])

  // The single clock. Everything derived — phases, agent states, graph growth,
  // replay — reads from this one position so live and replay share a code path.
  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = null
      return
    }
    lastFrame.current = performance.now()

    const tick = (now: number) => {
      const dt = (now - lastFrame.current) * speed
      lastFrame.current = now
      const next = tRef.current + dt

      if (next >= RUN_DURATION) {
        tRef.current = RUN_DURATION
        setT(RUN_DURATION)
        setPlaying(false)
        setStatus('complete')
        sound.play('consensus')
        return
      }

      tRef.current = next
      // Commit to React at ~16 fps: the visualizations animate in CSS, so the
      // tree does not need a state update every frame.
      if (now - lastCommit.current > 60) {
        lastCommit.current = now
        setT(next)
        const { phase } = phaseAt(next)
        if (phase !== lastPhase.current) {
          lastPhase.current = phase
          sound.play('phase')
        }
      }
      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [playing, speed])

  const initialize = useCallback(
    (prompt: string, opts?: { at?: number; autoplay?: boolean }) => {
      const text = prompt.trim()
      if (!text) return
      setStatus('running')
      setScreen('lab')
      // The ignition sequence belongs to a run that starts from zero. A link
      // that opens partway through the timeline never shows it.
      setIgnition(opts?.at === undefined && !reducedMotion)
      setSelectedAgent(null)
      setSelectedNode(null)
      tRef.current = 0
      lastCommit.current = 0
      lastPhase.current = 'parse'
      setT(0)
      sound.play('activate')

      // Missions are deterministic, so the prompt itself is the share link —
      // no backend needed for someone else to open the identical analysis.
      const url = new URL(window.location.href)
      url.searchParams.set('m', text)
      window.history.replaceState({}, '', url)

      void runMission(text).then((res) => {
        setAnalysis(res.analysis)
        setOutcome(res)

        // A shared link may point at a moment on the timeline; reduced motion
        // skips the theatre entirely and delivers the finished analysis.
        const target = opts?.at
        if (typeof target === 'number' || reducedMotion) {
          const at = clamp(target ?? RUN_DURATION, 0, RUN_DURATION)
          tRef.current = at
          lastPhase.current = phaseAt(at).phase
          setT(at)
          setStatus(at >= RUN_DURATION ? 'complete' : 'running')
          setPlaying(opts?.autoplay ?? false)
        } else {
          setPlaying(true)
        }
      })
    },
    [reducedMotion],
  )

  const reset = useCallback(() => {
    setPlaying(false)
    setStatus('idle')
    setScreen('compose')
    setAnalysis(null)
    setOutcome(null)
    setSelectedAgent(null)
    setSelectedNode(null)
    setSingularity(false)
    setIgnition(false)
    tRef.current = 0
    setT(0)
    const url = new URL(window.location.href)
    url.searchParams.delete('m')
    window.history.replaceState({}, '', url)
  }, [])

  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    if (!sharedPrompt?.trim()) return

    // `?at=` opens the analysis at a moment on the timeline — `end` for the
    // finished briefing, or a millisecond offset. `#section-…` jumps there.
    const raw = new URLSearchParams(window.location.search).get('at')
    const at = raw === null ? undefined : raw === 'end' ? RUN_DURATION : Number(raw)
    initialize(sharedPrompt, { at: Number.isFinite(at) ? at : undefined })

    const anchor = window.location.hash.slice(1)
    if (anchor) {
      // Jump, don't glide: on first paint a smooth scroll competes with layout.
      window.setTimeout(() => {
        const el = document.getElementById(anchor)
        el?.scrollIntoView({ block: 'start' })
        el?.focus({ preventScroll: true })
      }, 280)
    }
  }, [initialize, sharedPrompt])

  const seek = useCallback((next: number) => {
    const v = clamp(next, 0, RUN_DURATION)
    tRef.current = v
    lastPhase.current = phaseAt(v).phase
    setT(v)
  }, [])

  const jumpToPhase = useCallback(
    (p: PhaseId) => {
      seek(PHASE_STARTS[p] + 40)
    },
    [seek],
  )

  const togglePlay = useCallback(() => {
    setPlaying((v) => {
      if (!v && tRef.current >= RUN_DURATION) {
        tRef.current = 0
        setT(0)
      }
      return !v
    })
  }, [])

  useEffect(() => {
    if (ignition && t >= 2100) setIgnition(false)
  }, [ignition, t])

  const { phase, progress } = useMemo(() => {
    const r = phaseAt(t)
    return { phase: r.phase, progress: r.progress }
  }, [t])

  const visible = useMemo(() => {
    if (!analysis) {
      return { nodes: [], edges: [], insights: [], events: [], telemetry: [] }
    }
    const pIdx = phaseIndex(phase)
    const inPlay = (born: PhaseId) => phaseIndex(born) <= pIdx

    const events = analysis.threads.flatMap((th) => th.events).filter((e) => e.at <= t)

    return {
      nodes: analysis.nodes.filter((n) => inPlay(n.bornAt)),
      edges: analysis.edges.filter((e) => inPlay(e.bornAt)),
      insights: analysis.insights.filter((i) => phaseIndex(i.phase) < pIdx || (i.phase === phase && progress > 0.25)),
      events,
      telemetry: analysis.telemetry.filter((x) => x.at <= t),
    }
  }, [analysis, phase, progress, t])

  const agentStatus = useMemo(() => {
    const out = {} as Record<AgentId, AgentStatus>
    const pIdx = phaseIndex(phase)
    const deployIdx = phaseIndex('deploy')

    for (let i = 0; i < WAKE_ORDER.length; i++) {
      const id = WAKE_ORDER[i]
      if (pIdx < deployIdx) {
        out[id] = 'dormant'
      } else if (pIdx === deployIdx) {
        out[id] = progress > (i + 0.5) / WAKE_ORDER.length ? 'waking' : 'dormant'
      } else if (phase === 'consensus' && progress > 0.6) {
        out[id] = 'settled'
      } else {
        out[id] = 'thinking'
      }
    }

    // An agent that just spoke is transmitting — this is what makes the
    // constellation read as a conversation rather than a set of lights.
    for (const e of visible.events) {
      if (t - e.at < 900) out[e.agent] = 'transmitting'
    }
    return out
  }, [phase, progress, visible.events, t])

  const value: NexusApi = {
    screen,
    status,
    analysis,
    outcome,
    t,
    playing,
    speed,
    phase,
    phaseProgress: progress,
    agentStatus,
    selectedAgent,
    selectedNode,
    scenario,
    focusMode,
    singularity,
    soundOn,
    theme,
    reducedMotion,
    paletteOpen,
    ignition,
    agents: AGENT_LIST,
    visible,
    initialize,
    reset,
    seek,
    setPlaying,
    togglePlay,
    setSpeed,
    jumpToPhase,
    // The two inspectors are mutually exclusive: one modal at a time.
    selectAgent: (id) => {
      if (id) setSelectedNode(null)
      setSelectedAgent(id)
    },
    selectNode: (id) => {
      if (id) setSelectedAgent(null)
      setSelectedNode(id)
    },
    setScenario,
    toggleFocus: () => setFocusMode((v) => !v),
    toggleSound: () => setSoundOn((v) => !v),
    toggleTheme: () => setTheme((v) => (v === 'dark' ? 'light' : 'dark')),
    setSingularity,
    setPaletteOpen,
  }

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
}

export function useNexus(): NexusApi {
  const ctx = useContext(NexusContext)
  if (!ctx) throw new Error('useNexus must be used inside <NexusProvider>')
  return ctx
}
