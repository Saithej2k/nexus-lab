import type {
  Analysis,
  AgentId,
  AgentInsight,
  Consensus,
  DebateEvent,
  DebateThread,
  DecisionEdge,
  DecisionNode,
  DecisionDNA,
  Scenario,
  PhaseId,
} from '@/lib/types'
import { deriveTitle, rng, hash, clamp } from '@/lib/utils'
import { selectPack, type DomainPack } from './domains'

/**
 * The procedural reasoning engine.
 *
 * NEXUS models every mission with the same strategic skeleton — leverage,
 * sequencing, funding, adoption, opposition, second-order effects,
 * irreversibility — and a domain pack supplies the vocabulary plus the concepts
 * that only exist inside that field. Fully deterministic: the same mission text
 * always yields the same analysis, which is what makes replay and sharing work.
 */

interface Ctx {
  pack: DomainPack
  prompt: string
  r: () => number
  /** Deterministic jitter in [-1, 1] for a given key. */
  j: (key: string) => number
}

const SKELETON: {
  id: string
  label: (p: DomainPack) => string
  kind: DecisionNode['kind']
  bornAt: PhaseId
  rationale: (p: DomainPack) => string
  agents: AgentId[]
  x: number
  y: number
  weight: number
  assumptions: (p: DomainPack) => string[]
  risks: (p: DomainPack) => string[]
}[] = [
  {
    id: 'objective',
    label: () => 'Mission objective',
    kind: 'outcome',
    bornAt: 'parse',
    rationale: (p) =>
      `The stated outcome, restated as a measurable condition: ${p.metric}. Everything downstream is judged against this and nothing else.`,
    agents: ['strategist', 'futurist'],
    x: 0.92,
    y: 0.5,
    weight: 1,
    assumptions: (p) => [`${p.metric} is observable within the horizon`],
    risks: () => ['The stated goal and the real goal diverge under pressure'],
  },
  {
    id: 'sequencing',
    label: () => 'Sequencing advantage',
    kind: 'lever',
    bornAt: 'models',
    rationale: () =>
      'Most failures here are correct actions taken in the wrong order. Resequencing so each move makes the next cheaper is usually worth more than additional resources.',
    agents: ['strategist', 'operator'],
    x: 0.42,
    y: 0.32,
    weight: 0.95,
    assumptions: () => ['Order is under the sponsor’s control'],
    risks: () => ['The politically easiest first move is rarely the strategically correct one'],
  },
  {
    id: 'proof-point',
    label: () => 'First proof point',
    kind: 'lever',
    bornAt: 'models',
    rationale: (p) =>
      `${p.proofPoint.charAt(0).toUpperCase() + p.proofPoint.slice(1)}. It converts more opposition than any model, and it is the only artefact that survives a change of leadership.`,
    agents: ['designer', 'operator'],
    x: 0.55,
    y: 0.62,
    weight: 0.9,
    assumptions: () => ['A representative instance is available, not a flattering one'],
    risks: () => ['A pilot resourced unrepresentatively proves nothing about scale'],
  },
  {
    id: 'funding',
    label: () => 'Funding stack',
    kind: 'constraint',
    bornAt: 'constraints',
    rationale: () =>
      'Benefits are back-loaded and costs are front-loaded. The gap between them, not the strategy, is what usually ends the effort.',
    agents: ['operator', 'skeptic'],
    x: 0.16,
    y: 0.28,
    weight: 0.85,
    assumptions: () => ['Funding survives at least one failed hypothesis'],
    risks: () => ['A revenue or budget hole appears before the returns mature'],
  },
  {
    id: 'window',
    label: () => 'Window of opportunity',
    kind: 'constraint',
    bornAt: 'constraints',
    rationale: () =>
      'Authority, attention, and funding are simultaneously available for a bounded period. Anything not committed before it closes is a proposal rather than a plan.',
    agents: ['strategist', 'skeptic'],
    x: 0.14,
    y: 0.62,
    weight: 0.87,
    assumptions: () => ['The window is roughly known in advance'],
    risks: () => ['The window closes early and everything uncommitted evaporates'],
  },
  {
    id: 'adoption',
    label: () => 'Adoption threshold',
    kind: 'outcome',
    bornAt: 'models',
    rationale: (p) =>
      `Below a threshold, ${p.subject} is a project people tolerate. Above it, it becomes the default and stops needing to be defended. Finding that threshold is the whole design problem.`,
    agents: ['designer', 'researcher'],
    x: 0.78,
    y: 0.3,
    weight: 0.92,
    assumptions: () => ['The threshold is reachable inside the funded period'],
    risks: () => ['Effort spread thin never crosses it anywhere'],
  },
  {
    id: 'opposition',
    label: () => 'Competent opposition',
    kind: 'risk',
    bornAt: 'crossexam',
    rationale: (p) =>
      `${p.incumbent.charAt(0).toUpperCase() + p.incumbent.slice(1)} knows more about the current arrangement than the plan does. Their resistance is rational and cannot be argued away, only answered or outlasted.`,
    agents: ['skeptic', 'strategist'],
    x: 0.7,
    y: 0.84,
    weight: 0.88,
    assumptions: () => ['Their objections have a factual core worth addressing'],
    risks: () => ['Treating rational opposition as ignorance guarantees losing to it'],
  },
  {
    id: 'capacity',
    label: () => 'Execution capacity',
    kind: 'constraint',
    bornAt: 'crossexam',
    rationale: (p) =>
      `${p.actor.charAt(0).toUpperCase() + p.actor.slice(1)} can run a fixed number of hard things at once. Every additional workstream is drawn from the same pool that delivers the first one.`,
    agents: ['operator', 'designer'],
    x: 0.3,
    y: 0.86,
    weight: 0.76,
    assumptions: () => ['Delivery capacity can be measured before it is committed'],
    risks: () => ['Parallel workstreams look like ambition and behave like delay'],
  },
  {
    id: 'ratchet',
    label: () => 'Irreversibility ratchet',
    kind: 'lever',
    bornAt: 'futures',
    rationale: (p) =>
      `${p.ratchet.charAt(0).toUpperCase() + p.ratchet.slice(1)}. This is what converts a term of effort into a permanent change of state.`,
    agents: ['futurist', 'strategist'],
    x: 0.62,
    y: 0.16,
    weight: 0.9,
    assumptions: () => ['Structural commitments can be made before opposition organises'],
    risks: () => ['Irreversibility without visible benefit gets repealed anyway'],
  },
  {
    id: 'second-order',
    label: () => 'Second-order backlash',
    kind: 'risk',
    bornAt: 'futures',
    rationale: () =>
      'The effects that arrive after success and were never in the business case. They are what determines whether the win holds a decade later.',
    agents: ['futurist', 'skeptic'],
    x: 0.86,
    y: 0.74,
    weight: 0.72,
    assumptions: () => ['Effects are detectable before they are irreversible'],
    risks: () => ['Nobody is funded to look for them'],
  },
]

