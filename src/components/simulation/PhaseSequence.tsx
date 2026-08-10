import { PHASES, phaseIndex } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { cn } from '@/lib/utils'

/** The analysis sequence, always visible and always clickable as navigation. */
export function PhaseSequence({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) {
  const { phase, phaseProgress, jumpToPhase, status } = useNexus()
  const currentIdx = phaseIndex(phase)

  return (
    <ol
      className={cn(
        orientation === 'vertical'
          ? 'space-y-px'
          : 'flex gap-px overflow-x-auto no-scrollbar',
      )}
      aria-label="Analysis phases"
    >
      {PHASES.map((p, i) => {
        const done = i < currentIdx || status === 'complete'
        const active = i === currentIdx && status !== 'idle'
        const pending = i > currentIdx
        return (
          <li key={p.id} className={orientation === 'horizontal' ? 'min-w-[9.5rem] flex-1' : ''}>
            <button
              onClick={() => jumpToPhase(p.id)}
              disabled={status === 'idle'}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'group relative block w-full border-l-2 px-3 py-2.5 text-left transition-colors duration-300',
                orientation === 'horizontal' && 'border-l-0 border-t-2 py-2',
                active ? 'border-signal bg-signal/[0.06]' : done ? 'border-line-strong' : 'border-line',
                !pending && status !== 'idle' && 'hover:bg-raised',
                status === 'idle' && 'cursor-default opacity-60',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-mono text-[0.625rem] tabular-nums',
                    active ? 'text-signal' : done ? 'text-ink-dim' : 'text-ink-faint',
                  )}
                >
                  {p.code}
                </span>
                <span
                  className={cn(
                    'text-[0.75rem] leading-snug',
                    orientation === 'horizontal' && 'truncate',
                    active ? 'text-ink' : done ? 'text-ink-dim' : 'text-ink-faint',
                  )}
                >
                  {p.label}
                </span>
                {done && !active && <span className="ml-auto font-mono text-[0.625rem] text-thrive">✓</span>}
              </div>
              {active && (
                <>
                  <p className="mt-1 hidden text-[0.6875rem] leading-snug text-ink-faint lg:block">{p.detail}</p>
                  <div className="mt-1.5 h-[2px] w-full bg-raised">
                    <div
                      className="h-full bg-signal"
                      style={{ width: `${Math.round(phaseProgress * 100)}%`, transition: 'width 120ms linear' }}
                    />
                  </div>
                </>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
