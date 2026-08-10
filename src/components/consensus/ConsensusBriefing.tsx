import { AGENTS } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { Label } from '@/components/ui/primitives'
import { ConfidenceRing } from './ConfidenceRing'

/** Reads as an intelligence briefing: hierarchy first, decoration never. */
export function ConsensusBriefing() {
  const { analysis, status, phase } = useNexus()
  if (!analysis) return null

  const c = analysis.consensus
  const reached = status === 'complete' || phase === 'consensus'

  if (!reached) {
    return (
      <div className="border border-dashed border-line px-4 py-16 text-center">
        <p className="text-sm text-ink-faint">
          Consensus is synthesised in phase 07, after cross-examination and future simulation.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-line bg-surface/40">
      <div className="grid gap-8 border-b border-line p-6 lg:grid-cols-[240px_1fr] lg:gap-10 lg:p-8">
        <div>
          <ConfidenceRing confidence={c.confidence} dissent={c.dissent} />
        </div>
        <div className="min-w-0">
          <Label>Nexus consensus · the move</Label>
          <h3
            className="display mt-3 text-[clamp(1.5rem,3.2vw,2.5rem)] leading-[1.12] text-ink text-balance"
          >
            {c.move}
          </h3>
          <p className="mt-4 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-dim text-pretty">
            {c.moveDetail}
          </p>
        </div>
      </div>

      <section className="border-b border-line p-6 lg:p-8">
        <Label>Why it wins</Label>
        <ol className="mt-4 grid gap-6 md:grid-cols-3">
          {c.whyItWins.map((w, i) => (
            <li key={w.headline}>
              <span className="font-mono text-[0.6875rem] tabular-nums text-signal">0{i + 1}</span>
              <h4 className="mt-1.5 text-[0.9375rem] leading-snug text-ink text-pretty">{w.headline}</h4>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{w.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-b border-line p-6 lg:p-8">
        <Label>First 72 hours</Label>
        <ol className="mt-4 divide-y divide-line border border-line">
          {c.first72Hours.map((a) => (
            <li key={a.hour} className="grid gap-2 p-4 sm:grid-cols-[7.5rem_1fr_11rem] sm:items-baseline sm:gap-4">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-signal">{a.hour}</span>
              <p className="text-[0.875rem] leading-relaxed text-ink text-pretty">{a.action}</p>
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint sm:text-right">
                {a.owner}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-px border-b border-line bg-line lg:grid-cols-2">
        <section className="bg-surface/60 p-6 lg:p-8">
          <Label>Critical assumptions</Label>
          <ul className="mt-4 space-y-4">
            {c.criticalAssumptions.map((a) => (
              <li key={a.claim}>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[0.875rem] leading-relaxed text-ink text-pretty">{a.claim}</p>
                  <span className="font-mono text-[0.75rem] tabular-nums text-ink-dim">{a.confidence}</span>
                </div>
                <div className="mt-2 h-[3px] bg-raised">
                  <div
                    className="h-full transition-[width] duration-700 ease-instrument"
                    style={{
                      width: `${a.confidence}%`,
                      background: a.confidence < 65 ? 'rgb(var(--caution))' : 'rgb(var(--signal))',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-surface/60 p-6 lg:p-8">
          <Label>Kill conditions</Label>
          <ul className="mt-4 space-y-3">
            {c.killConditions.map((k) => (
              <li key={k.signal} className="border-l-2 border-hazard/60 pl-3">
                <p className="text-[0.875rem] leading-relaxed text-ink text-pretty">{k.signal}</p>
                <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-hazard">{k.threshold}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="border-b border-line p-6 lg:p-8">
        <Label>Second-order effects</Label>
        <ul className="mt-4 grid gap-5 md:grid-cols-2">
          {c.secondOrder.map((s) => (
            <li key={s.effect} className="border border-line bg-raised/30 p-4">
              <h4 className="text-[0.9375rem] leading-snug text-ink text-pretty">{s.effect}</h4>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="p-6 lg:p-8">
        <Label>Unresolved disagreements</Label>
        <ul className="mt-4 space-y-6">
          {c.unresolved.map((u) => (
            <li key={u.question}>
              <h4 className="text-[0.9375rem] leading-snug text-ink text-pretty">{u.question}</h4>
              <ul className="mt-3 space-y-2.5">
                {u.camps.map((camp) => (
                  <li
                    key={camp.agent + camp.position}
                    className="border-l-2 pl-3"
                    style={{ borderColor: `rgb(var(${AGENTS[camp.agent].hueVar}))` }}
                  >
                    <span
                      className="font-mono text-[0.625rem] uppercase tracking-[0.14em]"
                      style={{ color: `rgb(var(${AGENTS[camp.agent].hueVar}))` }}
                    >
                      {AGENTS[camp.agent].name}
                    </span>
                    <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{camp.position}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
