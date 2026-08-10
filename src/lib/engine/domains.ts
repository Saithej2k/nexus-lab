import type { NodeKind } from '@/lib/types'

/**
 * Domain packs.
 *
 * NEXUS reasons with a universal strategic skeleton — leverage, sequencing,
 * funding, adoption, opposition, second-order effects, irreversibility — and a
 * domain pack supplies the vocabulary and the four or five concepts that only
 * make sense inside that field. That split is what keeps generated missions
 * from reading like filled-in templates.
 */

export interface DomainConcept {
  id: string
  label: string
  kind: NodeKind
  rationale: string
  assumptions: string[]
  risks: string[]
}

export interface DomainPack {
  id: string
  /** Lowercase keywords that route a mission to this pack. */
  match: string[]
  /** Displayed as the analysis's frame of reference. */
  frame: string
  /** Noun for the thing being built or changed. */
  subject: string
  /** Who has to act. */
  actor: string
  /** Who loses if this works. */
  incumbent: string
  /** The channel by which the thing reaches people. */
  channel: string
  /** The number that would prove it is working. */
  metric: string
  /** The smallest credible first win. */
  proofPoint: string
  /** What can never be undone once done. */
  ratchet: string
  constraints: string[]
  concepts: DomainConcept[]
  /** Domain-specific arguments, one per named agent. */
  arguments: { agent: string; title: string; body: string; evidence?: string }[]
  scenarioTheses: [string, string, string]
  move: string
  moveDetail: string
  killSignals: [string, string]
  secondOrder: [string, string]
}

const venture: DomainPack = {
  id: 'venture',
  match: ['company', 'startup', 'launch', 'business', 'product', 'revenue', 'consumer', 'robotics', 'saas', 'brand', 'market', '$'],
  frame: 'Venture formation under hard capital constraint',
  subject: 'the product',
  actor: 'the founding team',
  incumbent: 'incumbent manufacturers',
  channel: 'direct distribution',
  metric: 'paid retention at 90 days',
  proofPoint: 'a hundred customers who paid twice',
  ratchet: 'a proprietary data or supply position that compounds with every unit sold',
  constraints: [
    'Capital is fixed and no bridge round is assumed',
    'Runway must survive at least one failed hypothesis',
    'No proprietary technology at the start — only proprietary sequencing',
    'Founding team cannot exceed what the capital sustains for 18 months',
  ],
  concepts: [
    {
      id: 'unit-economics',
      label: 'Unit economics',
      kind: 'constraint',
      rationale:
        'A hardware business that is unprofitable per unit does not become profitable at scale — it becomes insolvent faster. Margin must exist at the first hundred units, not be promised at the ten-thousandth.',
      assumptions: ['Landed cost is known within 15%', 'Returns run below 8%'],
      risks: ['Tooling amortisation hides negative margin until volume arrives'],
    },
    {
      id: 'wedge',
      label: 'The wedge use case',
      kind: 'lever',
      rationale:
        'A single job that the product does dramatically better than anything else, for a customer who already spends money on the problem. Broad positioning at this capital level is indistinguishable from having no customers.',
      assumptions: ['The wedge segment is reachable without paid acquisition'],
      risks: ['A wedge too narrow to expand from is a lifestyle business'],
    },
    {
      id: 'supply-chain',
      label: 'Supply chain fragility',
      kind: 'risk',
      rationale:
        'One contract manufacturer, one component with a 26-week lead time, and one currency exposure. Any of the three can end the company between funding events.',
      assumptions: ['Second-source qualification is possible within two quarters'],
      risks: ['MOQ commitments consume the runway that de-risking requires'],
    },
    {
      id: 'trust-barrier',
      label: 'Trust barrier',
      kind: 'constraint',
      rationale:
        'Consumers buy hardware from unknown companies only when the downside is bounded. Warranty, return policy, and repairability are not customer service — they are the pricing of perceived risk.',
      assumptions: ['Return logistics are affordable at pilot volume'],
      risks: ['A generous policy at low margin is a slow-motion refund of the raise'],
    },
  ],
  arguments: [
    {
      agent: 'operator',
      title: 'The capital only buys one attempt',
      body: 'At this level, tooling, certification, and first inventory consume most of the raise before a single unit ships. That means one product hypothesis, tested to conclusion, with no budget for a pivot that requires new tooling.',
      evidence: 'Injection tooling alone typically absorbs 20–35% of a pre-seed hardware raise',
    },
    {
      agent: 'researcher',
      title: 'Pre-orders are a market test, not financing',
      body: 'Crowdfunded hardware ships late roughly three quarters of the time, and late shipping converts early advocates into the loudest detractors. Use pre-orders to price demand, never to fund the bill of materials.',
      evidence: '~75% of funded hardware campaigns miss their stated ship date',
    },
    {
      agent: 'skeptic',
      title: 'Incumbents do not need to be better, only adequate',
      body: 'A large manufacturer shipping a mediocre version through existing retail beats an excellent product with no shelf. The defensible question is not whether they can copy it — it is whether they notice before the data position compounds.',
    },
  ],
  scenarioTheses: [
    'Ship one narrow product to one segment, reach profitability at low volume, and refuse every expansion that requires new tooling.',
    'Prove the wedge, then use the retention data — not the revenue — to raise on terms that fund the second product line.',
    'Spend the entire raise on a category-defining launch and treat distribution partnerships as the only survivable outcome.',
  ],
  move: 'Sell to the segment that already pays for the problem, and let the data position — not the product — become the moat.',
  moveDetail:
    'One wedge use case, one manufacturing partner, one distribution channel, and a deliberate refusal to expand until paid retention at 90 days clears the bar. Everything else is a future funded by that number.',
  killSignals: ['Paid retention at 90 days stays below the bar for two consecutive cohorts', 'Landed unit cost fails to fall with the second production run'],
  secondOrder: [
    'The support burden of early hardware customers becomes the de facto product roadmap, and it will not point where the strategy does.',
    'Winning the wedge segment teaches incumbents exactly which category to enter, on a timeline set by your own marketing.',
  ],
}

