import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Command } from 'lucide-react'
import { EXAMPLE_MISSIONS, DEMO_MISSION_PROMPT } from '@/data/missions'
import { ACTIVE_SOURCE_LABEL } from '@/lib/sources'
import { useNexus } from '@/hooks/useNexus'
import { Constellation } from '@/components/agents/Constellation'
import { Button, KeyHint, Label } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

/**
 * The composer is deliberately static on entry. It is the first thing a person
 * sees, so nothing here may depend on an animation frame having run — the
 * motion on this screen comes from the constellation, which is alive by nature.
 */
export function MissionComposer() {
  const { initialize, setPaletteOpen } = useNexus()
  const [value, setValue] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => ref.current?.focus(), 400)
    return () => window.clearTimeout(id)
  }, [])

  const submit = useCallback(() => {
    if (value.trim()) initialize(value)
  }, [value, initialize])

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 instrument-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-0 vignette" aria-hidden />

      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:gap-14 lg:pt-12">
        <div className="flex min-w-0 flex-col justify-center py-6 lg:py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.28em] text-signal">Nexus</span>
            <span className="h-px w-10 bg-line-strong" />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint">
              Autonomous Future Lab
            </span>
          </div>

          <h1 className="display mt-6 text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.02] text-ink text-balance">
            What future should
            <br />
            we simulate?
          </h1>

          <p className="mt-5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-ink-dim text-pretty">
            Give NEXUS a mission that has no obvious answer. Six specialist agents will build competing
            models of it, attack each other&rsquo;s assumptions, simulate three futures, and converge on one
            decisive move — with their disagreements left visible.
          </p>

          <div className="mt-8">
            <label htmlFor="mission" className="sr-only">
              Mission
            </label>
            <div className="group relative border border-line bg-surface/70 transition-colors focus-within:border-signal">
              <span className="pointer-events-none absolute left-4 top-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                Mission
              </span>
              <textarea
                id="mission"
                ref={ref}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    submit()
                  }
                }}
                rows={3}
                placeholder="Design a city where owning a private car becomes unnecessary by 2040."
                className="w-full resize-none bg-transparent px-4 pb-4 pt-10 text-[1.0625rem] leading-relaxed text-ink outline-none placeholder:text-ink-faint/70"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
                  {value.trim().length} chars · {ACTIVE_SOURCE_LABEL}
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 font-mono text-[0.625rem] text-ink-faint sm:flex">
                    <KeyHint>⌘</KeyHint>
                    <KeyHint>↵</KeyHint>
                  </span>
                  <Button variant="primary" size="md" onClick={submit} disabled={!value.trim()}>
                    Initialize Nexus
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <Label>Or run a prepared mission</Label>
              <button
                onClick={() => initialize(DEMO_MISSION_PROMPT)}
                className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-signal transition-opacity hover:opacity-70"
              >
                Load demo →
              </button>
            </div>
            <ul className="mt-3 grid gap-px bg-line sm:grid-cols-2">
              {EXAMPLE_MISSIONS.map((m) => (
                <li key={m.prompt}>
                  <button
                    onClick={() => initialize(m.prompt)}
                    onMouseEnter={() => setHovered(m.prompt)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(m.prompt)}
                    onBlur={() => setHovered(null)}
                    className="h-full w-full bg-surface/60 px-3.5 py-3 text-left transition-colors duration-200 hover:bg-raised"
                  >
                    <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-signal">
                      {m.tag}
                    </span>
                    <span className="mt-1.5 block text-[0.8125rem] leading-snug text-ink text-pretty">
                      {m.prompt}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-[0.6875rem] leading-snug transition-colors duration-200',
                        hovered === m.prompt ? 'text-ink-dim' : 'text-ink-faint/40',
                      )}
                    >
                      {m.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-signal"
            >
              <Command size={11} /> Command palette
              <KeyHint>⌘K</KeyHint>
            </button>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
              No account · no credentials · works offline
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:sticky lg:top-8 lg:h-[calc(100dvh-6rem)]">
          <div className="w-full max-w-[560px]">
            <Constellation />
            <p className="mt-2 text-center font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
              Six specialists · dormant · awaiting objective
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
