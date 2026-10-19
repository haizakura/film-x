import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { RendererHost } from './browser'
import { formatAgentConfig } from './config'
import { registerTools } from './tools'
import pkg from '../../package.json' with { type: 'json' }

const log = (message: string) => process.stderr.write(`[film-x-mcp] ${message}\n`)

const HELP = `film-x-mcp ${pkg.version}

Local stdio MCP server for Film X. MCP clients such as Claude Desktop or ChatGPT Desktop start
it; it is not meant to be run by hand.

Options:
  --print-config       Print the Claude Desktop and ChatGPT Desktop configuration for this install
  --version            Print the version

Environment:
  FILM_X_SITE_URL      Film X site that serves the renderer page (default https://filmx.nya.run/)
  FILM_X_IMAGE_DIR     Default folder for list_images
  FILM_X_BROWSER_PATH  Chromium-based browser to use instead of Chrome or Edge
`

const main = async () => {
  const host = new RendererHost(process.env.FILM_X_SITE_URL)
  const server = new McpServer(
    { name: 'film-x', version: pkg.version },
    {
      instructions:
        'Film X processes film photography scans locally. Tools take absolute file paths on this ' +
        'computer (chat attachments are not visible); outputs are written next to the inputs ' +
        'unless an output path or folder is given. Existing files are never overwritten unless ' +
        'overwrite is true. Film X code is loaded from ' +
        (process.env.FILM_X_SITE_URL?.trim() || 'https://filmx.nya.run/') +
        '; images are read and written only on this computer.'
    }
  )
  registerTools(server, { host })

  let stopping = false
  const shutdown = (code: number) => {
    if (stopping) return
    stopping = true
    const force = setTimeout(() => process.exit(code), 5000)
    force.unref()
    void host.close().finally(() => process.exit(code))
  }
  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))
  process.stdin.on('close', () => shutdown(0))
  process.stdin.on('end', () => shutdown(0))
  process.on('uncaughtException', (error) => {
    log(`uncaught exception: ${error.stack ?? error.message}`)
    shutdown(1)
  })
  process.on('unhandledRejection', (reason) => log(`unhandled rejection: ${String(reason)}`))

  await server.connect(new StdioServerTransport())
  log('ready')
}

// Answered before any MCP setup so installers can check the bundle without starting it.
const flag = process.argv[2]
if (flag === '--version' || flag === '-v') {
  process.stdout.write(`${pkg.version}\n`)
} else if (flag === '--help' || flag === '-h') {
  process.stdout.write(HELP)
} else if (flag === '--print-config') {
  process.stdout.write(formatAgentConfig())
} else {
  main().catch((error: unknown) => {
    log(`fatal: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
    process.exit(1)
  })
}
