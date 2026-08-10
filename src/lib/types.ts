/**
 * NEXUS domain model.
 *
 * Everything the interface renders is derived from these shapes. A simulation
 * source (the authored dataset, the procedural engine, or a remote analysis
 * service) only has to return an `Analysis` — the presentation layer knows
 * nothing else.
 */

export type AgentId =
  | 'strategist'
  | 'researcher'
  | 'skeptic'
  | 'designer'
  | 'operator'
  | 'futurist'

export const AGENT_IDS: readonly AgentId[] = [
  'strategist',
  'researcher',
  'skeptic',
  'designer',
  'operator',
  'futurist',
] as const

/** Visual + behavioural state of an agent node during a run. */
export type AgentStatus = 'dormant' | 'waking' | 'thinking' | 'transmitting' | 'settled'

export interface Agent {
  id: AgentId
  name: string
  /** Two-letter glyph used in the constellation node. */
  glyph: string
  role: string
  /** How this agent reasons — shown in the inspector header. */
  doctrine: string
  /** CSS variable name carrying this agent's identity hue. */
  hueVar: string
  /** Angle (deg) on the constellation ring. Deterministic, not random. */
  orbit: number
}

export type InsightKind =
  | 'hypothesis'
  | 'observation'
  | 'challenge'
  | 'risk'
  | 'opportunity'
  | 'decision'

export interface AgentInsight {
  id: string
  agent: AgentId
  kind: InsightKind
  title: string
  body: string
  /** 0–100. Rendered as a bar, and always also stated as a number. */
  confidence: number
  /** Which analysis phase produced it — drives replay reconstruction. */
  phase: PhaseId
  /** Decision-graph node ids this insight is attached to. */
  concepts: string[]
  /** Optional hard number the agent is leaning on. */
  evidence?: string
}

export type PhaseId =
  | 'parse'
  | 'constraints'
  | 'deploy'
  | 'models'
  | 'crossexam'
  | 'futures'
  | 'consensus'

export interface Phase {
  id: PhaseId
  index: number
  code: string
  label: string
  detail: string
  /** Milliseconds this phase occupies in a full-speed run. */
  duration: number
}

export type DebateMove = 'proposal' | 'challenge' | 'revision' | 'decision'

export interface DebateEvent {
  id: string
  /** Debate thread this move belongs to. */
  thread: string
  move: DebateMove
  agent: AgentId
  /** Agent being answered, when the move is a reply. */
  respondsTo?: string
  claim: string
  /** Confidence in the thread's live position after this move. */
  confidenceAfter: number
  /** Concepts this move puts pressure on. */
  concepts: string[]
  at: number
}

export interface DebateThread {
  id: string
  topic: string
  events: DebateEvent[]
  /** Did the thread land, or is it still contested? */
  resolved: boolean
}

export type NodeKind = 'lever' | 'constraint' | 'actor' | 'outcome' | 'risk'

export interface DecisionNode {
  id: string
  label: string
  kind: NodeKind
  /** Why this concept matters — shown in the inspector. */
  rationale: string
  confidence: number
  /** Phase at which this node enters the graph. Drives progressive disclosure. */
  bornAt: PhaseId
  /** Agents that argued about it. */
  agents: AgentId[]
  assumptions: string[]
  risks: string[]
  /** Normalized layout position, 0–1 in both axes. Deterministic. */
  x: number
  y: number
  /** Relative importance, 0–1. Drives node radius and label priority. */
  weight: number
}

export type EdgeRelation =
  | 'causes'
  | 'depends-on'
  | 'conflicts-with'
  | 'amplifies'
  | 'mitigates'
  | 'enables'

export interface DecisionEdge {
  id: string
  from: string
  to: string
  relation: EdgeRelation
  /** 0–1 — line weight and pulse frequency. */
  strength: number
  bornAt: PhaseId
}

export type ScenarioId = 'conservative' | 'balanced' | 'moonshot'

export interface Milestone {
  year: 1 | 3 | 5 | 10
  headline: string
  detail: string
  /** A hard number that should be true by then. */
  metric: string
}

export interface Scenario {
  id: ScenarioId
  name: string
  thesis: string
  probability: number
  risk: 'low' | 'moderate' | 'high' | 'severe'
  horizon: string
  upside: string
  keyDependency: string
  failureMode: string
  capital: string
  milestones: Milestone[]
}

export interface Consensus {
  move: string
  moveDetail: string
  whyItWins: { headline: string; detail: string }[]
  first72Hours: { hour: string; action: string; owner: string }[]
  criticalAssumptions: { claim: string; confidence: number }[]
  killConditions: { signal: string; threshold: string }[]
  secondOrder: { effect: string; detail: string }[]
  unresolved: { question: string; camps: { agent: AgentId; position: string }[] }[]
  confidence: number
  dissent: number
}

export interface DecisionDNA {
  ambition: number
  feasibility: number
  reversibility: number
  capitalNeed: number
  timePressure: number
  uncertainty: number
}

export interface Mission {
  id: string
  prompt: string
  /** Short operational title derived from the prompt. */
  title: string
  /** Constraints NEXUS extracted during the parse phase. */
  constraints: string[]
  createdAt: number
  source: 'demo' | 'engine' | 'remote'
}

export interface Analysis {
  mission: Mission
  insights: AgentInsight[]
  threads: DebateThread[]
  nodes: DecisionNode[]
  edges: DecisionEdge[]
  scenarios: Scenario[]
  consensus: Consensus
  dna: DecisionDNA
  /** Terminal-style activity log, phase-tagged, used by the run feed + replay. */
  telemetry: { phase: PhaseId; at: number; text: string }[]
}

/**
 * Contract every simulation source implements. Swapping the deterministic engine
 * for a remote analysis service is a one-line change at the call site.
 */
export interface SimulationSource {
  readonly id: 'demo' | 'engine' | 'remote'
  readonly label: string
  available(): boolean
  run(prompt: string, signal?: AbortSignal): Promise<Analysis>
}
