import { randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { link, rename, stat, unlink } from 'node:fs/promises'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { InputRef, OutputRef } from '~/types/agent'
import { AGENT_BRIDGE_PREFIX, AGENT_RENDERER_PATH } from '~/types/agent'
import { UserError } from './errors'
import { pathExists } from './paths'

export const DEFAULT_SITE_URL = 'https://filmx.nya.run/'
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const CACHE_LIMIT_BYTES = 64 * 1024 * 1024
const UPSTREAM_TIMEOUT_MS = 120_000
const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language']
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'cache-control']
const BRIDGE_ROOT = `/${AGENT_BRIDGE_PREFIX}`

const log = (message: string) => process.stderr.write(`[film-x-mcp] ${message}\n`)

/** Validates the site base URL (FILM_X_SITE_URL) and makes sure its path ends with `/`. */
export const resolveSiteUrl = (raw?: string): URL => {
  const text = raw?.trim() || DEFAULT_SITE_URL
  let url: URL
  try {
    url = new URL(text)
  } catch {
    throw new UserError(`FILM_X_SITE_URL is not a valid URL: ${text}`)
  }
  const allowed =
    url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname))
  if (!allowed) {
    throw new UserError(
      `FILM_X_SITE_URL must use https (http is only allowed for localhost): ${url.origin}`
    )
  }
  url.search = ''
  url.hash = ''
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url
}

interface InputEntry {
  file: string
}

interface OutputEntry {
  file: string
  overwrite: boolean
  started: boolean
  resolve: () => void
  reject: (error: Error) => void
}

export interface RegisteredOutput {
  ref: OutputRef
  /** Settles once the bytes are on disk under their final name. */
  written: Promise<void>
}

export interface Bridge {
  /** `http://127.0.0.1:<port>/<site path>mcp-renderer`: the deployed renderer page, proxied. */
  pageUrl: string
  /** `ref.url` is an absolute path, `/__film-x-mcp/<token>/input/<id>`. */
  registerInput: (absPath: string, name: string) => InputRef
  /** `ref.url` is an absolute path, `/__film-x-mcp/<token>/output/<id>`. */
  registerOutput: (absPath: string, options: { overwrite: boolean }) => RegisteredOutput
  /** Forget refs after a job; an output that was never written rejects its `written`. */
  release: (...refs: Array<InputRef | OutputRef>) => void
  close: () => Promise<void>
}

const send = (res: ServerResponse, status: number, body = '') => {
  if (res.headersSent) {
    res.destroy()
    return
  }
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  })
  res.end(body)
}

interface CacheEntry {
  status: number
  headers: Record<string, string>
  body: Buffer
}