const city: DomainPack = {
  id: 'city',
  match: ['city', 'urban', 'transit', 'street', 'mall', 'neighborhood', 'neighbourhood', 'housing', 'downtown', 'car', 'traffic', 'district', 'municipal', 'zoning'],
  frame: 'Urban intervention inside a hostile political clock',
  subject: 'the intervention',
  actor: 'the municipal executive',
  incumbent: 'the existing use of the space',
  channel: 'the street itself',
  metric: 'measured behaviour change on the pilot site versus a control site',
  proofPoint: 'one site people can stand in',
  ratchet: 'zoning changes and poured concrete that cost more to reverse than to keep',
  constraints: [
    'Authority ends at the jurisdiction boundary; preemption from above is live',
    'Any change is reversible by the next administration unless physically built',
    'Displacement of existing residents is not an acceptable cost',
    'The existing building stock and street grid stay in place',
  ],
  concepts: [
    {
      id: 'political-window',
      label: 'Political window',
      kind: 'constraint',
      rationale:
        'Roughly four years of usable mandate. Anything not built or bound in statute before it closes is a proposal, not a policy.',
      assumptions: ['Opposition campaigns explicitly on reversal'],
      risks: ['A mid-programme election lands in the resistance trough'],
    },
    {
      id: 'public-resistance',
      label: 'Public resistance',
      kind: 'risk',
      rationale:
        'Opposition peaks at implementation and decays after roughly eighteen months of lived experience. The plan must survive the peak, not win the argument during it.',
      assumptions: ['Approval inverts once the counterfactual is lived'],
      risks: ['An organised reversal campaign converts temporary anger into permanent policy'],
    },
    {
      id: 'local-commerce',
      label: 'Local commerce',
      kind: 'outcome',
      rationale:
        'Merchants consistently overestimate how many customers arrive by car — often by three to four times. The opposition is genuine and its factual basis is measurable before the fight begins.',
      assumptions: ['Retail mix survives the transition period'],
      risks: ['Destination retail and trades genuinely do lose'],
    },
    {
      id: 'displacement',
      label: 'Displacement pressure',
      kind: 'risk',
      rationale:
        'Places that become pleasant become expensive. The intervention mechanically prices out the residents whose needs justified it.',
      assumptions: ['Uplift of 8–15% within 300m of the change'],
      risks: ['Anti-displacement tools arrive years after the uplift starts'],
    },
  ],
  arguments: [
    {
      agent: 'operator',
      title: 'Paint is reversible; concrete is not',
      body: 'A work order erases paint in a morning. Kerbs, raised tables, and planters require a capital project to undo. Anything meant to outlive the administration has to be poured, not painted.',
    },
    {
      agent: 'researcher',
      title: 'Opposition has a half-life of about eighteen months',
      body: 'Across comparable interventions, approval inverts roughly a year and a half after implementation. The design problem is surviving months three through eighteen, not persuading anyone during them.',
      evidence: 'Approval typically inverts at month 14–20 post-implementation',
    },
    {
      agent: 'designer',
      title: 'One site people can stand in beats any model',
      body: 'Residents adopt what they can see and hear. A single completed site converts more opposition than a decade of modelling, which is why the first site should be chosen for how different it feels rather than how well it scores.',
    },
  ],
  scenarioTheses: [
    'Change only what compounds invisibly — code, statute, procurement — and never hand the opposition a photograph.',
    'Set the invisible ratchets first, buy proof with two contrasting pilot sites, and expand only into demonstrated success.',
    'Treat the first mandate as the only one and make reversal physically impossible before the backlash can organise.',
  ],
  move: 'Bind the invisible changes in the first hundred days, then buy proof with two contrasting sites before touching anything contested.',
  moveDetail:
    'Code and statute change while there is nothing visible to campaign against. Two pilot sites chosen for demographic contrast produce a comparison rather than an anecdote, and expansion follows measured behaviour, not the calendar.',
  killSignals: ['Pilot site behaviour fails to diverge from the control site after two quarters', 'A preemption bill clears committee at the level above'],
  secondOrder: [
    'The intervention becomes an amenity, the amenity becomes a price signal, and the price signal removes the population the case was built on.',
    'Neighbouring jurisdictions copy the visible half of the programme without the funding mechanism, and the failures are attributed to the original.',
  ],
}

