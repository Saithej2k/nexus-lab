import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, Compass, Eye, Gauge, GitBranch, Moon, Play, Radio, RotateCcw, Sparkles, Sun, Target, Volume2, VolumeX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AGENT_LIST } from '@/lib/agents'
import { DEMO_MISSION_PROMPT } from '@/data/missions'
import { useNexus } from '@/hooks/useNexus'
import { KeyHint } from '@/components/ui/primitives'
import { cn, scrollToSection } from '@/lib/utils'

interface Command {
  id: string
  label: string
  hint?: string
  group: string
  icon: LucideIcon
  run: () => void
  keywords?: string
}

export function CommandPalette() {
  const nexus = useNexus()
  const { paletteOpen, setPaletteOpen } = nexus
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const close = useCallback(() => {
    setPaletteOpen(false)
    setQuery('')
    setIndex(0)
  }, [setPaletteOpen])

  const commands = useMemo<Command[]>(() => {
    const go = (id: string) => () => {
      close()
      window.setTimeout(() => scrollToSection(id), 60)
    }
    return [
      {
        id: 'new',
        label: 'New Mission',
        hint: 'Return to the composer',
        group: 'Mission',
        icon: RotateCcw,
        run: () => {
          close()
          nexus.reset()
        },
      },
      {
        id: 'demo',
        label: 'Load Demo Mission',
        hint: 'Car-optional city by 2040',
        group: 'Mission',
        icon: Sparkles,
        run: () => {
          close()
          nexus.initialize(DEMO_MISSION_PROMPT)
        },
      },
      {
        id: 'run',
        label: nexus.playing ? 'Pause Simulation' : 'Run Simulation',
        hint: 'Play or pause the analysis timeline',
        group: 'Mission',
        icon: Play,
        run: () => {
          close()
          nexus.togglePlay()
        },
      },
      {
        id: 'replay',
        label: 'Replay Analysis',
        hint: 'Rewind and watch it rebuild',
        group: 'Mission',
        icon: Activity,
        run: () => {
          close()
          nexus.seek(0)
          nexus.setPlaying(true)
        },
      },
      ...AGENT_LIST.map<Command>((a) => ({
        id: `agent-${a.id}`,
        label: `Open Agent: ${a.name}`,
        hint: a.role,
        group: 'Agents',
        icon: Radio,
        keywords: a.doctrine,
        run: () => {
          close()
          nexus.selectAgent(a.id)
        },
      })),
      { id: 'graph', label: 'Show Decision Graph', group: 'Navigate', icon: GitBranch, run: go('section-graph') },
      { id: 'debate', label: 'Show Cross-Examination', group: 'Navigate', icon: Compass, run: go('section-debate') },
      { id: 'scenarios', label: 'Show Scenarios', group: 'Navigate', icon: Gauge, run: go('section-scenarios') },
      { id: 'consensus', label: 'Jump to Consensus', group: 'Navigate', icon: Target, run: go('section-consensus') },
      { id: 'dna', label: 'Show Decision DNA', group: 'Navigate', icon: Activity, run: go('section-dna') },
      {
        id: 'focus',
        label: nexus.focusMode ? 'Exit Focus Mode' : 'Toggle Focus Mode',
        hint: 'Hide chrome, keep the instrument',
        group: 'View',
        icon: Eye,
        run: () => {
          close()
          nexus.toggleFocus()
        },
      },
      {
        id: 'sound',
        label: nexus.soundOn ? 'Mute Sound' : 'Enable Sound',
        group: 'View',
        icon: nexus.soundOn ? Volume2 : VolumeX,
        run: () => {
          close()
          nexus.toggleSound()
        },
      },
      {
        id: 'theme',
        label: nexus.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        group: 'View',
        icon: nexus.theme === 'dark' ? Sun : Moon,
        run: () => {
          close()
          nexus.toggleTheme()
        },
      },
      {
        id: 'singularity',
        label: '/singularity',
        hint: nexus.singularity ? 'Stand down recursive mode' : 'Tighten the constellation',
        group: 'System',
        icon: Sparkles,
        keywords: 'easter egg recursive intelligence',
        run: () => {
          close()
          nexus.setSingularity(!nexus.singularity)
        },
      },
    ]
  }, [nexus, close])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands.filter((c) => c.id !== 'singularity')
    return commands.filter((c) =>
      `${c.label} ${c.hint ?? ''} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q.replace(/^\//, '')),
    )
  }, [commands, query])

  // Global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(!paletteOpen)
      }
      if (e.key === 'Escape' && paletteOpen) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen, setPaletteOpen, close])

  useEffect(() => {
    if (paletteOpen) window.setTimeout(() => inputRef.current?.focus(), 30)
  }, [paletteOpen])

  useEffect(() => {
    setIndex(0)
  }, [query])

  useEffect(() => {
    listRef.current?.querySelectorAll('li')[index]?.scrollIntoView({ block: 'nearest' })
  }, [index])

  let lastGroup = ''

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-void/70 px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[34rem] border border-line-strong/60 bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal">⌘K</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setIndex((i) => (i + 1) % Math.max(filtered.length, 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1))
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    filtered[index]?.run()
                  }
                }}
                placeholder="Search commands, or type /singularity"
                aria-label="Search commands"
                className="h-12 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-faint"
              />
            </div>

            <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5" role="listbox" aria-label="Commands">
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-ink-faint">No command matches that.</li>
              )}
              {filtered.map((c, i) => {
                const showGroup = c.group !== lastGroup
                lastGroup = c.group
                const Icon = c.icon
                return (
                  <li key={c.id} role="option" aria-selected={i === index}>
                    {showGroup && (
                      <div className="px-4 pb-1 pt-3 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-faint">
                        {c.group}
                      </div>
                    )}
                    <button
                      onClick={c.run}
                      onMouseEnter={() => setIndex(i)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                        i === index ? 'bg-signal/[0.09] text-ink' : 'text-ink-dim hover:bg-raised',
                      )}
                    >
                      <Icon size={14} className={i === index ? 'text-signal' : 'text-ink-faint'} />
                      <span className="flex-1 truncate text-[0.875rem]">{c.label}</span>
                      {c.hint && <span className="hidden truncate text-[0.75rem] text-ink-faint sm:block">{c.hint}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2">
              <span className="flex items-center gap-1.5 font-mono text-[0.625rem] text-ink-faint">
                <KeyHint>↑</KeyHint>
                <KeyHint>↓</KeyHint> navigate
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[0.625rem] text-ink-faint">
                <KeyHint>↵</KeyHint> run
              </span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.625rem] text-ink-faint">
                <KeyHint>esc</KeyHint> close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
