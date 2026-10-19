import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import type { RendererMethod, RendererRequest, RendererResponse } from '~/types/agent'
import { AGENT_RENDERER_PATH, AGENT_RENDERER_PROTOCOL } from '~/types/agent'
import type { Bridge } from './bridge'
import { resolveSiteUrl, startBridge } from './bridge'
import { UserError } from './errors'
import { SerialQueue } from './queue'

const IDLE_CLOSE_MS = 5 * 60 * 1000
const READY_TIMEOUT_MS = 30_000

const log = (message: string) => process.stderr.write(`[film-x-mcp] ${message}\n`)

const BROWSER_HELP =
  'Film X needs Google Chrome or Microsoft Edge to render images. Install one of them, ' +
  'or set FILM_X_BROWSER_PATH to the browser executable.'

const launchBrowser = async (): Promise<Browser> => {
  const explicit = process.env.FILM_X_BROWSER_PATH?.trim()
  if (explicit) {
    try {
      return await chromium.launch({ executablePath: explicit, headless: true })
    } catch (error) {
      log(`FILM_X_BROWSER_PATH failed to start: ${(error as Error).message.split('\n')[0]}`)
      throw new UserError(
        `Could not start the browser at FILM_X_BROWSER_PATH (${explicit}). ` +
          'Check the path, or unset it to use Google Chrome or Microsoft Edge.'
      )
    }
  }
  // Each channel is only tried when the previous one failed to start.
  // oxlint-disable no-await-in-loop
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless: true })
    } catch (error) {
      log(`Could not launch ${channel}: ${(error as Error).message.split('\n')[0]}`)
    }
  }
  // oxlint-enable no-await-in-loop
  throw new UserError(BROWSER_HELP)
}

/**
 * Owns the loopback bridge, the headless browser and the renderer page. Everything is started
 * lazily by the first render job and torn down when idle or on shutdown.
 */
export class RendererHost {
  private readonly queue = new SerialQueue()
  private readonly siteUrl?: string
  private bridge?: Promise<Bridge>
  private browser?: Browser
  private page?: Page
  private idleTimer?: NodeJS.Timeout
  private closed = false

  /** `siteUrl` is the raw FILM_X_SITE_URL; it is validated by the first job, not at startup. */
  constructor(siteUrl?: string) {
    this.siteUrl = siteUrl
  }

  /** The bridge is cheap (a loopback socket) and independent of the browser. */
  ensureBridge(): Promise<Bridge> {
    if (this.closed) return Promise.reject(new UserError('The server is shutting down.'))
    this.bridge ??= Promise.resolve()
      .then(() => startBridge(resolveSiteUrl(this.siteUrl)))
      .catch((error: unknown) => {
        this.bridge = undefined
        throw error
      })
    return this.bridge
  }

  /** Calls a method of `window.filmX`, strictly after every earlier call has finished. */
  call<M extends RendererMethod>(
    method: M,
    request: RendererRequest<M>
  ): Promise<RendererResponse<M>> {
    return this.queue.run(async () => {
      this.clearIdleTimer()
      try {
        const page = await this.ensurePage()
        const call: [RendererMethod, unknown] = [method, request]
        return (await page.evaluate(([name, payload]) => {
          const renderer = window.filmX
          if (!renderer) throw new Error('The renderer is not available')
          return (renderer[name] as (value: unknown) => Promise<unknown>).call(renderer, payload)
        }, call)) as RendererResponse<M>
      } finally {
        this.armIdleTimer()
      }
    })
  }

  async close(): Promise<void> {
    this.closed = true
    this.clearIdleTimer()
    await this.queue.run(() => this.closeBrowser()).catch(() => undefined)
    const bridge = this.bridge
    this.bridge = undefined
    await (await bridge?.catch(() => undefined))?.close().catch(() => undefined)
  }

  private clearIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = undefined
  }

  private armIdleTimer() {
    this.clearIdleTimer()
    if (this.closed) return
    this.idleTimer = setTimeout(() => {
      void this.queue.run(async () => {
        log('Closing the idle browser')
        await this.closeBrowser()
      })
    }, IDLE_CLOSE_MS)
    this.idleTimer.unref()
  }

  private async closeBrowser() {
    const browser = this.browser
    this.browser = undefined
    this.page = undefined
    await browser?.close().catch(() => undefined)
  }

  private async ensurePage(): Promise<Page> {
    if (this.page && !this.page.isClosed() && this.browser?.isConnected()) return this.page
    await this.closeBrowser()
    const bridge = await this.ensureBridge()
    const browser = await launchBrowser()
    this.browser = browser
    browser.on('disconnected', () => {
      if (this.browser === browser) {
        log('The browser closed unexpectedly; it will restart on the next job')
        this.browser = undefined
        this.page = undefined
      }
    })
    try {
      const context = await browser.newContext({ serviceWorkers: 'block' })
      const page = await context.newPage()
      page.on('console', (message) => {
        // The site is a PWA; its service worker is blocked on purpose, so that warning is noise.
        if (message.text().includes('Service Worker registration blocked')) return
        if (message.type() === 'error' || message.type() === 'warning') {
          log(`page ${message.type()}: ${message.text()}`)
        }
      })
      page.on('pageerror', (error) => log(`page error: ${error.message}`))
      page.on('crash', () => {
        log('The renderer page crashed; it will restart on the next job')
        if (this.page === page) this.page = undefined
        void page.close().catch(() => undefined)
      })
      const site = new URL(`${AGENT_RENDERER_PATH}`, resolveSiteUrl(this.siteUrl)).href
      let failure: string | undefined
      try {
        const response = await page.goto(bridge.pageUrl, {
          waitUntil: 'load',
          timeout: READY_TIMEOUT_MS
        })
        if (!response) failure = 'no response'
        else if (response.status() >= 400) failure = `HTTP ${response.status()}`
      } catch (error) {
        failure = (error as Error).message.split('\n')[0]
      }
      if (failure) {
        throw new UserError(
          `Could not load the Film X renderer from ${site} (${failure}). ` +
            'Check the network connection, deploy Film X 0.6.0 or later to that site, ' +
            'or set FILM_X_SITE_URL.'
        )
      }
      await page.waitForFunction(() => window.filmX !== undefined, undefined, {
        timeout: READY_TIMEOUT_MS
      })
      const protocol = await page.evaluate(() => window.filmX?.protocol)
      if (protocol !== AGENT_RENDERER_PROTOCOL) {
        const siteOlder = typeof protocol !== 'number' || protocol < AGENT_RENDERER_PROTOCOL
        throw new UserError(
          `The renderer protocol of ${site} is ${String(protocol)}, but this MCP server expects ` +
            `${AGENT_RENDERER_PROTOCOL}. ` +
            (siteOlder
              ? 'The deployed site is older than this server: redeploy Film X.'
              : 'This MCP server is older than the deployed site: update or rebuild the MCP server.')
        )
      }
      this.page = page
      return page
    } catch (error) {
      await this.closeBrowser()
      if (error instanceof UserError) throw error
      throw new UserError(
        `The Film X renderer page failed to load: ${(error as Error).message.split('\n')[0]}. ` +
          'Check the network connection or set FILM_X_SITE_URL.'
      )
    }
  }
}
