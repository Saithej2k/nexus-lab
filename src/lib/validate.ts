import type { Analysis, AgentId, PhaseId } from './types'
import { AGENT_IDS } from './types'
import { PHASE_ORDER } from './agents'
import { deriveTitle, clamp } from './utils'

/**
 * Structural validation for anything arriving from outside the app.
 *
 * A remote service returns JSON, and JSON from outside the app is untrusted
 * input: fields go missing, enums drift, numbers arrive as strings. NEXUS
 * validates the document, repairs what is safely repairable, and rejects what is
 * not so the caller can fall back.
 */

export type ValidationResult =
  | { ok: true; value: Analysis; repaired: string[] }
  | { ok: false; errors: string[] }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const num = (v: unknown, fallback: number) => {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' && v.trim() ? v : fallback)

const agent = (v: unknown): AgentId =>
  AGENT_IDS.includes(v as AgentId) ? (v as AgentId) : 'strategist'

const phase = (v: unknown): PhaseId =>
  PHASE_ORDER.includes(v as PhaseId) ? (v as PhaseId) : 'models'

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

export function validateAnalysis(input: unknown, prompt: string): ValidationResult {
  const errors: string[] = []
  const repaired: string[] = []

  if (!isObj(input)) return { ok: false, errors: ['root is not an object'] }

  const nodesRaw = arr(input.nodes)
  const edgesRaw = arr(input.edges)
  const insightsRaw = arr(input.insights)
  const scenariosRaw = arr(input.scenarios)

  if (nodesRaw.length < 6) errors.push('nodes: fewer than 6 concepts')
  if (insightsRaw.length < 6) errors.push('insights: fewer than 6 entries')
  if (!isObj(input.consensus)) errors.push('consensus: missing')
  if (scenariosRaw.length < 3) errors.push('scenarios: fewer than 3 branches')
  if (errors.length) return { ok: false, errors }

  const nodes: Analysis['nodes'] = nodesRaw.filter(isObj).map((n, i) => ({
    id: str(n.id, `n-${i}`),
    label: str(n.label, `Concept ${i + 1}`),
    kind: (['lever', 'constraint', 'actor', 'outcome', 'risk'] as const).includes(n.kind as never)
      ? (n.kind as Analysis['nodes'][number]['kind'])
      : 'lever',
    rationale: str(n.rationale, 'No rationale supplied.'),
    confidence: clamp(Math.round(num(n.confidence, 70)), 0, 100),
    bornAt: phase(n.bornAt),
    agents: arr(n.agents).map(agent),
    assumptions: arr(n.assumptions).map((a) => str(a)).filter(Boolean),
    risks: arr(n.risks).map((a) => str(a)).filter(Boolean),
    // A payload rarely carries a usable layout; derive one deterministically.
    x: clamp(num(n.x, 0.15 + ((i * 0.17) % 0.7)), 0.05, 0.95),
    y: clamp(num(n.y, 0.12 + ((i * 0.29) % 0.76)), 0.05, 0.95),
    weight: clamp(num(n.weight, 0.7), 0.2, 1),
  }))

  const nodeIds = new Set(nodes.map((n) => n.id))

  const edges: Analysis['edges'] = edgesRaw
    .filter(isObj)
    .map((e, i) => ({
      id: str(e.id, `e-${i}`),
      from: str(e.from),
      to: str(e.to),
      relation: (['causes', 'depends-on', 'conflicts-with', 'amplifies', 'mitigates', 'enables'] as const).includes(
        e.relation as never,
      )
        ? (e.relation as Analysis['edges'][number]['relation'])
        : 'causes',
      strength: clamp(num(e.strength, 0.6), 0.1, 1),
      bornAt: phase(e.bornAt),
    }))
    // Dangling edges are the most common payload error. Drop, don't fail.
    .filter((e) => {
      const keep = nodeIds.has(e.from) && nodeIds.has(e.to) && e.from !== e.to
      if (!keep) repaired.push(`dropped dangling edge ${e.from}→${e.to}`)
      return keep
    })

  const insights: Analysis['insights'] = insightsRaw.filter(isObj).map((n, i) => ({
    id: str(n.id, `i-${i}`),
    agent: agent(n.agent),
    kind: (['hypothesis', 'observation', 'challenge', 'risk', 'opportunity', 'decision'] as const).includes(
      n.kind as never,
    )
      ? (n.kind as Analysis['insights'][number]['kind'])
      : 'observation',
    title: str(n.title, 'Untitled contribution'),
    body: str(n.body, ''),
    confidence: clamp(Math.round(num(n.confidence, 70)), 0, 100),
    phase: phase(n.phase),
    concepts: arr(n.concepts).map((c) => str(c)).filter((c) => nodeIds.has(c)),
    evidence: typeof n.evidence === 'string' ? n.evidence : undefined,
  }))

  const threads: Analysis['threads'] = arr(input.threads)
    .filter(isObj)
    .map((t, ti) => ({
      id: str(t.id, `t-${ti}`),
      topic: str(t.topic, 'Contested question'),
      resolved: Boolean(t.resolved),
      events: arr(t.events)
        .filter(isObj)
        .map((e, ei) => ({
          id: str(e.id, `t-${ti}-${ei}`),
          thread: str(t.id, `t-${ti}`),
          move: (['proposal', 'challenge', 'revision', 'decision'] as const).includes(e.move as never)
            ? (e.move as Analysis['threads'][number]['events'][number]['move'])
            : 'proposal',
          agent: agent(e.agent),
          respondsTo: typeof e.respondsTo === 'string' ? e.respondsTo : undefined,
          claim: str(e.claim, ''),
          confidenceAfter: clamp(Math.round(num(e.confidenceAfter, 65)), 0, 100),
          concepts: arr(e.concepts).map((c) => str(c)).filter((c) => nodeIds.has(c)),
          at: num(e.at, 12000 + ei * 700),
        }))
        .filter((e) => e.claim),
    }))
    .filter((t) => t.events.length > 0)

  const c = isObj(input.consensus) ? input.consensus : {}
  const consensus: Analysis['consensus'] = {
    move: str(c.move, 'No decisive recommendation was returned.'),
    moveDetail: str(c.moveDetail, ''),
    whyItWins: arr(c.whyItWins)
      .filter(isObj)
      .map((w) => ({ headline: str(w.headline, ''), detail: str(w.detail, '') }))
      .filter((w) => w.headline),
    first72Hours: arr(c.first72Hours)
      .filter(isObj)
      .map((w) => ({ hour: str(w.hour, ''), action: str(w.action, ''), owner: str(w.owner, '—') }))
      .filter((w) => w.action),
    criticalAssumptions: arr(c.criticalAssumptions)
      .filter(isObj)
      .map((w) => ({ claim: str(w.claim, ''), confidence: clamp(Math.round(num(w.confidence, 65)), 0, 100) }))
      .filter((w) => w.claim),
    killConditions: arr(c.killConditions)
      .filter(isObj)
      .map((w) => ({ signal: str(w.signal, ''), threshold: str(w.threshold, '—') }))
      .filter((w) => w.signal),
    secondOrder: arr(c.secondOrder)
      .filter(isObj)
      .map((w) => ({ effect: str(w.effect, ''), detail: str(w.detail, '') }))
      .filter((w) => w.effect),
    unresolved: arr(c.unresolved)
      .filter(isObj)
      .map((w) => ({
        question: str(w.question, ''),
        camps: arr(w.camps)
          .filter(isObj)
          .map((k) => ({ agent: agent(k.agent), position: str(k.position, '') })),
      }))
      .filter((w) => w.question),
    confidence: clamp(Math.round(num(c.confidence, 70)), 0, 100),
    dissent: clamp(Math.round(num(c.dissent, 25)), 0, 100),
  }

  if (!consensus.whyItWins.length) errors.push('consensus.whyItWins: empty')
  if (!consensus.first72Hours.length) errors.push('consensus.first72Hours: empty')
  if (errors.length) return { ok: false, errors }

  const scenarios = scenariosRaw.filter(isObj).slice(0, 3).map((s, i) => ({
    id: (['conservative', 'balanced', 'moonshot'] as const)[i],
    name: str(s.name, ['Conservative', 'Balanced', 'Moonshot'][i]),
    thesis: str(s.thesis, ''),
    probability: clamp(Math.round(num(s.probability, 50)), 0, 100),
    risk: (['low', 'moderate', 'high', 'severe'] as const).includes(s.risk as never)
      ? (s.risk as Analysis['scenarios'][number]['risk'])
      : 'moderate',
    horizon: str(s.horizon, '—'),
    upside: str(s.upside, ''),
    keyDependency: str(s.keyDependency, ''),
    failureMode: str(s.failureMode, ''),
    capital: str(s.capital, '—'),
    milestones: ([1, 3, 5, 10] as const).map((year, k) => {
      const m = arr(s.milestones).filter(isObj)[k] ?? {}
      return {
        year,
        headline: str(m.headline, `Year ${year}`),
        detail: str(m.detail, ''),
        metric: str(m.metric, '—'),
      }
    }),
  })) as Analysis['scenarios']

  const d = isObj(input.dna) ? input.dna : {}
  const dna: Analysis['dna'] = {
    ambition: clamp(Math.round(num(d.ambition, 70)), 0, 100),
    feasibility: clamp(Math.round(num(d.feasibility, 60)), 0, 100),
    reversibility: clamp(Math.round(num(d.reversibility, 55)), 0, 100),
    capitalNeed: clamp(Math.round(num(d.capitalNeed, 55)), 0, 100),
    timePressure: clamp(Math.round(num(d.timePressure, 65)), 0, 100),
    uncertainty: clamp(Math.round(num(d.uncertainty, 65)), 0, 100),
  }

  const m = isObj(input.mission) ? input.mission : {}
  const telemetry = arr(input.telemetry)
    .filter(isObj)
    .map((t) => ({ phase: phase(t.phase), at: num(t.at, 0), text: str(t.text, '') }))
    .filter((t) => t.text)

  return {
    ok: true,
    repaired,
    value: {
      mission: {
        id: str(m.id, `nx-live-${Date.now().toString(36)}`),
        prompt,
        title: str(m.title, deriveTitle(prompt)),
        constraints: arr(m.constraints).map((x) => str(x)).filter(Boolean),
        createdAt: Date.now(),
        source: 'remote',
      },
      insights,
      threads,
      nodes,
      edges,
      scenarios,
      consensus,
      dna,
      telemetry,
    },
  }
}
