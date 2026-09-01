/**
 * SSR preview + style audit (dev tooling — not part of the app bundle).
 *
 *   node scripts/ssr-preview.mjs            # render every panel, dump HTML for inspection
 *   node scripts/ssr-preview.mjs --audit    # also fail when a rendered class has no CSS rule
 *
 * The dashboard renders deck.gl/WebGL on the map only; everything around it is
 * plain DOM, so this is enough to verify markup and styling without a browser.
 */
import { writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { globSync } from 'node:fs'

/**
 * esbuild ships with Vite, so no extra dependency is declared. If it is ever
 * missing, `npm i -D esbuild` restores this harness.
 */
let build
try {
  ({ build } = await import('esbuild'))
} catch {
  console.error('esbuild not resolvable — run `npm i -D esbuild` and retry.')
  process.exit(1)
}

const root = process.cwd()
const entry = join(root, 'src/__ssr__/preview.jsx')
/* Scratch files live under node_modules: resolvable by Node, ignored by git,
   and outside Vite's watch set so the dev server never reloads on them. */
const scratch = join(root, 'node_modules', '.cache', 'sagar-net-ssr')
mkdirSync(scratch, { recursive: true })
const bundle = join(scratch, 'preview.bundle.mjs')

await build({
  entryPoints: [entry],
  outfile: bundle,
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'transform',
  loader: { '.css': 'empty', '.png': 'dataurl', '.mp4': 'empty' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
  logLevel: 'warning',
})

let html = ''
try {
  html = execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
} finally {
  rmSync(bundle, { force: true })
}

writeFileSync(join(scratch, 'preview.html'), html)
console.log(`rendered ${html.split('\n').length} lines of markup -> ${join(scratch, 'preview.html')}`)

if (!process.argv.includes('--audit')) process.exit(0)

/* ---- style audit: every class in the rendered markup must exist in CSS ---- */
const css = [join(root, 'src/styles.css'), ...globSync(join(root, 'dist/assets/*.css'))]
  .map((f) => { try { return readFileSync(f, 'utf8') } catch { return '' } })
  .join('\n')
const defined = new Set([...css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]))

const classes = new Set()
for (const m of html.matchAll(/class="([^"]*)"/g)) {
  for (const c of m[1].split(/\s+/)) if (c && /^[A-Za-z_][\w-]*$/.test(c)) classes.add(c)
}
const missing = [...classes].filter((c) => !defined.has(c)).sort()
if (missing.length) {
  console.error(`\n${missing.length} rendered class(es) with no CSS rule:`)
  for (const m of missing) console.error(`  • ${m}`)
  process.exit(1)
}
console.log(`style audit passed — ${classes.size} distinct rendered classes, all styled`)
