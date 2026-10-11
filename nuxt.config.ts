import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['shadcn-nuxt', '@nuxtjs/color-mode', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  experimental: {
    // PWA updates control reloads so in-memory image edits are never discarded.
    checkOutdatedBuildInterval: false,
    emitRouteChunkError: 'manual'
  },
  nitro: {
    prerender: { routes: ['/', '/compose'] }
  },
  routeRules: {
    '/': { headers: { 'cache-control': 'no-cache' } },
    '/compose': { headers: { 'cache-control': 'no-cache' } },
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
      description: 'Split and compose film scan images locally on your device.',
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#FFFFFF',
      icons: [
        { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: 'icons/pwa-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,json,svg,png,ico,woff2}'],
      globIgnores: ['**/200.html', '**/404.html'],
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
      meta: [
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#FFFFFF' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0A0A0A' }
      ]
    }
  }
})
