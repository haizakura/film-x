import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const { dependencies } = JSON.parse(
  readFileSync(new URL('package.json', import.meta.url), 'utf8')
) as { dependencies: Record<string, string> }
const dependencyNames = Object.keys(dependencies)

// The package's own runtime dependencies stay external; everything imported from the app
// (utif, fflate, …) belongs to the app, not to this package, so it is inlined.
const external = [
  /^node:/,
  ...dependencyNames.map(
    (name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(/|$)`)
  )
]

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('../../app', import.meta.url))
    }
  },
  build: {
    ssr: fileURLToPath(new URL('src/server/index.ts', import.meta.url)),
    outDir: 'dist',
    emptyOutDir: false,
    target: 'node22',
    minify: false,
    rolldownOptions: {
      external,
      output: {
        format: 'esm',
        entryFileNames: 'server.mjs',
        banner: '#!/usr/bin/env node'
      }
    }
  },
  ssr: {
    noExternal: true,
    external: dependencyNames
  }
})
