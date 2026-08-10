import type { Agent, AgentId, InsightKind, EdgeRelation, NodeKind, Phase, PhaseId } from './types'

export const AGENTS: Record<AgentId, Agent> = {
  strategist: {
    id: 'strategist',
    name: 'Strategist',
    glyph: 'ST',
    role: 'Sequencing & leverage',
    doctrine: 'Finds the one move that makes the next ten cheaper. Optimizes order, not effort.',
    hueVar: '--agent-strategist',
    orbit: -90,
  },
  researcher: {
    id: 'researcher',
    name: 'Researcher',
    glyph: 'RE',
    role: 'Evidence & analogues',
    doctrine: 'Refuses claims without a number, a precedent, or an explicit admission of ignorance.',
    hueVar: '--agent-researcher',
    orbit: -30,
  },
  skeptic: {
    id: 'skeptic',
    name: 'Skeptic',
    glyph: 'SK',
    role: 'Failure modes',
    doctrine: 'Assumes the plan already failed and works backwards to find out how.',
    hueVar: '--agent-skeptic',
    orbit: 30,
  },
  designer: {
    id: 'designer',
    name: 'Designer',
    glyph: 'DE',
    role: 'Adoption & incentives',
    doctrine: 'Treats behaviour as the real constraint. Nothing works that people route around.',
    hueVar: '--agent-designer',
    orbit: 90,
  },
  operator: {
    id: 'operator',
    name: 'Operator',
    glyph: 'OP',
    role: 'Execution & dependencies',
    doctrine: 'Converts ambition into dated, owned, resourced steps — or rejects it as undeliverable.',
    hueVar: '--agent-operator',
    orbit: 150,
  },
  futurist: {
    id: 'futurist',
    name: 'Futurist',
    glyph: 'FU',
    role: 'Second-order effects',
    doctrine: 'Plays the plan forward until something surprising happens, then reports the surprise.',
    hueVar: '--agent-futurist',
    orbit: 210,
  },
}

export const AGENT_LIST = Object.values(AGENTS)

export const PHASES: Phase[] = [
  { id: 'parse', index: 1, code: '01', label: 'Parsing objective', detail: 'Decomposing the mission into outcome, actor, and deadline.', duration: 2200 },
  { id: 'constraints', index: 2, code: '02', label: 'Identifying constraints', detail: 'Extracting hard limits, budgets, and political boundaries.', duration: 2600 },
  { id: 'deploy', index: 3, code: '03', label: 'Deploying specialists', detail: 'Waking six reasoning agents against competing objectives.', duration: 2400 },
  { id: 'models', index: 4, code: '04', label: 'Generating competing models', detail: 'Each agent proposes an independent theory of the problem.', duration: 4200 },
  { id: 'crossexam', index: 5, code: '05', label: 'Cross-examination', detail: 'Agents attack each other’s assumptions and revise positions.', duration: 5200 },
  { id: 'futures', index: 6, code: '06', label: 'Future simulation', detail: 'Branching the surviving strategy into three horizons.', duration: 3800 },
  { id: 'consensus', index: 7, code: '07', label: 'Consensus synthesis', detail: 'Collapsing the debate into one decisive recommendation.', duration: 3000 },
]

export const PHASE_ORDER: PhaseId[] = PHASES.map((p) => p.id)

export function phaseIndex(id: PhaseId): number {
  return PHASE_ORDER.indexOf(id)
}

/** Total wall-clock of a full-speed run, used for the scrubber scale. */
export const RUN_DURATION = PHASES.reduce((sum, p) => sum + p.duration, 0)

/** Cumulative start time of each phase in the run timeline. */
export const PHASE_STARTS: Record<PhaseId, number> = (() => {
  const out = {} as Record<PhaseId, number>
  let t = 0
  for (const p of PHASES) {
    out[p.id] = t
    t += p.duration
  }
  return out
})()

export const INSIGHT_META: Record<InsightKind, { label: string; glyph: string; tone: string }> = {
  hypothesis: { label: 'Hypothesis', glyph: '◇', tone: 'text-signal' },
  observation: { label: 'Observation', glyph: '□', tone: 'text-ink-dim' },
  challenge: { label: 'Challenge', glyph: '✕', tone: 'text-hazard' },
  risk: { label: 'Risk', glyph: '△', tone: 'text-caution' },
  opportunity: { label: 'Opportunity', glyph: '○', tone: 'text-thrive' },
  decision: { label: 'Decision', glyph: '▣', tone: 'text-ink' },
}

export const RELATION_META: Record<EdgeRelation, { label: string; dash: string; tone: string }> = {
  causes: { label: 'causes', dash: '', tone: 'var(--signal)' },
  'depends-on': { label: 'depends on', dash: '5 4', tone: 'var(--ink-faint)' },
  'conflicts-with': { label: 'conflicts with', dash: '2 5', tone: 'var(--hazard)' },
  amplifies: { label: 'amplifies', dash: '', tone: 'var(--thrive)' },
  mitigates: { label: 'mitigates', dash: '8 3', tone: 'var(--thrive)' },
  enables: { label: 'enables', dash: '', tone: 'var(--agent-strategist)' },
}

export const NODE_META: Record<NodeKind, { label: string; shape: 'hex' | 'square' | 'circle' | 'diamond' | 'triangle' }> = {
  lever: { label: 'Lever', shape: 'hex' },
  constraint: { label: 'Constraint', shape: 'square' },
  actor: { label: 'Actor', shape: 'circle' },
  outcome: { label: 'Outcome', shape: 'diamond' },
  risk: { label: 'Risk', shape: 'triangle' },
}