const SKELETON_EDGES: { from: string; to: string; relation: DecisionEdge['relation']; strength: number; bornAt: PhaseId }[] = [
  { from: 'window', to: 'sequencing', relation: 'conflicts-with', strength: 0.7, bornAt: 'models' },
  { from: 'funding', to: 'sequencing', relation: 'depends-on', strength: 0.78, bornAt: 'models' },
  { from: 'sequencing', to: 'proof-point', relation: 'enables', strength: 0.86, bornAt: 'models' },
  { from: 'proof-point', to: 'adoption', relation: 'causes', strength: 0.82, bornAt: 'models' },
  { from: 'adoption', to: 'objective', relation: 'causes', strength: 0.94, bornAt: 'models' },
  { from: 'capacity', to: 'proof-point', relation: 'conflicts-with', strength: 0.62, bornAt: 'crossexam' },
  { from: 'opposition', to: 'window', relation: 'conflicts-with', strength: 0.8, bornAt: 'crossexam' },
  { from: 'proof-point', to: 'opposition', relation: 'mitigates', strength: 0.66, bornAt: 'crossexam' },
  { from: 'ratchet', to: 'objective', relation: 'enables', strength: 0.84, bornAt: 'futures' },
  { from: 'window', to: 'ratchet', relation: 'depends-on', strength: 0.72, bornAt: 'futures' },
  { from: 'objective', to: 'second-order', relation: 'causes', strength: 0.68, bornAt: 'futures' },
  { from: 'second-order', to: 'opposition', relation: 'amplifies', strength: 0.56, bornAt: 'futures' },
  { from: 'funding', to: 'capacity', relation: 'depends-on', strength: 0.6, bornAt: 'constraints' },
  { from: 'adoption', to: 'ratchet', relation: 'amplifies', strength: 0.58, bornAt: 'futures' },
]

/** Domain concepts are laid out on a deterministic arc so they never collide. */
const DOMAIN_SLOTS: { x: number; y: number }[] = [
  { x: 0.3, y: 0.12 },
  { x: 0.24, y: 0.46 },
  { x: 0.48, y: 0.9 },
  { x: 0.68, y: 0.44 },
  { x: 0.4, y: 0.72 },
]

