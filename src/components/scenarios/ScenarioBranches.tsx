import { motion } from 'framer-motion'
import type { ScenarioId } from '@/lib/types'
import { useNexus } from '@/hooks/useNexus'
import { Label, Meter } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

const BRANCH_Y: Record<ScenarioId, number> = { conservative: 34, balanced: 92, moonshot: 150 }
const RISK_TONE = {
  low: 'text-thrive',
  moderate: 'text-signal',
  high: 'text-caution',
  severe: 'text-hazard',
} as const

/** Three futures drawn as literal branches from a single present. */
function BranchDiagram() {
  const { analysis, scenario, setScenario, reducedMotion } = useNexus()
  if (!analysis) return null

  return (
    <svg viewBox="0 0 620 184" className="h-auto w-full" role="group" aria-label="Scenario branch diagram">
      <line x1="0" y1="92" x2="118" y2="92" stroke="rgb(var(--line-strong))" strokeWidth="1.4" />
      <circle cx="118" cy="92" r="4" fill="rgb(var(--signal))" />
      <text x="8" y="84" className="fill-ink-faint font-mono" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
        NOW
      </text>

      {analysis.scenarios.map((s) => {
        const active = scenario === s.id
        const y = BRANCH_Y[s.id]
        return (
          <g
            key={s.id}
            role="button"
            tabIndex={0}
            aria-label={`${s.name} scenario, probability ${s.probability} percent`}
            aria-pressed={active}
            onClick={() => setScenario(s.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setScenario(s.id)
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible_path]:stroke-[3]"
          >
            <path
              d={`M 118 92 C 220 92, 250 ${y}, 360 ${y} L 596 ${y}`}
              fill="none"
              stroke={active ? 'rgb(var(--signal))' : 'rgb(var(--line-strong))'}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={s.id === 'moonshot' ? '6 4' : s.id === 'conservative' ? '' : '10 3'}
              opacity={active ? 1 : 0.55}
              className="transition-all duration-500"
            />
            <motion.circle
              cx="596"
              cy={y}
              r={active ? 5.5 : 3.5}
              fill={active ? 'rgb(var(--signal))' : 'rgb(var(--surface))'}
              stroke={active ? 'rgb(var(--signal))' : 'rgb(var(--line-strong))'}
              strokeWidth="1.2"
              animate={reducedMotion ? {} : { scale: active ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 2.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
            />
            <text
              x="366"
              y={y - 9}
              className={cn('font-mono', active ? 'fill-signal' : 'fill-ink-faint')}
              style={{ fontSize: 10, letterSpacing: '0.14em' }}
            >
              {s.name.toUpperCase()}
            </text>
            <text
              x="596"
              y={y - 12}
              textAnchor="end"
              className={cn('font-mono tabular-nums', active ? 'fill-ink' : 'fill-ink-faint')}
              style={{ fontSize: 10 }}
            >
              {s.probability}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function ScenarioBranches() {
  const { analysis, scenario, setScenario } = useNexus()
  if (!analysis) return null
  const active = analysis.scenarios.find((s) => s.id === scenario) ?? analysis.scenarios[1]

  return (
    <div className="space-y-6">
      {/* The branch diagram needs width to stay legible; on phones the three
          cards below carry the same information with better hierarchy. */}
      <div className="hidden border border-line bg-surface/40 px-4 py-4 sm:block">
        <BranchDiagram />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {analysis.scenarios.map((s) => {
          const isActive = s.id === scenario
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              aria-pressed={isActive}
              className={cn(
                'group border p-4 text-left transition-all duration-300 ease-instrument',
                isActive ? 'border-signal bg-signal/[0.05]' : 'border-line bg-surface/40 hover:border-line-strong',
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className={cn('font-mono text-[0.6875rem] uppercase tracking-[0.16em]', isActive ? 'text-signal' : 'text-ink-dim')}>
                  {s.name}
                </span>
                <span className="font-mono text-lg tabular-nums text-ink">{s.probability}%</span>
              </div>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{s.thesis}</p>
              <dl className="mt-3 space-y-1.5 border-t border-line pt-3">
                <div className="flex justify-between gap-3">
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">Risk</dt>
                  <dd className={cn('font-mono text-[0.6875rem] uppercase', RISK_TONE[s.risk])}>{s.risk}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">Horizon</dt>
                  <dd className="font-mono text-[0.6875rem] tabular-nums text-ink-dim">{s.horizon}</dd>
                </div>
              </dl>
            </button>
          )
        })}
      </div>

      <div className="grid gap-px border border-line bg-line md:grid-cols-3">
        {[
          { label: 'Key dependency', value: active.keyDependency, tone: 'text-ink' },
          { label: 'Major failure mode', value: active.failureMode, tone: 'text-hazard' },
          { label: 'Potential upside', value: active.upside, tone: 'text-thrive' },
        ].map((row) => (
          <div key={row.label} className="bg-surface/60 p-4">
            <Label>{row.label}</Label>
            <p className={cn('mt-2 text-[0.8125rem] leading-relaxed text-pretty', row.tone)}>{row.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border border-line bg-surface/40 p-4 sm:flex-row sm:items-center">
        <div className="sm:w-64">
          <Meter value={active.probability} label={`${active.name} confidence`} suffix="%" />
        </div>
        <div className="flex-1">
          <Label>Capital profile</Label>
          <p className="mt-1 text-[0.8125rem] text-ink-dim">{active.capital}</p>
        </div>
      </div>

      <FutureTimeline />
    </div>
  )
}

function FutureTimeline() {
  const { analysis, scenario, reducedMotion } = useNexus()
  if (!analysis) return null
  const active = analysis.scenarios.find((s) => s.id === scenario) ?? analysis.scenarios[1]

  return (
    <div>
      <Label>Future state · {active.name}</Label>
      <ol className="mt-3 grid gap-px bg-line md:grid-cols-4">
        {active.milestones.map((m, i) => (
          <motion.li
            key={`${active.id}-${m.year}`}
            initial={reducedMotion ? false : { y: 8 }}
            animate={{ y: 0 }}
            transition={{ delay: reducedMotion ? 0 : i * 0.07, duration: 0.4 }}
            className="relative bg-surface/60 p-4"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">Year</span>
              <span className="display font-mono text-2xl tabular-nums text-signal">{m.year}</span>
            </div>
            <h4 className="mt-2 text-[0.9375rem] leading-snug text-ink text-pretty">{m.headline}</h4>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{m.detail}</p>
            <p className="mt-3 border-t border-line pt-2 font-mono text-[0.6875rem] tabular-nums text-ink-faint">
              {m.metric}
            </p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
