import { useNexus } from '@/hooks/useNexus'
import { AgentFeed, Constellation } from '@/components/agents/Constellation'
import { DecisionGraph } from '@/components/graph/DecisionGraph'
import { DebateTimeline } from '@/components/debate/DebateTimeline'
import { ScenarioBranches } from '@/components/scenarios/ScenarioBranches'
import { ConsensusBriefing } from '@/components/consensus/ConsensusBriefing'
import { DecisionDNAPanel } from '@/components/consensus/DecisionDNAPanel'
import { PhaseSequence } from '@/components/simulation/PhaseSequence'
import { TelemetryFeed } from '@/components/simulation/TelemetryFeed'
import { InsightStream } from './InsightStream'
import { Label, SectionHeader } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

export function Lab() {
  const { analysis, focusMode, status } = useNexus()

  /*
   * Sections are never animated in.
   *
   * An entry fade means the content is invisible until a frame loop runs, and a
   * starved or throttled loop leaves a section at zero opacity with no way back.
   * Motion here belongs to things that carry state — agents waking, concepts
   * entering the graph, debate moves landing — not to the containers.
   */

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 instrument-grid opacity-70" aria-hidden />

      <div
        className={cn(
          'relative mx-auto grid max-w-[1600px] gap-8 px-3 pb-32 pt-6 sm:px-5 lg:gap-10',
          focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[13.5rem_minmax(0,1fr)]',
        )}
      >
        {!focusMode && (
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-20 space-y-6">
              <div>
                <Label>Sequence</Label>
                <div className="mt-2">
                  <PhaseSequence />
                </div>
              </div>
              {analysis && (
                <div>
                  <Label>Mission brief</Label>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">
                    {analysis.mission.prompt}
                  </p>
                  <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {analysis.mission.constraints.map((c) => (
                      <li key={c} className="flex gap-2 text-[0.75rem] leading-snug text-ink-faint">
                        <span className="text-signal">·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="min-w-0 space-y-14 lg:space-y-20">
          <div className="lg:hidden print:hidden">
            <PhaseSequence orientation="horizontal" />
          </div>

          <section aria-labelledby="h-swarm">
            <SectionHeader
              id="section-swarm"
              index="01"
              title="Agent swarm"
              caption="Six specialists reasoning against each other in real time. Select any node to inspect what it has actually contributed."
            />
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="border border-line bg-surface/30 p-2 sm:p-4">
                <div className="mx-auto max-w-[620px]">
                  <Constellation />
                </div>
                <div className="mt-3 md:hidden">
                  <AgentFeed />
                </div>
              </div>
              <div className="min-h-[18rem] max-h-[26rem] xl:max-h-[38rem]">
                <TelemetryFeed height="" />
              </div>
            </div>
            <div className="mt-5">
              <InsightStream />
            </div>
          </section>

          <section aria-labelledby="h-graph">
            <SectionHeader
              id="section-graph"
              index="02"
              title="Live decision graph"
              caption="Concepts enter as the agents raise them. Drag to pan, scroll or pinch to zoom, click any concept to see who argued about it and what it depends on."
            />
            <DecisionGraph />
          </section>

          <section aria-labelledby="h-debate">
            <SectionHeader
              id="section-debate"
              index="03"
              title="Cross-examination"
              caption="Proposal, challenge, revision, decision. The confidence trace shows where each argument actually changed its mind."
            />
            <DebateTimeline />
          </section>

          <section aria-labelledby="h-scenarios">
            <SectionHeader
              id="section-scenarios"
              index="04"
              title="Future simulator"
              caption="Three branches from one present. Select a branch to rewrite the ten-year timeline beneath it."
            />
            {analysis ? <ScenarioBranches /> : null}
          </section>

          <section aria-labelledby="h-consensus">
            <SectionHeader
              id="section-consensus"
              index="05"
              title="Nexus consensus"
              caption="One decisive move, the reasoning behind it, and the disagreements that were never resolved."
            />
            <ConsensusBriefing />
          </section>

          <section aria-labelledby="h-dna">
            <SectionHeader
              id="section-dna"
              index="06"
              title="Decision DNA"
              caption="A fingerprint of the mission's decision profile — the shape you would recognise across a wall of them."
            />
            {analysis && status !== 'idle' ? (
              <DecisionDNAPanel dna={analysis.dna} />
            ) : (
              <div className="border border-dashed border-line px-4 py-14 text-center text-sm text-ink-faint">
                Sequenced once consensus is reached.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
