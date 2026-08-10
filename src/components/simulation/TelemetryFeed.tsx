import { useEffect, useRef } from 'react'
import { PHASES } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { formatClock } from '@/lib/utils'
import { Label, Skeleton } from '@/components/ui/primitives'

/** System activity. Reads like an instrument log, not a fake terminal. */
export function TelemetryFeed({ height = 'h-[22rem]' }: { height?: string }) {
  const { visible, status, playing } = useNexus()
  const ref = useRef<HTMLDivElement>(null)
  const count = visible.telemetry.length

  useEffect(() => {
    const el = ref.current
    if (el && playing) el.scrollTop = el.scrollHeight
  }, [count, playing])

  return (
    <div className="flex h-full flex-col border border-line bg-surface/40">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <Label>System activity</Label>
        <span className="flex items-center gap-1.5">
          <span
            className={
              status === 'running'
                ? 'block h-1.5 w-1.5 animate-breathe rounded-full bg-signal'
                : 'block h-1.5 w-1.5 rounded-full bg-ink-faint'
            }
            aria-hidden
          />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
            {status === 'running' ? 'Live' : status === 'complete' ? 'Archived' : 'Idle'}
          </span>
        </span>
      </div>

      <div ref={ref} className={`min-h-0 flex-1 overflow-y-auto px-3 py-2 ${height}`} aria-live="polite" aria-atomic="false">
        {status === 'idle' && (
          <div className="space-y-2 pt-1">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-3" />
            ))}
            <p className="pt-3 text-[0.75rem] text-ink-faint">Awaiting mission.</p>
          </div>
        )}
        <ul className="space-y-1">
          {visible.telemetry.map((line, i) => {
            const p = PHASES.find((x) => x.id === line.phase)
            return (
              <li key={`${line.at}-${i}`} className="flex gap-2 font-mono text-[0.6875rem] leading-relaxed">
                <span className="shrink-0 tabular-nums text-ink-faint">{formatClock(line.at).slice(0, 5)}</span>
                <span className="shrink-0 text-signal">{p?.code}</span>
                <span className="min-w-0 text-ink-dim">{line.text}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
