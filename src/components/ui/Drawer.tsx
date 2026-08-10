import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useMedia'

/**
 * Right-side inspector. Modal on mobile, a docked panel on desktop, with focus
 * management and escape-to-close in both.
 */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  accent,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  accent?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const id = window.setTimeout(() => ref.current?.focus(), 40)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(id)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-void/70 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? false : { x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, duration: reduce ? 0 : undefined }}
            className={cn(
              'fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col border-l border-line bg-surface outline-none',
              'sm:w-[26rem] lg:w-[27rem]',
            )}
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                {eyebrow && (
                  <div
                    className="font-mono text-[0.625rem] uppercase tracking-[0.16em]"
                    style={{ color: accent ?? 'rgb(var(--signal))' }}
                  >
                    {eyebrow}
                  </div>
                )}
                <h3 className="mt-1 text-lg leading-snug text-ink text-pretty">{title}</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close inspector"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-line text-ink-dim transition-colors hover:border-signal hover:text-signal"
              >
                <X size={14} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
