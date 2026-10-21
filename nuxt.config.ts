import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { version } from './package.json'

// Built by `pnpm mcp:build` (part of build and generate): the MCP server and its installer.
const mcpSiteDir = fileURLToPath(new URL('./packages/mcp/dist/site', import.meta.url))

export default defineNuxtConfig({
  appConfig: {
    version
  },
  modules: ['shadcn-nuxt', '@nuxtjs/color-mode', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  experimental: {
    // PWA updates control reloads so in-memory image edits are never discarded.
    checkOutdatedBuildInterval: false,
    emitRouteChunkError: 'manual'
  },
  nitro: {
    prerender: { routes: ['/', '/compose', '/frame', '/mcp-renderer'] },
    // Served as /mcp/install.sh and friends; skipped when the MCP package has not been built.
    publicAssets: existsSync(mcpSiteDir) ? [{ baseURL: 'mcp', dir: mcpSiteDir, maxAge: 0 }] : []
  },
  routeRules: {
    '/': { headers: { 'cache-control': 'no-cache' } },
    '/compose': { headers: { 'cache-control': 'no-cache' } },
    '/frame': { headers: { 'cache-control': 'no-cache' } },
    '/mcp-renderer': { headers: { 'cache-control': 'no-cache' } },
    '/sw.js': { headers: { 'cache-control': 'no-cache' } },
    '/pwa-update-guard.js': { headers: { 'cache-control': 'no-cache' } },
    '/manifest.webmanifest': { headers: { 'cache-control': 'no-cache' } }
  },
  pwa: {
    registerType: 'prompt',
    // Native registration coordinates safe automatic activation across all windows.
    injectRegister: false,
    client: { registerPlugin: false },
    manifest: {
      id: './',
      name: 'Film X',
      short_name: 'Film X',
      description: 'Split, compose and frame film scans and photos locally on your device.',
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#FFFFFF',
      icons: [
        { src: 'icons/pwa-v2-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/pwa-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: 'icons/pwa-maskable-v2-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: 'icons/pwa-maskable-v2-1024.png',
          sizes: '1024x1024',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,json,svg,png,ico,woff2}'],
      // The MCP installer files are for the terminal, not for the offline app.
      globIgnores: ['**/200.html', '**/404.html', 'mcp/**'],
      importScripts: ['pwa-update-guard.js'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: false,
      // Cache only the application; imported images never enter service worker caches.
      navigateFallbackDenylist: [/^\/api\//]
    }
  },
  css: ['~/assets/css/main.css'],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  vite: {
    plugins: [tailwindcss()]
  },
  devtools: { enabled: true },
  compatibilityDate: '2026-08-26',
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      fallbackLocale: 'en'
    },
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'zh-CN', language: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' }
    ]
  },
  app: {
    head: {
      titleTemplate: '%s · Film X',
      // Full-bleed on iOS: the header and tool tabs pad themselves by the safe-area insets.
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#FFFFFF' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0A0A0A' }
      ]
    }
  }
})
