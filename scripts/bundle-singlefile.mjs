/**
 * Inline a Vite build into one self-contained HTML document.
 *
 * Used for hosts that serve a single file with a strict CSP (no external
 * scripts, styles, or fonts). Web fonts are dropped rather than left as blocked
 * requests; the stack falls back to the system UI and mono faces.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const out = process.argv[2] ?? join(dist, 'nexus-standalone.html')

let html = readFileSync(join(dist, 'index.html'), 'utf8')
const assets = readdirSync(join(dist, 'assets'))

const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8'))
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8'))

// Strip the tags Vite emitted for external assets and the web-font requests.
html = html
  .replace(/<link[^>]+rel="stylesheet"[^>]*>/g, '')
  .replace(/<script[^>]+type="module"[^>]*><\/script>/g, '')
  .replace(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g, '')
  .replace(/<link[^>]+href="\/favicon\.svg"[^>]*>/g, '')

const favicon = readFileSync(join(process.cwd(), 'public', 'favicon.svg'), 'utf8')
const faviconTag = `<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}">`

// A literal `</script>` inside inlined JS would terminate the tag early.
const inline = js.join('\n').replace(/<\/script/gi, '<\\/script')

// Replacer functions, not strings: bundled code contains `$&` and `$'`
// sequences that String.replace would otherwise expand.
html = html.replace('</head>', () => `${faviconTag}<style>${css.join('\n')}</style></head>`)
html = html.replace('</body>', () => `<script type="module">${inline}</script></body>`)

writeFileSync(out, html)
console.log(`single-file build: ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`)