export const startBridge = async (siteUrl: URL): Promise<Bridge> => {
  const siteOrigin = siteUrl.origin
  const basePath = siteUrl.pathname
  const token = randomBytes(24).toString('base64url')
  const prefix = `${BRIDGE_ROOT}/${token}/`
  const inputs = new Map<string, InputEntry>()
  const outputs = new Map<string, OutputEntry>()
  const cache = new Map<string, CacheEntry>()
  let cacheBytes = 0
  let origin = ''

  const serveFile = async (req: IncomingMessage, res: ServerResponse, file: string) => {
    const info = await stat(file).catch(() => undefined)
    if (!info?.isFile()) return send(res, 404, 'Not found')
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store'
    })
    if (req.method === 'HEAD') return res.end()
    await pipeline(createReadStream(file), res).catch(() => res.destroy())
  }

  const remember = (key: string, entry: CacheEntry) => {
    if (entry.body.byteLength > CACHE_LIMIT_BYTES / 4) return
    cache.set(key, entry)
    cacheBytes += entry.body.byteLength
    for (const [oldKey, old] of cache) {
      if (cacheBytes <= CACHE_LIMIT_BYTES) break
      cache.delete(oldKey)
      cacheBytes -= old.body.byteLength
    }
  }

  const copyHeaders = (response: Response) => {
    const headers: Record<string, string> = {}
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = response.headers.get(name)
      if (value) headers[name] = value
    }
    return headers
  }

  /** Forwards GET/HEAD to the site; only hashed Nuxt assets are kept in memory. */
  const proxy = async (req: IncomingMessage, res: ServerResponse, target: string) => {
    const method = req.method ?? 'GET'
    const cacheable = method === 'GET' && target.startsWith(`${siteOrigin}${basePath}_nuxt/`)
    const hit = cacheable ? cache.get(target) : undefined
    if (hit) {
      res.writeHead(hit.status, { ...hit.headers, 'Content-Length': hit.body.byteLength })
      return res.end(hit.body)
    }

    const abort = new AbortController()
    res.on('close', () => abort.abort())
    const headers: Record<string, string> = {}
    for (const name of FORWARDED_REQUEST_HEADERS) {
      const value = req.headers[name]
      if (typeof value === 'string') headers[name] = value
    }
    let upstream: Response
    try {
      upstream = await fetch(target, {
        method,
        headers,
        redirect: 'manual',
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)])
      })
    } catch (error) {
      if (abort.signal.aborted) return
      log(`Proxy request to ${target} failed: ${(error as Error).message}`)
      return send(res, 502, 'Could not reach the Film X site')
    }

    if (upstream.status >= 300 && upstream.status < 400 && upstream.headers.has('location')) {
      await upstream.body?.cancel().catch(() => undefined)
      let next: URL | undefined
      try {
        next = new URL(upstream.headers.get('location') ?? '', target)
      } catch {
        next = undefined
      }
      if (!next || next.origin !== siteOrigin) {
        log(`Refusing redirect from ${target} to ${upstream.headers.get('location')}`)
        return send(res, 502, 'The Film X site redirected outside its origin')
      }
      res.writeHead(upstream.status, {
        Location: `${origin}${next.pathname}${next.search}${next.hash}`,
        'Cache-Control': 'no-store'
      })
      return res.end()
    }

    const responseHeaders = copyHeaders(upstream)
    try {
      if (cacheable && upstream.status === 200) {
        const body = Buffer.from(await upstream.arrayBuffer())
        remember(target, { status: 200, headers: responseHeaders, body })
        res.writeHead(200, { ...responseHeaders, 'Content-Length': body.byteLength })
        return res.end(body)
      }
      res.writeHead(upstream.status, responseHeaders)
      if (method === 'HEAD' || !upstream.body) {
        await upstream.body?.cancel().catch(() => undefined)
        return res.end()
      }
      await pipeline(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]), res)
    } catch (error) {
      if (abort.signal.aborted) return
      log(`Proxy response from ${target} failed: ${(error as Error).message}`)
      if (res.headersSent) res.destroy()
      else send(res, 502, 'Could not read the Film X site response')
    }
  }

  const receiveOutput = async (req: IncomingMessage, res: ServerResponse, entry: OutputEntry) => {
    entry.started = true
    const temp = path.join(
      path.dirname(entry.file),
      `.${path.basename(entry.file)}.partial-${randomBytes(4).toString('hex')}`
    )
    try {
      await pipeline(req, createWriteStream(temp, { flags: 'wx' }))
      if (entry.overwrite) {
        await rename(temp, entry.file)
      } else {
        // A hard link fails if the target appeared meanwhile, unlike rename, which would replace it.
        try {
          await link(temp, entry.file)
          await unlink(temp)
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code
          if (code === 'EEXIST')
            throw new Error(`Output already exists: ${entry.file}`, { cause: error })
          if (await pathExists(entry.file)) {
            throw new Error(`Output already exists: ${entry.file}`, { cause: error })
          }
          await rename(temp, entry.file)
        }
      }
      entry.resolve()
      send(res, 204)
    } catch (error) {
      await unlink(temp).catch(() => undefined)
      const failure = error instanceof Error ? error : new Error(String(error))
      entry.reject(failure)
      send(res, 500, failure.message)
    }
  }

  const server: Server = createServer((req, res) => {
    void (async () => {
      const method = req.method ?? 'GET'
      if (req.headers.host !== new URL(origin).host) return send(res, 403, 'Forbidden')
      const url = req.url ?? '/'
      const rawPath = url.split('?')[0] ?? '/'

      if (rawPath === BRIDGE_ROOT || rawPath.startsWith(`${BRIDGE_ROOT}/`)) {
        // Job files only; this prefix is never forwarded to the site.
        if (!rawPath.startsWith(prefix)) return send(res, 404, 'Not found')
        let rest: string
        try {
          rest = decodeURIComponent(rawPath.slice(prefix.length))
        } catch {
          return send(res, 400, 'Bad request')
        }
        if (rest.startsWith('input/')) {
          if (method !== 'GET' && method !== 'HEAD') return send(res, 405)
          const entry = inputs.get(rest.slice('input/'.length))
          return entry ? serveFile(req, res, entry.file) : send(res, 404, 'Not found')
        }
        if (rest.startsWith('output/')) {
          if (method !== 'POST') return send(res, 405)
          const entry = outputs.get(rest.slice('output/'.length))
          if (!entry) return send(res, 404, 'Not found')
          if (entry.started) return send(res, 409, 'Output already received')
          return receiveOutput(req, res, entry)
        }
        return send(res, 404, 'Not found')
      }

      if (!rawPath.startsWith(basePath)) return send(res, 404, 'Not found')
      if (method !== 'GET' && method !== 'HEAD') return send(res, 405, 'Method not allowed')
      return proxy(req, res, `${siteOrigin}${url}`)
    })().catch(() => send(res, 500, 'Internal error'))
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  const newId = () => randomBytes(12).toString('base64url')

  return {
    pageUrl: `${origin}${basePath}${AGENT_RENDERER_PATH}`,
    registerInput: (absPath, name) => {
      const id = newId()
      inputs.set(id, { file: absPath })
      return { url: `${prefix}input/${id}`, name }
    },
    registerOutput: (absPath, { overwrite }) => {
      const id = newId()
      let entry!: OutputEntry
      const written = new Promise<void>((resolve, reject) => {
        entry = { file: absPath, overwrite, started: false, resolve, reject }
      })
      // The caller awaits `written` only after the render call; never leave it unhandled.
      written.catch(() => undefined)
      outputs.set(id, entry)
      return { ref: { url: `${prefix}output/${id}` }, written }
    },
    release: (...refs) => {
      for (const ref of refs) {
        const [id = '', kind] = ref.url.split('/').reverse().slice(0, 2)
        if (kind === 'input') inputs.delete(id)
        if (kind === 'output') {
          const entry = outputs.get(id)
          outputs.delete(id)
          entry?.reject(new Error('The renderer did not deliver the output image'))
        }
      }
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const entry of outputs.values()) entry.reject(new Error('The bridge was closed'))
        outputs.clear()
        inputs.clear()
        cache.clear()
        server.close(() => resolve())
        server.closeAllConnections()
      })
  }
}