function buildGraph(ctx: Ctx): { nodes: DecisionNode[]; edges: DecisionEdge[] } {
  const { pack, j } = ctx
  const nodes: DecisionNode[] = SKELETON.map((s) => ({
    id: s.id,
    label: s.label(pack),
    kind: s.kind,
    rationale: s.rationale(pack),
    confidence: clamp(Math.round(74 + j(`c-${s.id}`) * 16), 48, 95),
    bornAt: s.bornAt,
    agents: s.agents,
    assumptions: s.assumptions(pack),
    risks: s.risks(pack),
    x: clamp(s.x + j(`x-${s.id}`) * 0.02, 0.06, 0.94),
    y: clamp(s.y + j(`y-${s.id}`) * 0.03, 0.06, 0.94),
    weight: s.weight,
  }))

  const phaseForSlot: PhaseId[] = ['constraints', 'models', 'crossexam', 'crossexam', 'futures']

  pack.concepts.slice(0, 5).forEach((c, i) => {
    const slot = DOMAIN_SLOTS[i % DOMAIN_SLOTS.length]
    nodes.push({
      id: c.id,
      label: c.label,
      kind: c.kind,
      rationale: c.rationale,
      confidence: clamp(Math.round(76 + j(`dc-${c.id}`) * 14), 52, 93),
      bornAt: phaseForSlot[i % phaseForSlot.length],
      agents: (['researcher', 'skeptic', 'designer', 'operator', 'futurist'] as AgentId[]).slice(i % 3, (i % 3) + 2),
      assumptions: c.assumptions,
      risks: c.risks,
      x: clamp(slot.x + j(`dx-${c.id}`) * 0.03, 0.06, 0.94),
      y: clamp(slot.y + j(`dy-${c.id}`) * 0.03, 0.06, 0.94),
      weight: 0.66 + (i % 3) * 0.08,
    })
  })

  const edges: DecisionEdge[] = SKELETON_EDGES.map((e, i) => ({
    id: `se-${i}`,
    ...e,
  }))

  // Wire each domain concept into the skeleton so nothing floats unconnected.
  const anchors: { to: string; relation: DecisionEdge['relation'] }[] = [
    { to: 'funding', relation: 'conflicts-with' },
    { to: 'adoption', relation: 'depends-on' },
    { to: 'opposition', relation: 'amplifies' },
    { to: 'proof-point', relation: 'enables' },
    { to: 'objective', relation: 'mitigates' },
  ]
  pack.concepts.slice(0, 5).forEach((c, i) => {
    const a = anchors[i % anchors.length]
    edges.push({
      id: `de-${i}`,
      from: c.id,
      to: a.to,
      relation: a.relation,
      strength: 0.5 + ((hash(c.id + i) % 40) / 100),
      bornAt: i < 2 ? 'models' : 'crossexam',
    })
    edges.push({
      id: `de2-${i}`,
      from: i % 2 === 0 ? 'sequencing' : 'window',
      to: c.id,
      relation: i % 2 === 0 ? 'enables' : 'conflicts-with',
      strength: 0.42 + ((hash(c.id + 'b') % 35) / 100),
      bornAt: 'crossexam',
    })
  })

  return { nodes, edges }
}

