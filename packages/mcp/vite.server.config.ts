import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// The package's own runtime dependencies stay external; everything imported from the app
// (utif, fflate, …) belongs to the app, not to this package, so it is inlined.
const external = [
  /^node:/,
  /^@modelcontextprotocol\/sdk(\/|$)/,
  /^playwright-core(\/|$)/,
  /^zod(\/|$)/
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
    external: ['@modelcontextprotocol/sdk', 'playwright-core', 'zod']
  }
})
