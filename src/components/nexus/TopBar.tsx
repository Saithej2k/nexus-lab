import { useState, type ReactNode } from 'react'
import { Command, Maximize2, Minimize2, Moon, Printer, Sun, Volume2, VolumeX } from 'lucide-react'
import { PHASES } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'
import { cn, formatClock } from '@/lib/utils'
import { KeyHint } from '@/components/ui/primitives'

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center border transition-colors',
        active ? 'border-signal text-signal' : 'border-line text-ink-dim hover:border-line-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

export function TopBar() {
  const {
    analysis, outcome, t, phase, status, soundOn, toggleSound, theme, toggleTheme,
    focusMode, toggleFocus, setPaletteOpen, reset,
  } = useNexus()

  const p = PHASES.find((x) => x.id === phase)
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/90 backdrop-blur supports-[backdrop-filter]:bg-void/75 print:hidden">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:gap-4 sm:px-5">
        <button
          onClick={reset}
          className="group flex shrink-0 items-center gap-2 outline-none"
          aria-label="NEXUS — new mission"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 border border-signal/60" />
            <span
              className={cn(
                'block h-1.5 w-1.5 bg-signal',
                status === 'running' && 'animate-breathe',
              )}
            />
          </span>
          <span className="font-mono text-[0.75rem] uppercase tracking-[0.24em] text-ink transition-colors group-hover:text-signal">
            Nexus
          </span>
        </button>

        <div className="hidden h-5 w-px bg-line sm:block" />

        <div className="min-w-0 flex-1">
          {analysis ? (
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-[0.8125rem] text-ink">{analysis.mission.title}</span>
              <button
                onClick={copyLink}
                title="Copy shareable mission link"
                className="hidden shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-signal sm:inline"
              >
                {copied ? 'link copied' : analysis.mission.id}
                {outcome?.degradedFrom === 'remote' && ' · local'}
              </button>
            </div>
          ) : (
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
              Autonomous Future Lab
            </span>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
            {status === 'idle' ? 'Standby' : `${p?.code} ${p?.label}`}
          </span>
          <span className="font-mono text-[0.6875rem] tabular-nums text-ink-dim">{formatClock(t)}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {analysis && (
            <IconButton label="Print briefing" onClick={() => window.print()}>
              <Printer size={13} />
            </IconButton>
          )}
          <IconButton label={soundOn ? 'Mute sound' : 'Enable sound'} onClick={toggleSound} active={soundOn}>
            {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </IconButton>
          <IconButton label={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </IconButton>
          <IconButton label="Focus mode" onClick={toggleFocus} active={focusMode}>
            {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </IconButton>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
            className="hidden h-8 items-center gap-2 border border-line px-2.5 text-ink-dim transition-colors hover:border-line-strong hover:text-ink sm:flex"
          >
            <Command size={12} />
            <KeyHint>K</KeyHint>
          </button>
        </div>
      </div>
    </header>
  )
}