/** Universal arguments, one set per agent, phrased through the domain vocabulary. */
function buildInsights(ctx: Ctx, nodes: DecisionNode[]): AgentInsight[] {
  const { pack, j } = ctx
  const has = (id: string) => nodes.some((n) => n.id === id)
  const c = (...ids: string[]) => ids.filter(has)

  const base: Omit<AgentInsight, 'id' | 'confidence'>[] = [
    {
      agent: 'strategist',
      kind: 'hypothesis',
      title: 'The order is the strategy',
      body: `Every move available here has been tried somewhere. What separates the attempts that worked is which one went first. Sequence ${pack.subject} so the cheap, invisible commitments land before anything contested is visible.`,
      phase: 'models',
      concepts: c('sequencing', 'window', 'ratchet'),
    },
    {
      agent: 'researcher',
      kind: 'observation',
      title: 'The comparison is the evidence',
      body: `An uncontrolled result will be dismissed, correctly. ${pack.metric.charAt(0).toUpperCase() + pack.metric.slice(1)} measured against a matched control is the only number that survives a hostile reading, and it has to be committed to before the result is known.`,
      phase: 'models',
      concepts: c('adoption', 'proof-point'),
      evidence: `Primary metric: ${pack.metric}`,
    },
    {
      agent: 'skeptic',
      kind: 'challenge',
      title: 'Name the thing that ends this outright',
      body: `Most risks degrade the plan. One kills it. Here it is the gap between front-loaded cost and back-loaded benefit — ${pack.actor} runs out of authority or money in the interval, and the strategy is never tested at all.`,
      phase: 'models',
      concepts: c('funding', 'window'),
    },
    {
      agent: 'designer',
      kind: 'hypothesis',
      title: 'People route around anything they did not choose',
      body: `Adoption is not a communications problem. If the intended path through ${pack.channel} is harder than the workaround, the workaround becomes the system and acquires defenders of its own.`,
      phase: 'models',
      concepts: c('adoption'),
    },
    {
      agent: 'operator',
      kind: 'observation',
      title: 'Capacity is the real budget',
      body: `${pack.actor.charAt(0).toUpperCase() + pack.actor.slice(1)} can run a small number of hard things at once. Every parallel workstream is drawn from the same pool as the first, which is why ambitious plans read as delay six months in.`,
      phase: 'models',
      concepts: c('capacity', 'proof-point'),
    },
    {
      agent: 'futurist',
      kind: 'opportunity',
      title: 'Build what cannot be undone',
      body: `${pack.ratchet.charAt(0).toUpperCase() + pack.ratchet.slice(1)}. It attracts no opposition while it is being built because it produces nothing to photograph, and it is still working after everyone who authorised it has gone.`,
      phase: 'models',
      concepts: c('ratchet', 'window'),
    },
    {
      agent: 'skeptic',
      kind: 'challenge',
      title: 'The opposition is competent',
      body: `${pack.incumbent.charAt(0).toUpperCase() + pack.incumbent.slice(1)} has better information about the current arrangement than this analysis does. Every plan in the room treats their resistance as friction. It is a counter-strategy, and it is being run by people who do this full time.`,
      phase: 'crossexam',
      concepts: c('opposition', 'window'),
    },
    {
      agent: 'designer',
      kind: 'risk',
      title: 'The first failure is remembered permanently',
      body: `Whoever tries ${pack.subject} first and finds it broken does not try again. Reliability of the first instance matters more than its ambition, because the population that abandons it is the population the case was built on.`,
      phase: 'crossexam',
      concepts: c('proof-point', 'adoption'),
    },
    {
      agent: 'operator',
      kind: 'decision',
      title: 'Answer the operational complaint before it organises',
      body: `Most opposition starts as an unanswered logistics problem and only becomes politics when nobody handles it in the first sixty days. Fund the boring answer before the visible change, not after.`,
      phase: 'crossexam',
      concepts: c('opposition', 'capacity'),
    },
    {
      agent: 'researcher',
      kind: 'observation',
      title: 'Resistance has a half-life',
      body: `Opposition to this class of change peaks at implementation and decays substantially once the alternative is lived rather than imagined. The design problem is surviving the peak, not winning the argument during it.`,
      phase: 'crossexam',
      concepts: c('opposition', 'window'),
      evidence: 'Sentiment typically inverts 14–20 months post-implementation',
    },
    {
      agent: 'futurist',
      kind: 'risk',
      title: 'Success changes who shows up',
      body: `Once ${pack.subject} works, it attracts participants who did not share the original constraints and will not accept the original tradeoffs. The programme ends up negotiating with its own success.`,
      phase: 'futures',
      concepts: c('second-order', 'adoption'),
    },
    {
      agent: 'strategist',
      kind: 'decision',
      title: 'Two instances, not one and not five',
      body: `One instance is dismissed as a special case. Five is an unfunded programme. Two, chosen for contrast rather than for likelihood of success, produce a comparison that survives cross-examination.`,
      phase: 'futures',
      concepts: c('proof-point', 'capacity'),
    },
    {
      agent: 'skeptic',
      kind: 'risk',
      title: 'I would sign the strategy, not the deadline',
      body: `The levers are right and the sequence is defensible. The timeline assumes nothing breaks the chain of authority in between, and that assumption has no evidence behind it in any comparable effort.`,
      phase: 'consensus',
      concepts: c('window', 'objective'),
    },
    {
      agent: 'operator',
      kind: 'decision',
      title: 'Bind the funding before the first visible move',
      body: `Whatever revenue or budget this generates has to be structurally committed to the work before anything contested happens. Unbound, it is reallocated in the second budget cycle and the programme becomes a cost with no benefit attached.`,
      phase: 'consensus',
      concepts: c('funding', 'ratchet'),
    },
  ]

  const domainInsights: Omit<AgentInsight, 'id' | 'confidence'>[] = pack.arguments.map((a, i) => ({
    agent: a.agent as AgentId,
    kind: i === 0 ? 'observation' : i === 1 ? 'hypothesis' : 'challenge',
    title: a.title,
    body: a.body,
    phase: i === 2 ? 'crossexam' : 'models',
    concepts: c(pack.concepts[i % pack.concepts.length]?.id ?? 'objective', 'sequencing'),
    evidence: a.evidence,
  }))

  return [...base, ...domainInsights].map((ins, i) => ({
    ...ins,
    id: `gi-${i}`,
    confidence: clamp(Math.round(76 + j(`i-${i}`) * 18), 52, 94),
  }))
}

