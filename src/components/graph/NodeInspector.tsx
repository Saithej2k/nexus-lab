import { useMemo } from 'react'
import { useNexus } from '@/hooks/useNexus'
import { AGENTS, NODE_META, RELATION_META, INSIGHT_META } from '@/lib/agents'
import { Drawer } from '@/components/ui/Drawer'
import { Label, Meter } from '@/components/ui/primitives'

export function NodeInspector() {
  const { selectedNode, selectNode, visible, analysis } = useNexus()

  const node = useMemo(
    () => visible.nodes.find((n) => n.id === selectedNode) ?? null,
    [visible.nodes, selectedNode],
  )

  const related = useMemo(() => {
    if (!node) return { downstream: [], upstream: [] }
    const label = (id: string) => visible.nodes.find((n) => n.id === id)?.label ?? id
    return {
      downstream: visible.edges
        .filter((e) => e.from === node.id)
        .map((e) => ({ id: e.id, rel: RELATION_META[e.relation].label, label: label(e.to) })),
      upstream: visible.edges
        .filter((e) => e.to === node.id)
        .map((e) => ({ id: e.id, rel: RELATION_META[e.relation].label, label: label(e.from) })),
    }
  }, [node, visible.edges, visible.nodes])

  const discussion = useMemo(
    () => (node ? visible.insights.filter((i) => i.concepts.includes(node.id)) : []),
    [visible.insights, node],
  )

  const debate = useMemo(
    () => (node ? visible.events.filter((e) => e.concepts.includes(node.id)) : []),
    [visible.events, node],
  )

  return (
    <Drawer
      open={Boolean(node)}
      onClose={() => selectNode(null)}
      title={node?.label ?? ''}
      eyebrow={node ? NODE_META[node.kind].label : undefined}
    >
      {node && analysis && (
        <div className="space-y-6">
          <div>
            <Label>Why it matters</Label>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim text-pretty">{node.rationale}</p>
          </div>

          <Meter value={node.confidence} label="Concept confidence" />

          <div className="grid grid-cols-2 gap-4">
            <section>
              <Label>Depends on</Label>
              <ul className="mt-2 space-y-1.5">
                {related.upstream.length === 0 && <li className="text-[0.8125rem] text-ink-faint">None yet</li>}
                {related.upstream.map((r) => (
                  <li key={r.id} className="text-[0.8125rem] leading-snug text-ink-dim">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                      {r.rel}
                    </span>
                    <br />
                    {r.label}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <Label>Downstream</Label>
              <ul className="mt-2 space-y-1.5">
                {related.downstream.length === 0 && <li className="text-[0.8125rem] text-ink-faint">None yet</li>}
                {related.downstream.map((r) => (
                  <li key={r.id} className="text-[0.8125rem] leading-snug text-ink-dim">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                      {r.rel}
                    </span>
                    <br />
                    {r.label}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {node.assumptions.length > 0 && (
            <section>
              <Label>Connected assumptions</Label>
              <ul className="mt-2 space-y-1.5">
                {node.assumptions.map((a) => (
                  <li key={a} className="flex gap-2 text-[0.8125rem] leading-relaxed text-ink-dim">
                    <span className="text-signal">◇</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {node.risks.length > 0 && (
            <section>
              <Label>Relevant risks</Label>
              <ul className="mt-2 space-y-1.5">
                {node.risks.map((a) => (
                  <li key={a} className="flex gap-2 text-[0.8125rem] leading-relaxed text-ink-dim">
                    <span className="text-hazard">△</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {discussion.length > 0 && (
            <section>
              <Label>Agents discussing this</Label>
              <ul className="mt-2 space-y-3">
                {discussion.map((i) => (
                  <li key={i.id} className="border-l-2 pl-3" style={{ borderColor: `rgb(var(${AGENTS[i.agent].hueVar}))` }}>
                    <div className="font-mono text-[0.625rem] uppercase tracking-[0.14em]" style={{ color: `rgb(var(${AGENTS[i.agent].hueVar}))` }}>
                      {AGENTS[i.agent].name} · {INSIGHT_META[i.kind].label}
                    </div>
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{i.title}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {debate.length > 0 && (
            <section>
              <Label>Contested in debate</Label>
              <ul className="mt-2 space-y-2">
                {debate.map((e) => (
                  <li key={e.id} className="text-[0.8125rem] leading-relaxed text-ink-dim">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
                      {AGENTS[e.agent].name} · {e.move}
                    </span>
                    <br />
                    {e.claim}
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
