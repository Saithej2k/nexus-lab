import { memo, useMemo } from 'react'
import type { AgentId, AgentStatus } from '@/lib/types'
import { AGENT_LIST } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { cn } from '@/lib/utils'

const VB = 620
const C = VB / 2

const STATUS_COPY: Record<AgentStatus, string> = {
  dormant: 'Dormant',
  waking: 'Waking',
  thinking: 'Reasoning',
  transmitting: 'Transmitting',
  settled: 'Settled',
}

/** Non-colour status encoding: every state has a distinct stroke pattern. */
const STATUS_STROKE: Record<AgentStatus, { dash: string; width: number; opacity: number }> = {
  dormant: { dash: '2 6', width: 1, opacity: 0.4 },
  waking: { dash: '1 4', width: 1.5, opacity: 0.7 },
  thinking: { dash: '10 6', width: 1.5, opacity: 0.9 },
  transmitting: { dash: '', width: 2.5, opacity: 1 },
  settled: { dash: '', width: 1.5, opacity: 0.85 },
}

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180
  return { x: C + Math.cos(a) * radius, y: C + Math.sin(a) * radius }
}

interface LinkPulse {
  id: string
  from: AgentId
  to: AgentId
  age: number
}

export const Constellation = memo(function Constellation() {
  const { agentStatus, selectedAgent, selectAgent, visible, t, singularity, reducedMotion, status, analysis } =
    useNexus()

  const radius = singularity ? 150 : 218
  const positions = useMemo(() => {
    const map = {} as Record<AgentId, { x: number; y: number }>
    for (const a of AGENT_LIST) map[a.id] = polar(a.orbit, radius)
    return map
  }, [radius])

  /** Recent debate moves become visible transmissions between two nodes. */
  const pulses = useMemo<LinkPulse[]>(() => {
    if (reducedMotion || !analysis) return []
    const byId = new Map(analysis.threads.flatMap((th) => th.events).map((e) => [e.id, e]))
    return visible.events
      .filter((e) => t - e.at < 2400 && e.respondsTo)
      .map((e) => {
        const target = e.respondsTo ? byId.get(e.respondsTo) : undefined
        if (!target || target.agent === e.agent) return null
        return { id: e.id, from: e.agent, to: target.agent, age: t - e.at }
      })
      .filter(Boolean) as LinkPulse[]
  }, [visible.events, t, reducedMotion, analysis])

  const activePairs = useMemo(() => new Set(pulses.map((p) => [p.from, p.to].sort().join('~'))), [pulses])
  const anyAwake = Object.values(agentStatus).some((s) => s !== 'dormant')

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        className="h-auto w-full select-none overflow-visible"
        role="img"
        aria-label={
          analysis
            ? `Agent constellation. ${AGENT_LIST.map((a) => `${a.name}: ${STATUS_COPY[agentStatus[a.id]]}`).join('. ')}.`
            : 'Agent constellation, idle.'
        }
      >
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgb(var(--signal))" stopOpacity="0.32" />
            <stop offset="55%" stopColor="rgb(var(--signal))" stopOpacity="0.07" />
            <stop offset="100%" stopColor="rgb(var(--signal))" stopOpacity="0" />
          </radialGradient>
          {AGENT_LIST.map((a) => (
            <path
              key={`p-${a.id}`}
              id={`link-${a.id}`}
              d={`M ${C} ${C} L ${positions[a.id].x} ${positions[a.id].y}`}
            />
          ))}
          {AGENT_LIST.flatMap((a, i) =>
            AGENT_LIST.slice(i + 1).map((b) => (
              <path
                key={`c-${a.id}-${b.id}`}
                id={`chord-${a.id}-${b.id}`}
                d={`M ${positions[a.id].x} ${positions[a.id].y} Q ${C} ${C} ${positions[b.id].x} ${positions[b.id].y}`}
              />
            )),
          )}
        </defs>

        {/* Measurement rings — the instrument's bezel. */}
        <g fill="none" stroke="rgb(var(--line))" opacity={0.75}>
          <circle cx={C} cy={C} r={radius} strokeDasharray="1 7" />
          <circle cx={C} cy={C} r={radius * 0.62} strokeDasharray="1 11" opacity={0.6} />
          <circle cx={C} cy={C} r={radius * 0.3} opacity={0.5} />
        </g>

        {/* Chords between agents. Dim by default, lit while a pair is arguing. */}
        <g fill="none">
          {AGENT_LIST.flatMap((a, i) =>
            AGENT_LIST.slice(i + 1).map((b) => {
              const key = [a.id, b.id].sort().join('~')
              const active = activePairs.has(key)
              return (
                <use
                  key={key}
                  href={`#chord-${a.id}-${b.id}`}
                  stroke={active ? 'rgb(var(--signal))' : 'rgb(var(--line))'}
                  strokeWidth={active ? 1.4 : 0.6}
                  opacity={active ? 0.75 : anyAwake ? 0.28 : 0.14}
                  className="transition-opacity duration-500"
                />
              )
            }),
          )}
        </g>

        {/* Spokes to the core. */}
        <g fill="none">
          {AGENT_LIST.map((a) => {
            const st = agentStatus[a.id]
            const live = st !== 'dormant'
            return (
              <use
                key={`spoke-${a.id}`}
                href={`#link-${a.id}`}
                stroke={live ? `rgb(var(${a.hueVar}))` : 'rgb(var(--line))'}
                strokeWidth={st === 'transmitting' ? 1.6 : 0.9}
                opacity={live ? (st === 'transmitting' ? 0.9 : 0.4) : 0.2}
                className="transition-opacity duration-500"
              />
            )
          })}
        </g>

        {/* Data pulses. SMIL keeps this off the React render path entirely. */}
        {!reducedMotion && (
          <g>
            {AGENT_LIST.filter((a) => agentStatus[a.id] === 'thinking' || agentStatus[a.id] === 'transmitting').map(
              (a, i) => (
                <circle key={`dp-${a.id}`} r={2.2} fill={`rgb(var(${a.hueVar}))`} opacity={0.9}>
                  <animateMotion
                    dur={`${singularity ? 0.9 : 2.6 + (i % 3) * 0.4}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.32}s`}
                    keyPoints="1;0"
                    keyTimes="0;1"
                    calcMode="linear"
                  >
                    <mpath href={`#link-${a.id}`} />
                  </animateMotion>
                </circle>
              ),
            )}
            {pulses.map((p) => {
              const [x, y] = [p.from, p.to].sort()
              return (
                <circle key={`ap-${p.id}`} r={3} fill="rgb(var(--signal-soft))">
                  <animateMotion dur="1.1s" repeatCount="2" keyPoints={p.from === x ? '0;1' : '1;0'} keyTimes="0;1" calcMode="linear">
                    <mpath href={`#chord-${x}-${y}`} />
                  </animateMotion>
                </circle>
              )
            })}
          </g>
        )}

        {/* NEXUS core */}
        <g>
          <circle cx={C} cy={C} r={radius * 0.55} fill="url(#core-glow)" />
          <circle
            cx={C}
            cy={C}
            r={40}
            fill="rgb(var(--surface))"
            stroke="rgb(var(--signal))"
            strokeWidth={1.2}
            opacity={0.95}
          />
          <circle
            cx={C}
            cy={C}
            r={52}
            fill="none"
            stroke="rgb(var(--signal))"
            strokeWidth={1}
            strokeDasharray="3 9"
            opacity={0.5}
          >
            {!reducedMotion && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${C} ${C}`}
                to={`360 ${C} ${C}`}
                dur={singularity ? '5s' : '26s'}
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle
            cx={C}
            cy={C}
            r={64}
            fill="none"
            stroke="rgb(var(--line-strong))"
            strokeWidth={0.8}
            strokeDasharray="1 5"
            opacity={0.55}
          >
            {!reducedMotion && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`360 ${C} ${C}`}
                to={`0 ${C} ${C}`}
                dur={singularity ? '8s' : '44s'}
                repeatCount="indefinite"
              />
            )}
          </circle>
          <text
            x={C}
            y={C - 3}
            textAnchor="middle"
            className="fill-ink font-mono"
            style={{ fontSize: 13, letterSpacing: '0.18em' }}
          >
            NEXUS
          </text>
          <text
            x={C}
            y={C + 13}
            textAnchor="middle"
            className="fill-signal font-mono tabular-nums"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            {status === 'idle' ? 'STANDBY' : `${Math.round((t / 23400) * 100)}%`}
          </text>
        </g>

        {/* Agent nodes */}
        {AGENT_LIST.map((a) => {
          const pos = positions[a.id]
          const st = agentStatus[a.id]
          const stroke = STATUS_STROKE[st]
          const isSelected = selectedAgent === a.id
          const outward = pos.y > C ? 1 : -1
          return (
            <g
              key={a.id}
              role="button"
              tabIndex={0}
              aria-label={`${a.name}, ${a.role}. Status ${STATUS_COPY[st]}. Open inspector.`}
              aria-pressed={isSelected}
              onClick={() => selectAgent(isSelected ? null : a.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  selectAgent(isSelected ? null : a.id)
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>.focus-ring]:opacity-100"
              style={{ transition: 'transform 600ms cubic-bezier(0.22,1,0.36,1)' }}
            >
              <circle
                className="focus-ring pointer-events-none opacity-0 transition-opacity"
                cx={pos.x}
                cy={pos.y}
                r={42}
                fill="none"
                stroke="rgb(var(--signal))"
                strokeWidth={1.5}
              />
              <circle cx={pos.x} cy={pos.y} r={34} fill="rgb(var(--void))" opacity={0.9} />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={30}
                fill={isSelected ? `rgb(var(${a.hueVar}) / 0.14)` : 'rgb(var(--surface))'}
                stroke={`rgb(var(${a.hueVar}))`}
                strokeWidth={stroke.width}
                strokeDasharray={stroke.dash}
                opacity={stroke.opacity}
                className="transition-all duration-500"
              />
              {st === 'transmitting' && !reducedMotion && (
                <circle cx={pos.x} cy={pos.y} r={30} fill="none" stroke={`rgb(var(${a.hueVar}))`} strokeWidth={1}>
                  <animate attributeName="r" from="30" to="46" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                className="pointer-events-none font-mono"
                fill={st === 'dormant' ? 'rgb(var(--ink-faint))' : `rgb(var(${a.hueVar}))`}
                style={{ fontSize: 12, letterSpacing: '0.12em' }}
              >
                {a.glyph}
              </text>
              <text
                x={pos.x}
                y={pos.y + outward * 52}
                textAnchor="middle"
                className="pointer-events-none fill-ink font-mono"
                style={{ fontSize: 10.5, letterSpacing: '0.16em' }}
              >
                {a.name.toUpperCase()}
              </text>
              <text
                x={pos.x}
                y={pos.y + outward * 52 + (outward > 0 ? 14 : -13)}
                textAnchor="middle"
                className="pointer-events-none fill-ink-faint font-mono"
                style={{ fontSize: 9, letterSpacing: '0.1em' }}
              >
                {STATUS_COPY[st].toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      {singularity && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span className="border border-signal/50 bg-void/85 px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-signal">
            Recursive intelligence threshold reached
          </span>
        </div>
      )}
    </div>
  )
})

/** Mobile substitute: the same information as a vertically navigable feed. */
export function AgentFeed({ className }: { className?: string }) {
  const { agentStatus, selectAgent, selectedAgent, analysis, visible } = useNexus()
  return (
    <ul className={cn('divide-y divide-line border border-line', className)}>
      {AGENT_LIST.map((a) => {
        const st = agentStatus[a.id]
        const count = visible.insights.filter((i) => i.agent === a.id).length
        return (
          <li key={a.id}>
            <button
              onClick={() => selectAgent(selectedAgent === a.id ? null : a.id)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-raised"
              aria-label={`${a.name}, ${STATUS_COPY[st]}, ${count} contributions`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-[0.6875rem]"
                style={{
                  borderColor: `rgb(var(${a.hueVar}))`,
                  color: st === 'dormant' ? 'rgb(var(--ink-faint))' : `rgb(var(${a.hueVar}))`,
                  borderStyle: st === 'dormant' ? 'dashed' : 'solid',
                }}
              >
                {a.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{a.name}</span>
                <span className="block truncate font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
                  {STATUS_COPY[st]} · {a.role}
                </span>
              </span>
              <span className="font-mono text-[0.6875rem] tabular-nums text-ink-dim">
                {analysis ? count : '—'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
