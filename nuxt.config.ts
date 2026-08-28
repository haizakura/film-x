export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
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
      meta: [
        {
          name: 'description',
          content: '在浏览器本地完成胶片扫描图像的切分与排版。'
        },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#FEFEFE' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#141414' }
      ]
    }
  }
})
