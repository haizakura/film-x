import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['shadcn-nuxt', '@nuxtjs/color-mode'],
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
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      titleTemplate: '%s · Film X',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        {
          name: 'description',
          content: '在浏览器本地完成胶片扫描图像的切分与排版。'
        },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#F2F3F5' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0A0A0A' }
      ]
    }
  }
})
