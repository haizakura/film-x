import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_SITE_URL, resolveSiteUrl } from './bridge'

const claudeConfigPath = () => {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming'), 'Claude')
  }
  if (process.platform === 'darwin') {
    return path.join(homedir(), 'Library', 'Application Support', 'Claude')
  }
  return path.join(homedir(), '.config', 'Claude')
}

/** The command that updates this install with the installer copy it keeps, if it has one. */
const updateCommand = (dir: string) => {
  if (process.platform === 'win32') {
    const script = path.join(dir, 'install.ps1')
    return existsSync(script)
      ? `powershell -NoProfile -ExecutionPolicy Bypass -File "${script}"`
      : undefined
  }
  const script = path.join(dir, 'install.sh')
  return existsSync(script) ? `sh '${script.replaceAll("'", "'\\''")}'` : undefined
}

/**
 * Agent configuration for this exact Node.js and server file, printed by `--print-config` so the
 * installers and users never assemble paths by hand. JSON.stringify output is also a valid TOML
 * basic string, which keeps Windows backslashes escaped in both formats.
 */
export const formatAgentConfig = () => {
  const command = process.execPath
  const server = fileURLToPath(import.meta.url)
  const raw = process.env.FILM_X_SITE_URL?.trim()
  const site = raw ? resolveSiteUrl(raw).href : DEFAULT_SITE_URL
  const env = site === DEFAULT_SITE_URL ? undefined : { FILM_X_SITE_URL: site }
  const entry = { command, args: [server], ...(env ? { env } : {}) }
  const dir = path.dirname(server)
  const update = updateCommand(dir)
  const updateNote = update
    ? `The command is this exact Node.js, so after upgrading Node.js, and to update Film X MCP,\nrun:\n\n  ${update}\n\n`
    : 'The command is this exact Node.js, so run the installer again after upgrading Node.js, and\nto update Film X MCP. '
  const q = JSON.stringify
  const toml = [
    '[mcp_servers.film-x]',
    `command = ${q(command)}`,
    `args = [${q(server)}]`,
    'startup_timeout_sec = 30',
    // Large TIFF batches can take longer than the 60 s default.
    'tool_timeout_sec = 600',
    ...(env ? [`env = { FILM_X_SITE_URL = ${q(site)} }`] : [])
  ].join('\n')

  return `Claude Desktop: add this to ${path.join(claudeConfigPath(), 'claude_desktop_config.json')}
(Settings > Developer > Edit Config), merging it into an existing "mcpServers" object, then
restart Claude Desktop:

${JSON.stringify({ mcpServers: { 'film-x': entry } }, null, 2)}

ChatGPT Desktop / Codex: add this to ${path.join(homedir(), '.codex', 'config.toml')}, or enter
the same command and argument under Settings > MCP servers > Add server > STDIO:

${toml}

Optional environment variables: FILM_X_IMAGE_DIR (default folder for list_images) and
FILM_X_BROWSER_PATH (another Chromium-based browser).
${updateNote}Delete ${dir} to uninstall.
`
}
