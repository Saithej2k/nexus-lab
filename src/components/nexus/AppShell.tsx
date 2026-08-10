import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNexus } from '@/hooks/useNexus'
import { MissionComposer } from './MissionComposer'
import { Lab } from './Lab'
import { TopBar } from './TopBar'
import { Ignition } from './Ignition'
import { TransportBar } from '@/components/simulation/TransportBar'
import { AgentInspector } from '@/components/agents/AgentInspector'
import { NodeInspector } from '@/components/graph/NodeInspector'
import { CommandPalette } from '@/components/command/CommandPalette'

export function AppShell() {
  const { screen, analysis, reducedMotion, togglePlay, status, singularity, setSingularity } = useNexus()

  // Document title tracks the mission — the tab is part of the product.
  useEffect(() => {
    document.title = analysis
      ? `${analysis.mission.title} — NEXUS`
      : 'NEXUS — Autonomous Future Lab'
  }, [analysis])

  // Space toggles the timeline anywhere outside a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (e.code === 'Space' && !typing && screen === 'lab' && status !== 'idle') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, screen, status])

  // Singularity is a temporary state, never a mode you get stuck in.
  useEffect(() => {
    if (!singularity) return
    const id = window.setTimeout(() => setSingularity(false), 14000)
    return () => window.clearTimeout(id)
  }, [singularity, setSingularity])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-void">
      {screen === 'lab' && <TopBar />}

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {screen === 'compose' ? (
            <motion.div
              key="compose"
              initial={false}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <MissionComposer />
            </motion.div>
          ) : (
            <motion.div
              key="lab"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Lab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {screen === 'lab' && (
        <div className="sticky bottom-0 z-30 print:hidden">
          <TransportBar />
        </div>
      )}

      <Ignition />
      <AgentInspector />
      <NodeInspector />
      <CommandPalette />
    </div>
  )
}
