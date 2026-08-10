import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AGENTS, INSIGHT_META, PHASES } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { Meter, Skeleton } from '@/components/ui/primitives'

const PREVIEW_COUNT = 9

/** Structured agent output as it lands. Never a wall of paragraphs. */
export function InsightStream() {
  const { visible, selectAgent, reducedMotion, status } = useNexus()
  const [expanded, setExpanded] = useState(false)
  const all = [...visible.insights].reverse()
  // The stream stays scannable: newest work first, the rest one click away.
  const insights = expanded ? all : all.slice(0, PREVIEW_COUNT)

  if (status === 'idle') return null

  if (insights.length === 0) {
    return (
      <div className="grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3 border-b border-r border-line bg-surface/60 p-4">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-[3px] w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence initial={false}>
        {insights.map((i) => {
          const agent = AGENTS[i.agent]
          const meta = INSIGHT_META[i.kind]
          const phase = PHASES.find((p) => p.id === i.phase)
          return (
            <motion.article
              key={i.id}
              layout={!reducedMotion}
              initial={reducedMotion ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col border-b border-r border-line bg-surface/60 p-4 transition-colors hover:bg-raised/60"
            >
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => selectAgent(i.agent)}
                  className="flex items-center gap-1.5 outline-none"
                  aria-label={`Open ${agent.name} inspector`}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center border font-mono text-[0.5rem]"
                    style={{ borderColor: `rgb(var(${agent.hueVar}))`, color: `rgb(var(${agent.hueVar}))` }}
                  >
                    {agent.glyph}
                  </span>
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-dim hover:text-ink">
                    {agent.name}
                  </span>
                </button>
                <span className={`ml-auto font-mono text-[0.625rem] uppercase tracking-[0.1em] ${meta.tone}`}>
                  {meta.glyph} {meta.label}
                </span>
                <span className="font-mono text-[0.625rem] text-ink-faint">{phase?.code}</span>
              </div>

              <h4 className="text-[0.9375rem] leading-snug text-ink text-pretty">{i.title}</h4>
              <p className="mt-1.5 flex-1 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{i.body}</p>
              {i.evidence && <p className="mt-2 font-mono text-[0.6875rem] text-signal">↳ {i.evidence}</p>}
              <div className="mt-3">
                <Meter value={i.confidence} size="sm" />
              </div>
            </motion.article>
          )
        })}
      </AnimatePresence>
      </div>

      {all.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-2 border-b border-l border-r border-line bg-surface/40 py-3 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-dim transition-colors hover:bg-raised hover:text-signal"
        >
          {expanded ? 'Collapse stream' : `Show all ${all.length} contributions`}
          <span aria-hidden className={expanded ? 'rotate-180' : ''}>
            ↓
          </span>
        </button>
      )}
    </div>
  )
}