function buildThreads(ctx: Ctx): DebateThread[] {
  const { pack, j } = ctx
  const conf = (k: string, base: number) => clamp(Math.round(base + j(k) * 8), 38, 92)

  const spec: { id: string; topic: string; resolved: boolean; moves: Omit<DebateEvent, 'id' | 'thread'>[] }[] = [
    {
      id: 'gt1',
      topic: 'What moves first?',
      resolved: true,
      moves: [
        { move: 'proposal', agent: 'strategist', claim: `Commit the structural changes in the first hundred days, while ${pack.subject} has produced nothing anyone can campaign against.`, confidenceAfter: conf('t1a', 76), concepts: ['sequencing', 'ratchet'], at: 11600 },
        { move: 'challenge', agent: 'skeptic', claim: `Structural commitments with no visible benefit are the easiest thing in the world to repeal. You will have spent the window on paperwork nobody defends.`, confidenceAfter: conf('t1b', 52), concepts: ['window', 'opposition'], at: 12300 },
        { move: 'revision', agent: 'strategist', claim: `Then both, in order: invisible commitments in the first hundred days, ${pack.proofPoint} by month eighteen, expensive irreversible work only once that instance holds up.`, confidenceAfter: conf('t1c', 78), concepts: ['sequencing', 'proof-point'], at: 13400 },
        { move: 'decision', agent: 'operator', claim: `Deliverable in that order. The constraint is capacity, not appetite — one hard workstream at a time, and the second does not start until the first is measured.`, confidenceAfter: conf('t1d', 85), concepts: ['capacity', 'proof-point'], at: 14300 },
      ],
    },
    {
      id: 'gt2',
      topic: `Does ${pack.incumbent} have a real case?`,
      resolved: true,
      moves: [
        { move: 'proposal', agent: 'researcher', claim: `Their stated objection is measurable, and in comparable situations the measurement has favoured the change more often than the incumbent expected.`, confidenceAfter: conf('t2a', 72), concepts: ['opposition', 'adoption'], at: 12000 },
        { move: 'challenge', agent: 'skeptic', claim: `The average hides the casualties. A subset genuinely loses, they are the ones who attend the hearing, and being right on the mean does not help you there.`, confidenceAfter: conf('t2b', 54), concepts: ['opposition'], at: 12800 },
        { move: 'revision', agent: 'designer', claim: `So do not argue the average. Identify the group that actually loses, fund a transition specifically for them, and publish the measurement including the losses.`, confidenceAfter: conf('t2c', 74), concepts: ['opposition', 'adoption'], at: 13700 },
        { move: 'decision', agent: 'operator', claim: `Adopted, with the transition contracted before the first visible change rather than promised alongside it.`, confidenceAfter: conf('t2d', 83), concepts: ['capacity', 'opposition'], at: 14600 },
      ],
    },
    {
      id: 'gt3',
      topic: 'Is the timeline real?',
      resolved: false,
      moves: [
        { move: 'proposal', agent: 'futurist', claim: `Stop optimising for the date. Optimise for ${pack.ratchet} — the date follows from irreversibility, not the other way round.`, confidenceAfter: conf('t3a', 74), concepts: ['ratchet', 'objective'], at: 15200 },
        { move: 'challenge', agent: 'skeptic', claim: `Then say that publicly. Announcing a date and delivering a ratchet is how the next mandate is lost on honesty rather than on results.`, confidenceAfter: conf('t3b', 58), concepts: ['window', 'objective'], at: 15900 },
        { move: 'revision', agent: 'strategist', claim: `The date buys the authority that builds the ratchet. Dropping it costs more than missing it — but the internal plan should be scored on the ratchet.`, confidenceAfter: conf('t3c', 70), concepts: ['window', 'ratchet'], at: 16400 },
      ],
    },
  ]

  return spec.map((t) => ({
    id: t.id,
    topic: t.topic,
    resolved: t.resolved,
    events: t.moves.map((m, i) => ({
      ...m,
      id: `${t.id}-${i}`,
      thread: t.id,
      respondsTo: i > 0 ? `${t.id}-${i - 1}` : undefined,
    })),
  }))
}

