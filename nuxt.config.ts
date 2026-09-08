import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['shadcn-nuxt', '@nuxtjs/color-mode', '@nuxtjs/i18n'],
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
      { code: 'zh-CN', language: 'zh-CN', name: '简体中文', file: 'zh-CN.json' }
    ]
  },
  app: {
    head: {
      titleTemplate: '%s · Film X',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#FFFFFF' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0A0A0A' }
      ]
    }
  }
})