const institution: DomainPack = {
  id: 'institution',
  match: ['university', 'school', 'degree', 'education', 'learning', 'student', 'curriculum', 'credential', 'teach', 'training', 'hospital', 'healthcare', 'clinic', 'patient'],
  frame: 'Institutional displacement against an entrenched credential',
  subject: 'the institution',
  actor: 'the founding faculty and operators',
  incumbent: 'the accredited incumbent',
  channel: 'employer recognition',
  metric: 'placement outcomes against a matched cohort from the incumbent',
  proofPoint: 'one cohort whose outcomes an employer will vouch for on the record',
  ratchet: 'employer hiring agreements and an alumni network that only grows',
  constraints: [
    'The incumbent holds accreditation, and accreditation gates financing',
    'Outcomes take a full cohort cycle to measure, and reputation lags outcomes',
    'Faculty quality cannot be bought at the price the model can sustain',
    'Regulatory status determines whether the thing can call itself what it is',
  ],
  concepts: [
    {
      id: 'signal-value',
      label: 'Credential signal value',
      kind: 'constraint',
      rationale:
        'The incumbent’s product is not teaching, it is a signal employers trust without verification. Replacing the teaching is easy; replacing the signal takes a decade of outcomes.',
      assumptions: ['Employers will accept an alternative signal if verification is cheaper'],
      risks: ['The signal is defended by everyone who already paid for it'],
    },
    {
      id: 'cohort-cycle',
      label: 'Cohort feedback cycle',
      kind: 'constraint',
      rationale:
        'Every improvement is tested on a cohort that takes years to finish. The learning rate of the institution is bounded by the length of its own programme.',
      assumptions: ['Shorter programmes can iterate faster without losing depth'],
      risks: ['Compressing the cycle destroys the outcome data it exists to produce'],
    },
    {
      id: 'employer-network',
      label: 'Employer network',
      kind: 'lever',
      rationale:
        'A small number of employers who commit to interview graduates converts a novel credential into a real one faster than any accreditation process.',
      assumptions: ['Employers face genuine hiring scarcity in the target field'],
      risks: ['Employer commitments evaporate in a downturn, exactly when cohorts need them'],
    },
    {
      id: 'selection-effect',
      label: 'Selection effect',
      kind: 'risk',
      rationale:
        'Early cohorts are unusually motivated, which flatters outcomes. The model looks proven right up until it admits the students it was built for.',
      assumptions: ['Outcome measurement controls for prior attainment'],
      risks: ['The published number is the selection effect, not the teaching'],
    },
  ],
  arguments: [
    {
      agent: 'skeptic',
      title: 'You are competing with a subsidy, not a product',
      body: 'The incumbent’s price is distorted by financing that the alternative cannot access. Being better and cheaper still loses to being worse and financed, and that gap is policy, not product.',
    },
    {
      agent: 'researcher',
      title: 'Outcomes only persuade when they are matched',
      body: 'Unmatched placement rates are dismissed as selection, correctly. A matched-cohort comparison, published including the failures, is the only evidence that has ever moved employer behaviour.',
    },
    {
      agent: 'designer',
      title: 'Students buy certainty, not pedagogy',
      body: 'Nobody chooses an institution on instructional method. They choose on what happens after. Every design decision should be judged by whether it makes the post-graduation outcome more legible before enrolment.',
    },
  ],
  scenarioTheses: [
    'Serve one field with acute hiring scarcity, stay small, and let placement outcomes accumulate without ever claiming to replace anything.',
    'Prove one field, syndicate the employer network, and expand only into fields where the same scarcity exists.',
    'Attack the credential directly, publish matched outcomes against named incumbents, and accept the institutional hostility that follows.',
  ],
  move: 'Win one field where hiring scarcity is acute, and let a matched-cohort outcome — published with its failures — do the work accreditation would take a decade to do.',
  moveDetail:
    'A narrow programme, employer interview commitments secured before the first cohort enrols, and outcome reporting designed to survive the accusation of selection bias.',
  killSignals: ['Matched-cohort placement fails to beat the incumbent by a clear margin', 'Employer interview commitments are not renewed for a second cohort'],
  secondOrder: [
    'The incumbent copies the employer-partnership model with vastly more reach, and the innovation ends up strengthening the thing it targeted.',
    'Success attracts students who chose it for price rather than field, and the cohort composition quietly erodes the outcome number the model runs on.',
  ],
}

