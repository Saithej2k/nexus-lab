import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/primitives'

export function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-void px-6">
      <div className="pointer-events-none absolute inset-0 instrument-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-0 vignette" aria-hidden />
      <div className="relative w-full max-w-md">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-hazard">Signal lost</span>
        <h1 className="display mt-3 text-[clamp(3rem,10vw,5rem)] leading-none text-ink">404</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-dim text-pretty">
          No mission is registered at this address. NEXUS keeps no record of futures it was never asked to
          simulate.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link to="/">
            <Button variant="primary">Return to the lab</Button>
          </Link>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
            ⌘K for commands
          </span>
        </div>
        <svg viewBox="0 0 320 60" className="mt-10 h-auto w-full" aria-hidden>
          <path
            d="M0 30 H 90 L 100 12 L 112 48 L 124 22 L 134 30 H 320"
            fill="none"
            stroke="rgb(var(--line-strong))"
            strokeWidth="1"
          />
          <circle cx="112" cy="48" r="2.5" fill="rgb(var(--hazard))" />
        </svg>
      </div>
    </div>
  )
}
