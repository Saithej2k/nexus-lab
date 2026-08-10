import { useCallback, useRef } from 'react'
import { Pause, Play, RotateCcw, SkipBack } from 'lucide-react'
import { PHASES, PHASE_STARTS, RUN_DURATION } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { cn, formatClock } from '@/lib/utils'

/**
 * Replay transport. The same control drives the live run and the replay — the
 * timeline is one object, so scrubbing back rebuilds the graph as it was.
 */
export function TransportBar() {
  const { t, seek, playing, togglePlay, speed, setSpeed, status, phase, reset } = useNexus()
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const seekFromEvent = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      seek(((clientX - rect.left) / rect.width) * RUN_DURATION)
    },
    [seek],
  )

  const pct = (t / RUN_DURATION) * 100

  return (
    <div className="border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-5">
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlay}
            disabled={status === 'idle'}
            aria-label={playing ? 'Pause replay' : 'Play replay'}
            className="flex h-9 w-9 items-center justify-center border border-line-strong/70 text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-40"
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => seek(0)}
            disabled={status === 'idle'}
            aria-label="Restart from beginning"
            className="flex h-9 w-9 items-center justify-center border border-line text-ink-dim transition-colors hover:border-signal hover:text-signal disabled:opacity-40"
          >
            <SkipBack size={13} />
          </button>
          <button
            onClick={reset}
            disabled={status === 'idle'}
            aria-label="New mission"
            className="hidden h-9 w-9 items-center justify-center border border-line text-ink-dim transition-colors hover:border-signal hover:text-signal disabled:opacity-40 sm:flex"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <span className="hidden font-mono text-[0.6875rem] tabular-nums text-ink-dim sm:block">
          {formatClock(t)}
        </span>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={status === 'idle' ? -1 : 0}
          aria-label="Analysis timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-valuetext={`${PHASES.find((p) => p.id === phase)?.label}, ${Math.round(pct)} percent`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') seek(t + 800)
            if (e.key === 'ArrowLeft') seek(t - 800)
            if (e.key === 'Home') seek(0)
            if (e.key === 'End') seek(RUN_DURATION)
          }}
          onPointerDown={(e) => {
            if (status === 'idle') return
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            seekFromEvent(e.clientX)
          }}
          onPointerMove={(e) => dragging.current && seekFromEvent(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className={cn(
            'group relative h-9 flex-1 cursor-pointer touch-none select-none',
            status === 'idle' && 'pointer-events-none opacity-40',
          )}
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-raised" />
          <div
            className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-signal"
            style={{ width: `${pct}%` }}
          />
          {PHASES.map((p) => (
            <span
              key={p.id}
              className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-line-strong"
              style={{ left: `${(PHASE_STARTS[p.id] / RUN_DURATION) * 100}%` }}
              aria-hidden
            />
          ))}
          <span
            className="absolute top-1/2 h-3.5 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-signal shadow-[0_0_0_3px_rgb(var(--void))] transition-transform group-hover:scale-y-125"
            style={{ left: `${pct}%` }}
            aria-hidden
          />
        </div>

        <div className="flex items-center gap-px" role="group" aria-label="Replay speed">
          {([1, 2, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={cn(
                'h-8 w-8 border font-mono text-[0.625rem] transition-colors',
                speed === s ? 'border-signal text-signal' : 'border-line text-ink-faint hover:text-ink',
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