const frontier: DomainPack = {
  id: 'frontier',
  match: ['moon', 'mars', 'space', 'orbit', 'lunar', 'rocket', 'satellite', 'humanity', 'planet', 'colony', 'base'],
  frame: 'Multi-decade programme across hostile funding cycles',
  subject: 'the programme',
  actor: 'the programme authority',
  incumbent: 'the existing cost structure',
  channel: 'launch cadence',
  metric: 'cost per kilogram delivered to the destination',
  proofPoint: 'one uncrewed system that operates for a full cycle without intervention',
  ratchet: 'infrastructure already emplaced that any successor programme would have to pay to remove',
  constraints: [
    'The programme outlives every administration that funds it',
    'No physics can be assumed to improve on schedule',
    'A single crewed loss pauses everything for years',
    'International legal status of resources is unresolved',
  ],
  concepts: [
    {
      id: 'cadence',
      label: 'Launch cadence',
      kind: 'lever',
      rationale:
        'Cost falls with flight rate, not with engineering. A programme that flies rarely pays for reliability it never accumulates, and every flight carries the full weight of caution.',
      assumptions: ['Flight rate is limited by demand, not by pads'],
      risks: ['Cadence built on one vehicle is one anomaly away from zero'],
    },
    {
      id: 'isru',
      label: 'In-situ resource use',
      kind: 'lever',
      rationale:
        'Every kilogram made at the destination is a kilogram that never has to be launched. It is the only lever whose returns grow with the size of the programme.',
      assumptions: ['Local volatiles are accessible at the chosen site'],
      risks: ['Prospecting data is thin enough that site selection is partly a bet'],
    },
    {
      id: 'political-continuity',
      label: 'Political continuity',
      kind: 'constraint',
      rationale:
        'The programme spans at least four funding authorities. Its real engineering problem is designing milestones that a hostile successor finds more expensive to cancel than to continue.',
      assumptions: ['Industrial base is distributed across enough constituencies'],
      risks: ['A single cancellation cycle erases a decade of tooling and staff'],
    },
    {
      id: 'crew-risk',
      label: 'Crew risk exposure',
      kind: 'risk',
      rationale:
        'A crewed loss does not merely cost lives and hardware — it converts the programme from an achievement into a hearing, and the pause outlasts the investigation.',
      assumptions: ['Uncrewed validation precedes every crewed first'],
      risks: ['Schedule pressure is the documented cause of every historical loss'],
    },
  ],
  arguments: [
    {
      agent: 'operator',
      title: 'Uncrewed first, always, and slower than anyone wants',
      body: 'Every crewed milestone should be preceded by the same operation run uncrewed for a full cycle. The schedule cost is real; it is smaller than the multi-year pause a loss produces.',
    },
    {
      agent: 'strategist',
      title: 'Emplace infrastructure before asking for permission',
      body: 'Hardware already at the destination reframes the funding conversation from whether to go to whether to abandon what is already there. Sequence the cheap, boring, emplaceable things first.',
    },
    {
      agent: 'futurist',
      title: 'The resource legal question arrives before the resource',
      body: 'The first extraction operation will provoke a legal contest that no treaty currently resolves. Whoever operates first sets the precedent, which makes an unglamorous demonstration strategically enormous.',
    },
  ],
  scenarioTheses: [
    'Uncrewed, incremental, and cadence-driven: build the logistics chain and let the crewed milestone follow when it is cheap.',
    'Emplace infrastructure with uncrewed flights, then crew a site that already has power, shelter, and a return path waiting.',
    'Commit to a crewed date publicly and use the deadline to force the cost structure down, accepting the risk that the deadline sets the pace.',
  ],
  move: 'Buy cadence and emplace infrastructure uncrewed, so the crewed milestone becomes the cheapest remaining step rather than the programme’s entire risk budget.',
  moveDetail:
    'Flight rate before capability, local resource extraction demonstrated by an uncrewed system, and every crewed first preceded by the identical operation run without people aboard.',
  killSignals: ['Cost per kilogram fails to fall across three consecutive flight blocks', 'Site prospecting returns insufficient accessible volatiles'],
  secondOrder: [
    'A working extraction demonstration triggers the resource-rights contest years before any treaty framework is ready to absorb it.',
    'The industrial base built for the programme becomes its own constituency, and it will lobby for the architecture that employs it rather than the one that works.',
  ],
}

