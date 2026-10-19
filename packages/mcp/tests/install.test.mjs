import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { promisify } from 'node:util'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import { isFile, publicDir, startStaticSite } from './static-site.mjs'

const run = promisify(execFile)
// npm downloads the runtime dependencies, so the first install needs the network.
const INSTALL_TIMEOUT = 300_000

const skip = isFile(join(publicDir, 'mcp', 'install.sh'))
  ? false
  : 'no installer in the generated site: run `pnpm generate`'

/** PowerShell for install.ps1: FILM_X_PWSH, else `pwsh` on PATH; the test skips without it. */
const findPwsh = () => {
  const candidate = process.env.FILM_X_PWSH || 'pwsh'
  try {
    execFileSync(candidate, ['-NoProfile', '-Command', 'exit 0'], { stdio: 'ignore' })
    return candidate
  } catch {
    return undefined
  }
}
const pwsh = skip ? undefined : findPwsh()

let staticSite
let siteUrl
let home

/** Runs the documented one-liner against the local site. */
const install = (installDir) =>
  run('sh', ['-c', `curl -fsSL ${siteUrl}mcp/install.sh | sh`], {
    env: { ...process.env, FILM_X_SITE_URL: siteUrl, FILM_X_MCP_HOME: installDir },
    timeout: INSTALL_TIMEOUT
  })

before(async () => {
  if (skip) return
  staticSite = await startStaticSite()
  siteUrl = `http://127.0.0.1:${staticSite.address().port}/`
  home = mkdtempSync(join(tmpdir(), 'film-x-mcp-install-'))
})

after(() => {
  staticSite?.close()
  if (home) rmSync(home, { recursive: true, force: true })
})

test('installs with one command and prints a working configuration', { skip }, async () => {
  const installDir = join(home, 'film-x-mcp')
  const { stdout } = await install(installDir)
  const server = join(installDir, 'server.mjs')
  assert.ok(isFile(server))
  assert.ok(existsSync(join(installDir, 'node_modules', '@modelcontextprotocol', 'sdk')))
  assert.ok(stdout.includes('"mcpServers"') && stdout.includes('[mcp_servers.film-x]'))
  // Node reports the real path of the running file (the temp folder is a symlink on macOS).
  assert.ok(stdout.includes(JSON.stringify(realpathSync(server))))
  // A site other than the default must reach the agent configuration.
  assert.ok(stdout.includes(`"FILM_X_SITE_URL": ${JSON.stringify(siteUrl)}`))

  const client = new Client({ name: 'film-x-install-test', version: '0.0.0' })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [server],
      env: { ...process.env, FILM_X_SITE_URL: siteUrl },
      stderr: 'ignore'
    })
  )
  try {
    const result = await client.callTool(
      { name: 'frame_preset', arguments: { template: 'bar' } },
      undefined,
      { timeout: 120_000 }
    )
    const text = result.content.find((block) => block.type === 'text')?.text ?? ''
    assert.ok(!result.isError, text)
    assert.match(JSON.parse(text).presetCode, /^FXF1\./)
  } finally {
    await client.close()
  }
})

test('updates in place but leaves foreign folders alone', { skip }, async () => {
  const installDir = join(home, 'film-x-mcp')
  await install(installDir)
  assert.ok(isFile(join(installDir, 'server.mjs')))

  const foreign = join(home, 'documents')
  mkdirSync(foreign)
  writeFileSync(join(foreign, 'keep.txt'), 'keep')
  await assert.rejects(install(foreign), /was not created by this installer/)
  assert.ok(isFile(join(foreign, 'keep.txt')))
})

test(
  'installs on Windows with irm | iex',
  { skip: skip || (!pwsh && 'pwsh not found') },
  async () => {
    // LOCALAPPDATA is set explicitly so the default Windows folder is used on any OS.
    const localAppData = join(home, 'LocalAppData')
    mkdirSync(localAppData)
    const { stdout } = await run(
      pwsh,
      ['-NoProfile', '-Command', `irm ${siteUrl}mcp/install.ps1 | iex`],
      {
        env: { ...process.env, FILM_X_SITE_URL: siteUrl, LOCALAPPDATA: localAppData },
        timeout: INSTALL_TIMEOUT
      }
    )
    const server = join(localAppData, 'film-x-mcp', 'server.mjs')
    assert.ok(isFile(server))
    assert.ok(stdout.includes(JSON.stringify(realpathSync(server))))
    assert.ok(stdout.includes('[mcp_servers.film-x]'))

    const foreign = join(home, 'pictures')
    mkdirSync(foreign)
    await assert.rejects(
      run(pwsh, ['-NoProfile', '-Command', `irm ${siteUrl}mcp/install.ps1 | iex`], {
        env: { ...process.env, FILM_X_SITE_URL: siteUrl, FILM_X_MCP_HOME: foreign },
        timeout: INSTALL_TIMEOUT
      }),
      /was not created by this installer/
    )
  }
)
