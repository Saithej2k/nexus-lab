import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, Minus, Plus } from 'lucide-react'
import type { DecisionNode, NodeKind } from '@/lib/types'
import { NODE_META, RELATION_META } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { clamp, cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useMedia'
import { Label } from '@/components/ui/primitives'

/**
 * The canvas is narrower on phones so the drawing scale stays close to 1:1 —
 * a wide viewBox squeezed into 360 CSS pixels turns every label into 4px type.
 */
const DESKTOP = { W: 1000, H: 660, PAD: 90, label: 11.5, meta: 9.5, r0: 13, r1: 12 }
const MOBILE = { W: 520, H: 640, PAD: 54, label: 15, meta: 13, r0: 15, r1: 13 }

interface View {
  k: number
  x: number
  y: number
}
const DEFAULT_VIEW: View = { k: 1, x: 0, y: 0 }

type Metrics = typeof DESKTOP

function nodePoint(n: DecisionNode, m: Metrics) {
  return { x: m.PAD + n.x * (m.W - m.PAD * 2), y: m.PAD * 0.7 + n.y * (m.H - m.PAD * 1.4) }
}

function nodeRadius(n: DecisionNode, m: Metrics) {
  return m.r0 + n.weight * m.r1
}

/** Shape carries the concept type so meaning never depends on colour alone. */
function shapePath(kind: NodeKind, r: number) {
  switch (kind) {
    case 'constraint':
      return `M ${-r} ${-r} H ${r} V ${r} H ${-r} Z`
    case 'outcome':
      return `M 0 ${-r * 1.25} L ${r * 1.25} 0 L 0 ${r * 1.25} L ${-r * 1.25} 0 Z`
    case 'risk':
      return `M 0 ${-r * 1.2} L ${r * 1.1} ${r * 0.8} L ${-r * 1.1} ${r * 0.8} Z`
    case 'lever': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2
        return `${(Math.cos(a) * r * 1.12).toFixed(2)} ${(Math.sin(a) * r * 1.12).toFixed(2)}`
      })
      return `M ${pts.join(' L ')} Z`
    }
    default:
      return ''
  }
}

const KIND_TONE: Record<NodeKind, string> = {
  lever: 'var(--signal)',
  constraint: 'var(--ink-faint)',
  actor: 'var(--agent-strategist)',
  outcome: 'var(--thrive)',
  risk: 'var(--hazard)',
}