const systems: DomainPack = {
  id: 'systems',
  match: ['grid', 'energy', 'power', 'climate', 'carbon', 'water', 'food', 'supply', 'country', 'national', 'fossil', 'emissions', 'infrastructure'],
  frame: 'Large-system transition with sovereign-scale financing',
  subject: 'the system',
  actor: 'the sponsoring authority',
  incumbent: 'the incumbent asset owners',
  channel: 'the physical network',
  metric: 'delivered cost per unit against the incumbent',
  proofPoint: 'one region running on the new system through a full demand peak',
  ratchet: 'assets with forty-year lives that no successor will strand',
  constraints: [
    'Capital cost is front-loaded and benefits are back-loaded',
    'The incumbent owns the network the replacement has to use',
    'Reliability failures are politically fatal in a way cost overruns are not',
    'Financing terms depend on a sovereign credit position outside the plan’s control',
  ],
  concepts: [
    {
      id: 'financing-cost',
      label: 'Cost of capital',
      kind: 'constraint',
      rationale:
        'For capital-intensive infrastructure, the interest rate does more to determine viability than the technology does. A two-point move outweighs a decade of efficiency gains.',
      assumptions: ['Concessional or sovereign-backed financing is reachable'],
      risks: ['Currency exposure converts a viable project into an insolvent one'],
    },
    {
      id: 'reliability',
      label: 'Reliability floor',
      kind: 'constraint',
      rationale:
        'The public tolerates expense and does not tolerate outages. One bad week during peak demand sets the transition back further than any cost overrun.',
      assumptions: ['Firming capacity is contracted before retirement of the old asset'],
      risks: ['Retiring incumbent capacity on schedule rather than on evidence'],
    },
    {
      id: 'stranded-assets',
      label: 'Stranded asset resistance',
      kind: 'risk',
      rationale:
        'Owners of assets with thirty years of remaining book value will litigate, lobby, and delay. Their resistance is rational and cannot be argued away, only bought out or outlasted.',
      assumptions: ['Buyout is cheaper than the delay it prevents'],
      risks: ['Compensation sets a precedent every subsequent owner will claim'],
    },
    {
      id: 'demand-shape',
      label: 'Demand shape',
      kind: 'lever',
      rationale:
        'Moving when demand happens is consistently cheaper than building the capacity to meet it where it is. It is also the least visible and least funded intervention available.',
      assumptions: ['Tariff structures can be changed by the same authority'],
      risks: ['Shifting demand redistributes cost onto those least able to shift'],
    },
  ],
  arguments: [
    {
      agent: 'researcher',
      title: 'The interest rate is the technology',
      body: 'For assets where nearly all cost is up front, financing terms dominate the levelised cost. Securing concessional capital is worth more than any plausible improvement in conversion efficiency.',
    },
    {
      agent: 'skeptic',
      title: 'Retirement schedules are written on optimism',
      body: 'Incumbent capacity is retired on a date and replaced on a delivery estimate. When the estimate slips, the date does not, and the resulting shortfall is what ends transitions politically.',
    },
    {
      agent: 'operator',
      title: 'Contract firming before you announce retirement',
      body: 'The order is not negotiable: firming capacity contracted, then commissioning demonstrated through a full peak, then retirement announced. Any other sequence gambles the programme on a schedule.',
    },
  ],
  scenarioTheses: [
    'Add capacity without retiring anything, prove reliability through several peaks, and let economics retire the incumbent on its own schedule.',
    'Region by region: prove one through a full demand peak, then replicate with financing raised against the demonstrated asset.',
    'Nationwide build-out on concessional capital, accepting reliability exposure in exchange for a decade of avoided lock-in.',
  ],
  move: 'Prove one region through a full demand peak before announcing a single retirement, and spend the political capital on financing terms rather than on targets.',
  moveDetail:
    'Firming contracted first, one region commissioned and tested against real peak demand, financing raised against the demonstrated asset, and retirement schedules driven by evidence instead of by announcement.',
  killSignals: ['Delivered cost fails to close the gap with the incumbent after the first region', 'Reliability degrades during any peak demand event'],
  secondOrder: [
    'Cheap abundant supply induces demand nobody modelled, and the transition ends up chasing a load curve it created.',
    'Incumbent owners extract compensation precedents in the first buyout that make every subsequent region more expensive than the last.',
  ],
}

