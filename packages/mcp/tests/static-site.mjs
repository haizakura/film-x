import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** `nuxt generate` output: the site that serves the renderer page and the installer files. */
export const publicDir = fileURLToPath(new URL('../../../.output/public/', import.meta.url))

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8'
}

export const isFile = (file) => existsSync(file) && statSync(file).isFile()

/**
 * Tiny static host for `nuxt generate` output. Like Cloudflare Pages, `/x` redirects to `/x/`
 * when `x/index.html` exists, so the proxy's redirect handling stays covered.
 */
export const startStaticSite = () =>
  new Promise((done) => {
    const root = resolve(publicDir)
    const http = createServer((req, res) => {
      const pathname = decodeURIComponent((req.url ?? '/').split('?')[0])
      const base = resolve(root, `.${pathname}`)
      if (!pathname.endsWith('/') && isFile(join(base, 'index.html'))) {
        res.writeHead(308, { Location: `${pathname}/` }).end()
        return
      }
      const candidates = [base, join(base, 'index.html'), `${base}.html`]
      const file =
        base.startsWith(root + sep) || base === root ? candidates.find(isFile) : undefined
      if (!file) {
        res.writeHead(404).end('Not found')
        return
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
      createReadStream(file).pipe(res)
    })
    http.listen(0, '127.0.0.1', () => done(http))
  })

export const hasLocalSite = isFile(join(publicDir, 'mcp-renderer', 'index.html'))
