import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useMedia'

const R = 86
const CIRC = 2 * Math.PI * R

/**
 * The consensus instrument: a graduated ring where the agreed arc and the
 * dissenting arc are drawn on the same scale, so disagreement is legible rather
 * than hidden inside an average.
 */
export function ConfidenceRing({ confidence, dissent }: { confidence: number; dissent: number }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? confidence : 0)

  useEffect(() => {
    if (reduce) {
      setShown(confidence)
      return
    }
    let frame = 0
    const start = performance.now()
    const dur = 1200
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(confidence * eased))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [confidence, reduce])

  const ticks = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 220 220" className="h-auto w-full" role="img" aria-label={`Consensus confidence ${confidence} out of 100, with ${dissent} percent recorded dissent.`}>
        <g transform="translate(110 110)">
          {/* graduation */}
          {ticks.map((i) => {
            const a = (i / ticks.length) * Math.PI * 2 - Math.PI / 2
            const major = i % 5 === 0
            const r1 = R + 12
            const r2 = R + (major ? 20 : 16)
            return (
              <line
                key={i}
                x1={Math.cos(a) * r1}
                y1={Math.sin(a) * r1}
                x2={Math.cos(a) * r2}
                y2={Math.sin(a) * r2}
                stroke="rgb(var(--line-strong))"
                strokeWidth={major ? 1 : 0.6}
                opacity={major ? 0.8 : 0.4}
              />
            )
          })}

          <circle r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="8" />

          {/* dissent arc, drawn backwards from the top */}
          <circle
            r={R}
            fill="none"
            stroke="rgb(var(--hazard))"
            strokeWidth="8"
            strokeDasharray={`${(dissent / 100) * CIRC} ${CIRC}`}
            strokeLinecap="butt"
            transform="rotate(-90) scale(1 -1)"
            opacity="0.7"
          />

          {/* consensus arc */}
          <circle
            r={R}
            fill="none"
            stroke="rgb(var(--signal))"
            strokeWidth="8"
            strokeDasharray={`${(shown / 100) * CIRC} ${CIRC}`}
            strokeLinecap="butt"
            transform="rotate(-90)"
            style={{ transition: reduce ? 'none' : 'stroke-dasharray 120ms linear' }}
          />

          <circle r={R - 22} fill="none" stroke="rgb(var(--line))" strokeWidth="0.7" strokeDasharray="2 6" />

          <text textAnchor="middle" y="-6" className="fill-ink font-mono tabular-nums" style={{ fontSize: 44, letterSpacing: '-0.02em' }}>
            {shown}
          </text>
          <text textAnchor="middle" y="16" className="fill-ink-faint font-mono" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
            CONFIDENCE
          </text>
          <text textAnchor="middle" y="38" className="fill-hazard font-mono tabular-nums" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
            {dissent}% DISSENT
          </text>
        </g>
      </svg>
    </div>
  )
}
