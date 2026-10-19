// Assembles what the website publishes under /mcp/ for the one-click installer: the server
// bundle, a package.json pinning the exact runtime dependencies it was built and tested with,
// the install script and SHA-256 checksums of the downloaded files.
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const site = new URL('dist/site/', root)
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))

// pnpm links each direct dependency into the package's own node_modules.
const installedVersion = async (name) =>
  JSON.parse(await readFile(new URL(`node_modules/${name}/package.json`, root), 'utf8')).version

const dependencies = Object.fromEntries(
  await Promise.all(
    Object.keys(pkg.dependencies).map(async (name) => [name, await installedVersion(name)])
  )
)

const manifest = {
  name: pkg.name,
  version: pkg.version,
  private: true,
  description: pkg.description,
  license: pkg.license,
  type: 'module',
  bin: { [pkg.name]: './server.mjs' },
  engines: pkg.engines,
  dependencies
}

await rm(site, { recursive: true, force: true })
await mkdir(site, { recursive: true })
await copyFile(new URL('dist/server.mjs', root), new URL('server.mjs', site))
await writeFile(new URL('package.json', site), `${JSON.stringify(manifest, null, 2)}\n`)
await Promise.all(
  ['install.sh', 'install.ps1'].map((installer) =>
    copyFile(new URL(installer, root), new URL(installer, site))
  )
)

const sums = await Promise.all(
  ['server.mjs', 'package.json'].map(async (file) => {
    const hash = createHash('sha256')
      .update(await readFile(new URL(file, site)))
      .digest('hex')
    return `${hash}  ${file}\n`
  })
)
await writeFile(new URL('SHA256SUMS', site), sums.join(''))
process.stdout.write(`dist/site: film-x-mcp ${pkg.version} (${Object.keys(dependencies)})\n`)