function buildScenarios(ctx: Ctx): Scenario[] {
  const { pack, j } = ctx
  const yr = new Date().getFullYear()
  const spec: { id: Scenario['id']; name: string; prob: number; risk: Scenario['risk']; span: number }[] = [
    { id: 'conservative', name: 'Conservative', prob: 71, risk: 'low', span: 18 },
    { id: 'balanced', name: 'Balanced', prob: 57, risk: 'moderate', span: 13 },
    { id: 'moonshot', name: 'Moonshot', prob: 25, risk: 'severe', span: 9 },
  ]

  const milestoneCopy: Record<Scenario['id'], { headline: string; detail: string; metric: string }[]> = {
    conservative: [
      { headline: 'Structure committed, nothing visible', detail: `The commitments that cost nothing and attract no opposition are made and bound. ${pack.subject.charAt(0).toUpperCase() + pack.subject.slice(1)} does not yet exist publicly.`, metric: 'Structural commitments locked · 0 contested changes' },
      { headline: 'One instance, undeniable', detail: `${pack.proofPoint.charAt(0).toUpperCase() + pack.proofPoint.slice(1)}, measured against a matched control chosen before the result was known.`, metric: `Control comparison published · ${pack.metric}` },
      { headline: 'Compounding without attention', detail: 'The invisible changes have altered every decision made since, and nobody has campaigned against them because there is nothing to point at.', metric: 'Second cycle of compounding effects' },
      { headline: 'Quietly changed, narrowly scoped', detail: 'The condition holds where it was applied and nowhere else. Nothing has been reversed, and nothing has been extended either.', metric: 'Zero reversals · limited reach' },
    ],
    balanced: [
      { headline: 'Ratchet set, transition contracted', detail: `Structural commitments made and the group that genuinely loses under ${pack.subject} has a funded transition in contract before anything visible changes.`, metric: 'Commitments bound · transition contracted' },
      { headline: 'Two instances, one comparison', detail: 'Chosen for contrast rather than likelihood of success, so the result is a comparison instead of an anecdote. Sentiment inverts roughly as forecast.', metric: `2 instances · ${pack.metric} vs. control` },
      { headline: 'Expansion follows the measurement', detail: 'Scale-up proceeds only into conditions matching where the evidence was produced. Two candidate expansions are refused on that basis.', metric: 'Expansion gated on evidence · 2 refusals' },
      { headline: 'The default has shifted', detail: `${pack.subject.charAt(0).toUpperCase() + pack.subject.slice(1)} is now the path of least resistance for the majority case. The hard edge cases remain unsolved and are now the whole agenda.`, metric: 'Majority default achieved' },
    ],
    moonshot: [
      { headline: 'Everything at once', detail: `Full commitment in the first season. Opposition organises immediately and support collapses to its floor.`, metric: 'Full commitment · approval at floor' },
      { headline: 'Survived the reversal attempt', detail: 'The repeal effort fails narrowly once the first measured results land. What was structurally committed is now permanent.', metric: 'Reversal defeated · commitments permanent' },
      { headline: 'The counter-move from above', detail: `${pack.incumbent.charAt(0).toUpperCase() + pack.incumbent.slice(1)} escalates to the level that can preempt. The insurance built in year two is the argument that holds.`, metric: 'Preemption blocked · insurance spent' },
      { headline: 'Reference case, uneven inside', detail: 'The outcome is achieved and exported, alongside distributional damage in the first-wave cases that the mitigation only partly absorbed.', metric: 'Objective met · distributional cost carried' },
    ],
  }

  return spec.map((s, i) => ({
    id: s.id,
    name: s.name,
    thesis: pack.scenarioTheses[i],
    probability: clamp(Math.round(s.prob + j(`p-${s.id}`) * 6), 12, 88),
    risk: s.risk,
    horizon: `${yr} – ${yr + s.span}`,
    upside: i === 0 ? `A durable partial result that is never reversed.` : i === 1 ? `The majority case flips, and the effort survives one hostile administration intact.` : `The full objective, achieved early enough to become the reference case others copy.`,
    keyDependency: i === 0 ? 'The invisible commitments pass before attention arrives.' : i === 1 ? 'Both instances clear their control comparison.' : 'Surviving the resistance peak without losing authority.',
    failureMode: i === 0 ? 'Too slow to matter — the horizon passes with a better-organised version of the status quo.' : i === 1 ? 'A leadership change lands during the resistance trough and freezes expansion.' : `Reversal or preemption in year two erases everything not yet structurally committed.`,
    capital: i === 0 ? 'Low, largely absorbed by existing budgets' : i === 1 ? 'Moderate, phased against demonstrated results' : 'High and front-loaded, with limited optionality',
    milestones: ([1, 3, 5, 10] as const).map((year, k) => ({
      year,
      headline: milestoneCopy[s.id][k].headline,
      detail: milestoneCopy[s.id][k].detail,
      metric: milestoneCopy[s.id][k].metric,
    })),
  }))
}