const generic: DomainPack = {
  id: 'generic',
  match: [],
  frame: 'Strategic intervention under contested conditions',
  subject: 'the initiative',
  actor: 'the sponsoring team',
  incumbent: 'the current arrangement',
  channel: 'the primary adoption path',
  metric: 'measured behaviour change against a control',
  proofPoint: 'one instance that works without heroics',
  ratchet: 'commitments and structures that are expensive to unwind',
  constraints: [
    'Authority is narrower than the problem',
    'The benefit arrives after the political or financial cost',
    'Reversal is cheap until something is structurally committed',
    'Measurement lags the decisions that need it',
  ],
  concepts: [
    {
      id: 'coalition',
      label: 'Coalition durability',
      kind: 'actor',
      rationale:
        'The coalition that authorises the work is not the coalition that has to live with it. Anything requiring sustained agreement past the first hard tradeoff needs a structure, not goodwill.',
      assumptions: ['Key parties have aligned interests for at least two years'],
      risks: ['The coalition fractures at exactly the moment costs become concrete'],
    },
    {
      id: 'measurement',
      label: 'Measurement lag',
      kind: 'constraint',
      rationale:
        'Decisions arrive faster than evidence. Without a pre-committed measurement plan, the programme will be judged on anecdote by people who already decided.',
      assumptions: ['A credible control comparison exists'],
      risks: ['Metrics chosen after the fact are correctly read as advocacy'],
    },
    {
      id: 'incumbent-defence',
      label: 'Incumbent defence',
      kind: 'risk',
      rationale:
        'Whoever benefits from the current arrangement has more information about it than you do, and their resistance is competent rather than merely obstructive.',
      assumptions: ['Their objections have a factual core that can be addressed'],
      risks: ['Treating rational opposition as ignorance guarantees losing to it'],
    },
    {
      id: 'first-instance',
      label: 'First working instance',
      kind: 'lever',
      rationale:
        'One instance that works without heroics converts more opposition than any amount of modelling, and it is the only artefact that survives a change of leadership.',
      assumptions: ['A representative site or segment is available'],
      risks: ['A pilot resourced unrepresentatively proves nothing about scale'],
    },
  ],
  arguments: [
    {
      agent: 'strategist',
      title: 'Order beats effort',
      body: 'Most failures here are correctly-chosen actions taken in the wrong order. The same set of moves, resequenced so that each one makes the next cheaper, usually changes the outcome more than adding resources.',
    },
    {
      agent: 'skeptic',
      title: 'Name the thing that ends this',
      body: 'Every plan has one failure mode that ends it outright rather than degrading it. If nobody in the room can name it, the plan has not been examined — it has been presented.',
    },
    {
      agent: 'designer',
      title: 'People route around anything they did not choose',
      body: 'Adoption is not a communications problem. If the intended behaviour is harder than the workaround, the workaround becomes the system, and it will be defended.',
    },
  ],
  scenarioTheses: [
    'Change only what is cheap and reversible, accumulate evidence, and expand no faster than the measurement supports.',
    'Commit structurally where it is invisible, prove one instance publicly, then expand into demonstrated results.',
    'Commit fully and early, accept the resistance peak, and make reversal structurally expensive before opposition organises.',
  ],
  move: 'Commit the invisible structural changes first, then buy proof with one representative instance before touching anything contested.',
  moveDetail:
    'Structure and commitments land while there is nothing visible to oppose. One representative instance produces evidence rather than an anecdote, and expansion follows the measurement instead of the calendar.',
  killSignals: ['The first instance fails to diverge from its control after two measurement cycles', 'The authorising coalition loses a key party before the instance completes'],
  secondOrder: [
    'Success changes who is attracted to the programme, and the new participants will not share the original constraints.',
    'The visible half of the approach gets copied without the structural half, and the resulting failures are attributed to the original.',
  ],
}

export const DOMAIN_PACKS: DomainPack[] = [venture, city, institution, frontier, systems]
export const GENERIC_PACK = generic

export function selectPack(prompt: string): DomainPack {
  const p = prompt.toLowerCase()
  let best: DomainPack | null = null
  let bestScore = 0
  for (const pack of DOMAIN_PACKS) {
    const score = pack.match.reduce((n, kw) => (p.includes(kw) ? n + 1 : n), 0)
    if (score > bestScore) {
      bestScore = score
      best = pack
    }
  }
  return bestScore > 0 && best ? best : generic
}
