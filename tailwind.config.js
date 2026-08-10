/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Foundation — driven by CSS variables so light mode is a token swap.
        void: 'rgb(var(--void) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-dim': 'rgb(var(--ink-dim) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        signal: 'rgb(var(--signal) / <alpha-value>)',
        'signal-soft': 'rgb(var(--signal-soft) / <alpha-value>)',
        'signal-deep': 'rgb(var(--signal-deep) / <alpha-value>)',
        // Semantic states — never the only carrier of meaning.
        caution: 'rgb(var(--caution) / <alpha-value>)',
        hazard: 'rgb(var(--hazard) / <alpha-value>)',
        thrive: 'rgb(var(--thrive) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: { xs: '3px' },
      transitionTimingFunction: {
        instrument: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'breathe': {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '0.9' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'rise': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        breathe: 'breathe 3.2s ease-in-out infinite',
        sweep: 'sweep 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
        rise: 'rise 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