function buildConsensus(ctx: Ctx): Consensus {
  const { pack, j } = ctx
  return {
    move: pack.move,
    moveDetail: pack.moveDetail,
    whyItWins: [
      {
        headline: 'It removes the fairness objection before it can be made',
        detail: `Acting on ${pack.channel} before the alternative exists is a penalty applied to people with no option. Acting after is a choice offered to them. The sequence, not the policy, decides which one ${pack.actor} is accused of.`,
      },
      {
        headline: 'The invisible commitments outlive the authority that made them',
        detail: `${pack.ratchet.charAt(0).toUpperCase() + pack.ratchet.slice(1)} costs little, attracts no organised opposition, and keeps working after the window closes. It is the only lever whose effect grows once attention moves elsewhere.`,
      },
      {
        headline: 'Two instances produce a comparison, not an anecdote',
        detail: `One case is dismissed as special and five is an unfunded programme. Two, chosen for contrast, survive the hostile reading where this is actually decided.`,
      },
    ],
    first72Hours: [
      { hour: 'Hour 0–8', action: `Draft the structural commitment and its funding binding as a single instrument. Split apart, the second one dies alone.`, owner: 'Counsel · Strategist' },
      { hour: 'Hour 8–24', action: `Commission the baseline measurement of ${pack.metric} on both candidate instances and their controls, before anyone has an interest in the number.`, owner: 'Analysis · Researcher' },
      { hour: 'Hour 24–48', action: `Open terms with whoever has to cooperate operationally. Their agreement is the precondition for every visible step that follows.`, owner: 'Delivery · Operator' },
      { hour: 'Hour 48–72', action: `Convene the group that genuinely loses under this plan, with a funded transition already on the table rather than promised.`, owner: 'Engagement · Designer' },
    ],
    criticalAssumptions: [
      { claim: `${pack.proofPoint.charAt(0).toUpperCase() + pack.proofPoint.slice(1)} is achievable inside the first eighteen months`, confidence: clamp(Math.round(78 + j('ca1') * 10), 55, 92) },
      { claim: 'The structural commitments survive challenge from the level above', confidence: clamp(Math.round(72 + j('ca2') * 12), 48, 90) },
      { claim: 'Committed funding is not reallocated in a later budget cycle', confidence: clamp(Math.round(63 + j('ca3') * 12), 40, 84) },
      { claim: `Opposition from ${pack.incumbent} is answerable operationally rather than only with money`, confidence: clamp(Math.round(67 + j('ca4') * 12), 42, 86) },
    ],
    killConditions: [
      { signal: pack.killSignals[0], threshold: 'Two consecutive measurement cycles' },
      { signal: pack.killSignals[1], threshold: 'Any occurrence — halt expansion immediately' },
      { signal: 'Committed funding is redirected away from the work', threshold: 'Any reallocation' },
      { signal: 'Delivery capacity is committed to a second workstream before the first is measured', threshold: 'Any parallel start' },
    ],
    secondOrder: [
      { effect: 'Success changes who participates', detail: pack.secondOrder[0] },
      { effect: 'The visible half gets copied without the structural half', detail: pack.secondOrder[1] },
      { effect: 'The hardest case becomes the whole agenda', detail: `As the ordinary cases are handled, an increasing share of remaining effort exists for one stubborn edge case, and ${pack.subject} quietly becomes a programme about that instead.` },
    ],
    unresolved: [
      {
        question: 'Is the stated timeline achievable, or is the structural change the real deliverable?',
        camps: [
          { agent: 'futurist', position: 'The date is a framing device. Irreversibility is the product and it is reachable.' },
          { agent: 'skeptic', position: 'Then say so publicly rather than announcing a date you expect to miss.' },
          { agent: 'strategist', position: 'The date buys the authority that builds the ratchet. It stays.' },
        ],
      },
      {
        question: `Whether ${pack.incumbent} can be answered operationally or has to be bought out.`,
        camps: [
          { agent: 'operator', position: 'Most of the objection is logistics and can be contracted away in sixty days.' },
          { agent: 'skeptic', position: 'The logistics are the stated reason, not the actual one. Budget for a settlement.' },
        ],
      },
    ],
    confidence: clamp(Math.round(76 + j('cons') * 10), 58, 90),
    dissent: clamp(Math.round(22 + j('diss') * 8), 10, 40),
  }
}

function buildDNA(ctx: Ctx): DecisionDNA {
  const { prompt, j } = ctx
  const p = prompt.toLowerCase()
  const bump = (words: string[], amount: number) => (words.some((w) => p.includes(w)) ? amount : 0)
  const v = (base: number, key: string, extra = 0) => clamp(Math.round(base + j(key) * 12 + extra), 8, 98)
  return {
    ambition: v(80, 'dna-a', bump(['humanity', 'obsolete', 'entirely', 'permanent', 'global'], 12)),
    feasibility: v(66, 'dna-f', -bump(['humanity', 'moon', 'mars', 'obsolete'], 14)),
    reversibility: v(58, 'dna-r', bump(['pilot', 'test', 'trial'], 10)),
    capitalNeed: v(56, 'dna-c', bump(['base', 'grid', 'city', 'national', 'infrastructure'], 18) - bump(['$250', 'bootstrap', 'lean'], 20)),
    timePressure: v(70, 'dna-t', bump(['2030', '2035', '2040', 'before', 'deadline', 'years'], 12)),
    uncertainty: v(68, 'dna-u', bump(['humanity', 'obsolete', 'unnecessary', 'new'], 10)),
  }
}

