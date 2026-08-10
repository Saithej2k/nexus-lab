import { useMemo } from 'react'
import { useNexus } from '@/hooks/useNexus'
import { AGENTS, INSIGHT_META, PHASES } from '@/lib/agents'
import { Drawer } from '@/components/ui/Drawer'
import { Label, Meter, Pill } from '@/components/ui/primitives'

export function AgentInspector() {
  const { selectedAgent, selectAgent, visible, analysis, agentStatus } = useNexus()
  const agent = selectedAgent ? AGENTS[selectedAgent] : null

  const insights = useMemo(
    () => (selectedAgent ? visible.insights.filter((i) => i.agent === selectedAgent) : []),
    [visible.insights, selectedAgent],
  )
  const moves = useMemo(
    () => (selectedAgent ? visible.events.filter((e) => e.agent === selectedAgent) : []),
    [visible.events, selectedAgent],
  )

  const avg = insights.length
    ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length)
    : 0

  return (
    <Drawer
      open={Boolean(agent)}
      onClose={() => selectAgent(null)}
      title={agent?.name ?? ''}
      eyebrow={agent ? `${agent.role} · ${agentStatus[agent.id]}` : undefined}
      accent={agent ? `rgb(var(${agent.hueVar}))` : undefined}
    >
      {agent && (
        <div className="space-y-6">
          <p className="border-l-2 pl-3 text-sm leading-relaxed text-ink-dim" style={{ borderColor: `rgb(var(${agent.hueVar}))` }}>
            {agent.doctrine}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contributions</Label>
              <div className="mt-1 font-mono text-2xl tabular-nums text-ink">{insights.length}</div>
            </div>
            <div>
              <Label>Mean confidence</Label>
              <div className="mt-1 font-mono text-2xl tabular-nums text-ink">{avg || '—'}</div>
            </div>
          </div>

          {!analysis && (
            <p className="text-sm text-ink-faint">
              No mission running. Initialize NEXUS to see this agent's reasoning.
            </p>
          )}

          {analysis && insights.length === 0 && (
            <p className="border border-dashed border-line px-3 py-6 text-center text-sm text-ink-faint">
              {agent.name} has not contributed yet at this point on the timeline.
            </p>
          )}

          {insights.length > 0 && (
            <section>
              <Label>Structured output</Label>
              <ul className="mt-3 space-y-3">
                {insights.map((i) => {
                  const meta = INSIGHT_META[i.kind]
                  const phase = PHASES.find((p) => p.id === i.phase)
                  return (
                    <li key={i.id} className="border border-line bg-raised/40 p-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className={`font-mono text-[0.625rem] uppercase tracking-[0.14em] ${meta.tone}`}>
                          {meta.glyph} {meta.label}
                        </span>
                        <span className="font-mono text-[0.625rem] text-ink-faint">{phase?.code}</span>
                      </div>
                      <h4 className="text-[0.9375rem] leading-snug text-ink">{i.title}</h4>
                      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{i.body}</p>
                      {i.evidence && (
                        <p className="mt-2 font-mono text-[0.6875rem] text-signal">↳ {i.evidence}</p>
                      )}
                      <div className="mt-2.5">
                        <Meter value={i.confidence} label="Confidence" size="sm" />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {moves.length > 0 && (
            <section>
              <Label>Debate moves</Label>
              <ul className="mt-3 space-y-2">
                {moves.map((m) => (
                  <li key={m.id} className="border-l border-line pl-3">
                    <Pill tone={m.move === 'challenge' ? 'hazard' : m.move === 'decision' ? 'signal' : 'default'}>
                      {m.move}
                    </Pill>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{m.claim}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}