export function DecisionGraph({ compact = false }: { compact?: boolean }) {
  const { visible, selectedNode, selectNode, reducedMotion, analysis } = useNexus()
  const isMobile = useIsMobile()
  const m = isMobile ? MOBILE : DESKTOP
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const [hover, setHover] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; k: number } | null>(null)

  const nodes = visible.nodes
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const edges = useMemo(
    () => visible.edges.filter((e) => nodeById.has(e.from) && nodeById.has(e.to)),
    [visible.edges, nodeById],
  )

  const neighbours = useMemo(() => {
    const focus = hover ?? selectedNode
    if (!focus) return null
    const set = new Set<string>([focus])
    for (const e of edges) {
      if (e.from === focus) set.add(e.to)
      if (e.to === focus) set.add(e.from)
    }
    return set
  }, [hover, selectedNode, edges])

  const recenter = useCallback(() => setView(DEFAULT_VIEW), [])
  const zoomBy = useCallback((factor: number) => {
    setView((v) => ({ ...v, k: clamp(v.k * factor, 0.55, 2.6) }))
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!svgRef.current) return
    e.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * m.W
    const py = ((e.clientY - rect.top) / rect.height) * m.H
    setView((v) => {
      const k = clamp(v.k * (e.deltaY < 0 ? 1.12 : 0.89), 0.55, 2.6)
      const scale = k / v.k
      return { k, x: px - (px - v.x) * scale, y: py - (py - v.y) * scale }
    })
  }, [m])

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }
      drag.current = null
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      setView((v) => ({ ...v, k: clamp((pinch.current!.k * dist) / pinch.current!.dist, 0.55, 2.6) }))
      return
    }
    if (!drag.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.x) / rect.width) * m.W
    const dy = ((e.clientY - drag.current.y) / rect.height) * m.H
    setView((v) => ({ ...v, x: drag.current!.vx + dx, y: drag.current!.vy + dy }))
  }

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) drag.current = null
  }

  // Wheel must be non-passive to preventDefault; React's synthetic listener is passive.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Progressive disclosure: at rest only the load-bearing concepts are named.
  // Zoom in, hover, or select to reveal the rest — labels never fight each other.
  const showLabel = (n: DecisionNode) =>
    view.k > 1.25 || n.weight >= (isMobile ? 0.9 : 0.85) || n.id === selectedNode || n.id === hover

  return (
    <div className="relative">
      <div
        className={cn(
          'relative overflow-hidden border border-line bg-void/40 instrument-grid',
          compact ? 'h-[380px]' : 'aspect-[520/640] md:aspect-auto md:h-[clamp(420px,58vh,660px)]',
        )}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${m.W} ${m.H}`}
          className="h-full w-full touch-none"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          role="application"
          aria-label="Decision graph. Concepts and their relationships. A text alternative is available below the visualization."
          style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
        >
          <defs>
            {(Object.keys(RELATION_META) as (keyof typeof RELATION_META)[]).map((rel) => (
              <marker
                key={rel}
                id={`arw-${rel}`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 7 4 L 0 7 z" fill={`rgb(${RELATION_META[rel].tone})`} opacity="0.85" />
              </marker>
            ))}
          </defs>

          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <g fill="none">
              {edges.map((e) => {
                const a = nodePoint(nodeById.get(e.from)!, m)
                const b = nodePoint(nodeById.get(e.to)!, m)
                const meta = RELATION_META[e.relation]
                const dim = neighbours ? !(neighbours.has(e.from) && neighbours.has(e.to)) : false
                const mx = (a.x + b.x) / 2
                const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.08
                return (
                  <path
                    key={e.id}
                    d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                    stroke={`rgb(${meta.tone})`}
                    strokeWidth={0.7 + e.strength * 1.7}
                    strokeDasharray={meta.dash}
                    opacity={dim ? 0.1 : 0.42 + e.strength * 0.25}
                    markerEnd={`url(#arw-${e.relation})`}
                    className="transition-opacity duration-300"
                  />
                )
              })}
            </g>

            <AnimatePresence>
              {nodes.map((n) => {
                const p = nodePoint(n, m)
                const r = nodeRadius(n, m)
                const tone = KIND_TONE[n.kind]
                const active = selectedNode === n.id || hover === n.id
                const dim = neighbours ? !neighbours.has(n.id) : false
                return (
                  // Position lives on a plain <g>: framer-motion owns the
                  // transform of any element it animates and would discard it.
                  <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
                  <motion.g
                    initial={reducedMotion ? false : { scale: 0.55 }}
                    animate={{ opacity: dim ? 0.28 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n.label}. ${NODE_META[n.kind].label}. Confidence ${n.confidence}.`}
                    onClick={() => selectNode(selectedNode === n.id ? null : n.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        selectNode(selectedNode === n.id ? null : n.id)
                      }
                    }}
                    onPointerEnter={() => setHover(n.id)}
                    onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                    className="cursor-pointer outline-none [&:focus-visible>.gfocus]:opacity-100"
                  >
                    <circle className="gfocus opacity-0 transition-opacity" r={r + 11} fill="none" stroke="rgb(var(--signal))" strokeWidth={1.5} />
                    {n.kind === 'actor' ? (
                      <circle
                        r={r}
                        fill={active ? `rgb(${tone} / 0.16)` : 'rgb(var(--surface))'}
                        stroke={`rgb(${tone})`}
                        strokeWidth={active ? 2 : 1.2}
                      />
                    ) : (
                      <path
                        d={shapePath(n.kind, r)}
                        fill={active ? `rgb(${tone} / 0.16)` : 'rgb(var(--surface))'}
                        stroke={`rgb(${tone})`}
                        strokeWidth={active ? 2 : 1.2}
                      />
                    )}
                    <circle r={2.2} fill={`rgb(${tone})`} opacity={0.85} />
                    {showLabel(n) && (
                      <text
                        y={r + 15}
                        textAnchor="middle"
                        className="pointer-events-none fill-ink"
                        style={{ fontSize: m.label, fontWeight: active ? 500 : 400 }}
                      >
                        {n.label}
                      </text>
                    )}
                    {active && (
                      <text
                        y={r + 29}
                        textAnchor="middle"
                        className="pointer-events-none fill-ink-faint font-mono tabular-nums"
                        style={{ fontSize: m.meta, letterSpacing: '0.08em' }}
                      >
                        {NODE_META[n.kind].label.toUpperCase()} · {n.confidence}
                      </text>
                    )}
                  </motion.g>
                  </g>
                )
              })}
            </AnimatePresence>
          </g>
        </svg>

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="max-w-xs text-center text-sm text-ink-faint">
              {analysis ? 'Concepts appear as NEXUS reasons.' : 'No mission running.'}
            </p>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-px border border-line bg-surface/90">
          <button onClick={() => zoomBy(1.2)} aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center text-ink-dim transition-colors hover:text-signal">
            <Plus size={14} />
          </button>
          <button onClick={() => zoomBy(0.83)} aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center text-ink-dim transition-colors hover:text-signal">
            <Minus size={14} />
          </button>
          <button onClick={recenter} aria-label="Recenter graph" className="flex h-8 w-8 items-center justify-center text-ink-dim transition-colors hover:text-signal">
            <Crosshair size={14} />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.625rem] tabular-nums text-ink-faint">
          {nodes.length} concepts · {edges.length} relations · {Math.round(view.k * 100)}%
        </div>
      </div>

      <GraphLegend />

      <details className="group mt-3 border border-line">
        <summary className="cursor-pointer list-none px-3 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-signal">
          <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
          Text alternative — {nodes.length} concepts
        </summary>
        <div className="max-h-72 overflow-y-auto border-t border-line px-3 py-3">
          <ul className="space-y-2 text-[0.8125rem] text-ink-dim">
            {nodes.map((n) => {
              const out = edges.filter((e) => e.from === n.id)
              return (
                <li key={n.id}>
                  <span className="text-ink">{n.label}</span>{' '}
                  <span className="font-mono text-[0.6875rem] text-ink-faint">
                    ({NODE_META[n.kind].label.toLowerCase()}, confidence {n.confidence})
                  </span>
                  {out.length > 0 && (
                    <span>
                      {' — '}
                      {out
                        .map((e) => `${RELATION_META[e.relation].label} ${nodeById.get(e.to)?.label}`)
                        .join('; ')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </details>
    </div>
  )
}

function GraphLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <Label>Legend</Label>
      {(Object.keys(NODE_META) as NodeKind[]).map((k) => (
        <span key={k} className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-dim">
          <svg width="14" height="14" viewBox="-9 -9 18 18" aria-hidden>
            {k === 'actor' ? (
              <circle r="6.5" fill="none" stroke={`rgb(${KIND_TONE[k]})`} strokeWidth="1.3" />
            ) : (
              <path d={shapePath(k, 6)} fill="none" stroke={`rgb(${KIND_TONE[k]})`} strokeWidth="1.3" />
            )}
          </svg>
          {NODE_META[k].label}
        </span>
      ))}
      <span className="hidden h-3 w-px bg-line sm:block" />
      {(Object.keys(RELATION_META) as (keyof typeof RELATION_META)[]).map((r) => (
        <span key={r} className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-dim">
          <svg width="18" height="6" viewBox="0 0 18 6" aria-hidden>
            <line x1="0" y1="3" x2="18" y2="3" stroke={`rgb(${RELATION_META[r].tone})`} strokeWidth="1.4" strokeDasharray={RELATION_META[r].dash} />
          </svg>
          {RELATION_META[r].label}
        </span>
      ))}
    </div>
  )
}
