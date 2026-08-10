import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { DebateMove } from '@/lib/types'
import { AGENTS } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { Label, Pill } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

const MOVE_META: Record<DebateMove, { label: string; glyph: string; tone: string }> = {
  proposal: { label: 'Proposal', glyph: '→', tone: 'text-signal' },
  challenge: { label: 'Challenge', glyph: '✕', tone: 'text-hazard' },
  revision: { label: 'Revision', glyph: '↻', tone: 'text-caution' },
  decision: { label: 'Decision', glyph: '▣', tone: 'text-thrive' },
}

/** Confidence trace across a thread — the shape of an argument changing its mind. */
function ConfidenceTrace({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 100
  const h = 26
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / 100) * h] as const)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-6 w-full" aria-hidden>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="rgb(var(--signal) / 0.08)" />
      <path d={d} fill="none" stroke="rgb(var(--signal))" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="rgb(var(--signal))" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

export function DebateTimeline() {
  const { analysis, visible, reducedMotion } = useNexus()

  const threads = useMemo(() => {
    if (!analysis) return []
    const seen = new Set(visible.events.map((e) => e.id))
    return analysis.threads
      .map((t) => ({ ...t, events: t.events.filter((e) => seen.has(e.id)) }))
      .filter((t) => t.events.length > 0)
  }, [analysis, visible.events])

  if (!analysis) return null

  if (threads.length === 0) {
    return (
      <div className="border border-dashed border-line px-4 py-14 text-center">
        <p className="text-sm text-ink-faint">
          Agents are still building independent models. Cross-examination opens in phase 05.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {threads.map((thread) => {
        const values = thread.events.map((e) => e.confidenceAfter)
        const last = values[values.length - 1]
        const first = values[0]
        const delta = last - first
        return (
          <section key={thread.id} className="border border-line bg-surface/40">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <h3 className="truncate text-[0.9375rem] text-ink">{thread.topic}</h3>
                <Pill tone={thread.resolved ? 'thrive' : 'caution'}>
                  {thread.resolved ? 'Resolved' : 'Open'}
                </Pill>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24">
                  <ConfidenceTrace values={values} />
                </div>
                <div className="text-right">
                  <Label>Confidence</Label>
                  <div className="font-mono text-sm tabular-nums text-ink">
                    {last}
                    <span className={cn('ml-1.5 text-[0.6875rem]', delta >= 0 ? 'text-thrive' : 'text-hazard')}>
                      {delta >= 0 ? '+' : ''}
                      {delta}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Stacked on phones — a horizontally clipped argument is unreadable. */}
            <div className="flex flex-col md:flex-row md:overflow-x-auto md:no-scrollbar">
              {thread.events.map((e, i) => {
                const agent = AGENTS[e.agent]
                const meta = MOVE_META[e.move]
                return (
                  <motion.article
                    key={e.id}
                    // Never fades from zero: a starved frame loop must not be
                    // able to leave a card invisible.
                    initial={reducedMotion ? false : { y: 10 }}
                    animate={{ y: 0 }}
                    transition={{ delay: reducedMotion ? 0 : Math.min(i * 0.06, 0.3), duration: 0.35 }}
                    className={cn(
                      'relative flex-1 border-line p-4 md:min-w-[15rem]',
                      i > 0 && 'border-t md:border-l md:border-t-0',
                    )}
                  >
                    {/* Flow connector — the move sequence made visible. */}
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="absolute left-4 -top-[7px] flex h-3.5 w-3.5 items-center justify-center border border-line bg-void font-mono text-[0.5rem] text-ink-faint md:-left-[7px] md:top-7"
                      >
                        <span className="md:hidden">⌄</span>
                        <span className="hidden md:inline">›</span>
                      </span>
                    )}
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center border font-mono text-[0.5625rem]"
                        style={{ borderColor: `rgb(var(${agent.hueVar}))`, color: `rgb(var(${agent.hueVar}))` }}
                      >
                        {agent.glyph}
                      </span>
                      <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-dim">
                        {agent.name}
                      </span>
                      <span className={cn('ml-auto font-mono text-[0.625rem] uppercase tracking-[0.12em]', meta.tone)}>
                        {meta.glyph} {meta.label}
                      </span>
                    </div>
                    <p className="text-[0.8125rem] leading-relaxed text-ink text-pretty">{e.claim}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-[3px] flex-1 bg-raised">
                        <div
                          className="h-full bg-signal transition-[width] duration-700 ease-instrument"
                          style={{ width: `${e.confidenceAfter}%` }}
                        />
                      </div>
                      <span className="font-mono text-[0.625rem] tabular-nums text-ink-faint">
                        {e.confidenceAfter}
                      </span>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
