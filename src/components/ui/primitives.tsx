import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Small, sharp building blocks. Everything else composes from these so the
   instrument reads as one object rather than a collection of widgets. */

export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('border border-line bg-surface/60', className)} {...props} />
  ),
)
Panel.displayName = 'Panel'

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('font-mono text-micro uppercase tracking-[0.14em] text-ink-faint', className)}>
      {children}
    </span>
  )
}

export function SectionHeader({
  index,
  title,
  caption,
  action,
  id,
}: {
  index: string
  title: string
  caption?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <header
      id={id}
      tabIndex={-1}
      className="mb-5 flex flex-wrap items-end justify-between gap-4 scroll-mt-24 outline-none"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-micro tabular-nums text-signal">{index}</span>
          <h2 className="display text-[clamp(1.35rem,2.4vw,1.9rem)] leading-tight text-ink">{title}</h2>
        </div>
        {caption && (
          <p className="mt-1.5 max-w-[62ch] text-[0.8125rem] leading-relaxed text-ink-dim text-pretty">{caption}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'outline', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-mono uppercase tracking-[0.12em]',
        'transition-[background-color,border-color,color,transform] duration-200 ease-instrument',
        'disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' && 'h-8 px-3 text-[0.6875rem]',
        size === 'md' && 'h-10 px-4 text-[0.6875rem]',
        size === 'lg' && 'h-12 px-6 text-xs',
        variant === 'primary' &&
          'border-signal bg-signal text-void hover:bg-signal-soft hover:border-signal-soft active:translate-y-px',
        variant === 'outline' &&
          'border-line-strong/70 bg-transparent text-ink hover:border-signal hover:text-signal',
        variant === 'ghost' && 'border-transparent bg-transparent text-ink-dim hover:text-ink hover:bg-raised',
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

/** A labelled value bar. Always states the number — colour is never the only cue. */
export function Meter({
  value,
  label,
  tone = 'signal',
  size = 'md',
  suffix = '',
}: {
  value: number
  label?: string
  tone?: 'signal' | 'caution' | 'hazard' | 'thrive' | 'dim'
  size?: 'sm' | 'md'
  suffix?: string
}) {
  const toneVar =
    tone === 'caution' ? '--caution' : tone === 'hazard' ? '--hazard' : tone === 'thrive' ? '--thrive' : tone === 'dim' ? '--ink-faint' : '--signal'
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <Label>{label}</Label>
          <span className="font-mono text-[0.6875rem] tabular-nums text-ink">
            {value}
            {suffix}
          </span>
        </div>
      )}
      <div
        className={cn('relative w-full overflow-hidden bg-raised', size === 'sm' ? 'h-[3px]' : 'h-[5px]')}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full transition-[width] duration-700 ease-instrument"
          style={{ width: `${value}%`, background: `rgb(var(${toneVar}))` }}
        />
      </div>
    </div>
  )
}

export function Pill({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'signal' | 'hazard' | 'caution' | 'thrive'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.12em]',
        tone === 'default' && 'border-line text-ink-dim',
        tone === 'signal' && 'border-signal/40 text-signal',
        tone === 'hazard' && 'border-hazard/40 text-hazard',
        tone === 'caution' && 'border-caution/40 text-caution',
        tone === 'thrive' && 'border-thrive/40 text-thrive',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Loading state shaped like the thing it replaces, never a generic spinner. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-raised/70', className)}>
      <div className="absolute inset-0 -translate-x-full animate-sweep bg-gradient-to-r from-transparent via-ink/[0.06] to-transparent" />
    </div>
  )
}

export function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center border border-line bg-raised px-1.5 font-mono text-[0.625rem] text-ink-dim">
      {children}
    </kbd>
  )
}
