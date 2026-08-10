import { AnimatePresence, motion } from 'framer-motion'
import { PHASES } from '@/lib/agents'
import { useNexus } from '@/hooks/useNexus'

/**
 * The transition from composer to command center.
 *
 * Not a spinner: the phase ladder writes itself while the objective is parsed,
 * then dissolves to reveal an interface that is already populating.
 */
export function Ignition() {
  const { ignition, analysis } = useNexus()

  return (
    <AnimatePresence>
      {ignition && (
        <motion.div
          // Never interactive: if a slow frame ever leaves this mid-exit, it
          // must not be able to swallow a click.
          className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <div className="pointer-events-none absolute inset-0 instrument-grid opacity-60" />
          <div className="relative w-full max-w-lg px-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-signal"
            >
              Initializing Nexus
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="display mt-3 text-[clamp(1.25rem,3vw,1.9rem)] leading-tight text-ink text-balance"
            >
              {analysis?.mission.prompt ?? 'Parsing objective…'}
            </motion.h2>

            <ol className="mt-8 space-y-2">
              {PHASES.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.13, duration: 0.35 }}
                  className="flex items-center gap-3"
                >
                  <span className="font-mono text-[0.6875rem] tabular-nums text-signal">{p.code}</span>
                  <span className="text-[0.8125rem] text-ink-dim">{p.label}</span>
                  <span className="h-px flex-1 bg-line" />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.13 }}
                    className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint"
                  >
                    queued
                  </motion.span>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
