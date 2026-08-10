import { useMemo } from 'react'
import type { DecisionDNA } from '@/lib/types'
import { Label } from '@/components/ui/primitives'
import { useReducedMotion } from '@/hooks/useMedia'

const TRAITS: { key: keyof DecisionDNA; label: string; note: string }[] = [
  { key: 'ambition', label: 'Ambition', note: 'How far the end state is from today' },
  { key: 'feasibility', label: 'Feasibility', note: 'Whether the actor can actually do it' },
  { key: 'reversibility', label: 'Reversibility', note: 'How cheaply a mistake can be undone' },
  { key: 'capitalNeed', label: 'Capital need', note: 'Money required before returns arrive' },
  { key: 'timePressure', label: 'Time pressure', note: 'Cost of moving one year later' },
  { key: 'uncertainty', label: 'Uncertainty', note: 'Share of the plan resting on unknowns' },
]

const BANDS = 14

/**
 * The mission's signature: six columns, one per trait, plotted as a single
 * compact glyph. Small enough to sit in a header or a list, distinctive enough
 * that two missions are told apart at a glance.
 */
function Signature({ dna }: { dna: DecisionDNA }) {
  const vals = TRAITS.map((t) => dna[t.key])
  const w = 108
  const h = 26
  const step = w / vals.length
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      role="img"
      aria-label={`Decision DNA signature: ${TRAITS.map((t) => `${t.label} ${dna[t.key]}`).join(', ')}`}
    >
      <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} stroke="rgb(var(--line))" strokeWidth="1" />
      {vals.map((v, i) => {
        const bh = Math.max(2, (v / 100) * (h - 4))
        return (
          <rect
            key={i}
            x={i * step + 2}
            y={h - 1 - bh}
            width={step - 4}
            height={bh}
            fill="rgb(var(--signal))"
            opacity={0.35 + (v / 100) * 0.55}
          />
        )
      })}
    </svg>
  )
}

/**
 * Decision DNA.
 *
 * Not a radar chart: a banding strip, read like a gel. Each trait is a column of
 * fourteen bands and the lit height encodes the value, so two missions produce
 * visibly different silhouettes at a glance — a fingerprint you could recognise
 * across a wall of them.
 */
export function DecisionDNAPanel({ dna, compact = false }: { dna: DecisionDNA; compact?: boolean }) {
  const reduce = useReducedMotion()

  const columns = useMemo(
    () =>
      TRAITS.map((t) => {
        const value = dna[t.key]
        const lit = Math.round((value / 100) * BANDS)
        return { ...t, value, lit }
      }),
    [dna],
  )

  return (
    <div className="border border-line bg-surface/40">
      <div className="flex items-end justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <Label>Decision DNA</Label>
          <p className="mt-1 text-[0.8125rem] text-ink-dim">Six-axis fingerprint of this mission's decision profile</p>
        </div>
        <div className="flex items-center gap-3">
          <Signature dna={dna} />
          <span className="hidden font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint sm:inline">
            {columns.map((c) => String(c.value).padStart(2, '0')).join('·')}
          </span>
        </div>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((c, ci) => (
          <div key={c.key} className="group flex items-center gap-4 bg-surface/60 px-4 py-4">
            <div className="flex h-[4.75rem] w-11 flex-col-reverse justify-start gap-[2px]" aria-hidden>
              {Array.from({ length: BANDS }, (_, i) => {
                const on = i < c.lit
                return (
                  <span
                    key={i}
                    className="block h-[3px] w-full transition-all"
                    style={{
                      background: on ? 'rgb(var(--signal))' : 'rgb(var(--line))',
                      opacity: on ? 0.35 + (i / BANDS) * 0.65 : 0.55,
                      transitionDelay: reduce ? '0ms' : `${ci * 60 + i * 26}ms`,
                      transitionDuration: reduce ? '0ms' : '420ms',
                    }}
                  />
                )
              })}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink">{c.label}</span>
                <span className="font-mono text-xl tabular-nums text-ink">{c.value}</span>
              </div>
              {!compact && <p className="mt-1 text-[0.75rem] leading-snug text-ink-faint text-pretty">{c.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