function buildTelemetry(ctx: Ctx, nodeCount: number, edgeCount: number): Analysis['telemetry'] {
  const { pack, prompt } = ctx
  return [
    { phase: 'parse', at: 120, text: `Mission received · ${prompt.length} chars · natural language` },
    { phase: 'parse', at: 700, text: `Frame selected: ${pack.frame}` },
    { phase: 'parse', at: 1300, text: `Actor resolved: ${pack.actor}` },
    { phase: 'parse', at: 1850, text: `Success condition: ${pack.metric}` },
    { phase: 'constraints', at: 2500, text: 'Scanning for implicit limits…' },
    { phase: 'constraints', at: 3200, text: `Constraint: ${pack.constraints[0]}` },
    { phase: 'constraints', at: 3900, text: `Constraint: ${pack.constraints[1]}` },
    { phase: 'constraints', at: 4500, text: `Constraint: ${pack.constraints[2]}` },
    { phase: 'deploy', at: 5000, text: 'Allocating reasoning budget across 6 specialists' },
    { phase: 'deploy', at: 5450, text: 'STRATEGIST online · doctrine: sequencing over effort' },
    { phase: 'deploy', at: 5800, text: 'RESEARCHER online · evidence threshold strict' },
    { phase: 'deploy', at: 6150, text: 'SKEPTIC online · premortem enabled' },
    { phase: 'deploy', at: 6500, text: 'DESIGNER online · behavioural model loaded' },
    { phase: 'deploy', at: 6850, text: 'OPERATOR online · delivery constraints indexed' },
    { phase: 'deploy', at: 7100, text: 'FUTURIST online · horizon extended past mandate' },
    { phase: 'models', at: 7700, text: 'Six independent problem models under construction' },
    { phase: 'models', at: 8800, text: 'Divergence detected: STRATEGIST ↔ SKEPTIC on sequencing' },
    { phase: 'models', at: 9900, text: `Decision graph seeded · ${Math.round(nodeCount * 0.6)} concepts` },
    { phase: 'models', at: 10900, text: 'Confidence spread across models: 52–94' },
    { phase: 'crossexam', at: 11700, text: 'Cross-examination open · 3 contested threads' },
    { phase: 'crossexam', at: 12900, text: 'SKEPTIC challenge accepted · position under revision' },
    { phase: 'crossexam', at: 14100, text: 'Sequencing inverted: structure precedes visibility' },
    { phase: 'crossexam', at: 15400, text: `Graph expanded · ${nodeCount} concepts · ${edgeCount} relations` },
    { phase: 'crossexam', at: 16300, text: '1 thread unresolved · timeline contested' },
    { phase: 'futures', at: 17000, text: 'Branching surviving strategy into 3 horizons' },
    { phase: 'futures', at: 18200, text: 'Second-order scan · distributional effects flagged' },
    { phase: 'futures', at: 19400, text: 'Speculative dependencies rejected as load-bearing' },
    { phase: 'consensus', at: 20700, text: 'Collapsing insights into one recommendation' },
    { phase: 'consensus', at: 21800, text: 'Dissent recorded: SKEPTIC withholds on timeline' },
    { phase: 'consensus', at: 22700, text: 'Decision DNA sequenced' },
    { phase: 'consensus', at: 23300, text: 'NEXUS consensus reached' },
  ]
}

/** Compose a complete, deterministic analysis for any mission text. */
export function composeAnalysis(prompt: string): Analysis {
  const pack = selectPack(prompt)
  const r = rng(prompt)
  const ctx: Ctx = {
    pack,
    prompt,
    r,
    j: (key) => ((hash(prompt + key) % 2000) / 1000) - 1,
  }

  const { nodes, edges } = buildGraph(ctx)
  const insights = buildInsights(ctx, nodes)
  const threads = buildThreads(ctx)
  const scenarios = buildScenarios(ctx)
  const consensus = buildConsensus(ctx)
  const dna = buildDNA(ctx)
  const telemetry = buildTelemetry(ctx, nodes.length, edges.length)

  return {
    mission: {
      id: `nx-${(hash(prompt) % 1679616).toString(36).padStart(4, '0')}`,
      prompt,
      title: deriveTitle(prompt),
      constraints: pack.constraints,
      createdAt: Date.now(),
      source: 'engine',
    },
    insights,
    threads,
    nodes,
    edges,
    scenarios,
    consensus,
    dna,
    telemetry,
  }
}
