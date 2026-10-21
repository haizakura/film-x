<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'

const { t, locale } = useI18n()
const { updateReady } = usePwaUpdate()
const baseURL = useRuntimeConfig().app.baseURL

useHead(() => ({
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
    { rel: 'apple-touch-icon', sizes: '180x180', href: `${baseURL}icons/apple-touch-icon.png` }
  ],
  htmlAttrs: {
    lang: locale.value
  }
}))

useSeoMeta({ description: () => t('meta.siteDescription') })
</script>

<template>
  <VitePwaManifest />
  <div
    class="film-grain flex h-dvh flex-col overflow-hidden pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
  >
    <FilmAppHeader />
    <div
      v-if="updateReady"
      role="status"
      class="shrink-0 border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground"
    >
      {{ t('pwa.updateReady') }}
    </div>
    <NuxtPage :keepalive="{ max: 4 }" class="min-h-0 flex-1" />
    <FilmAppFooter />
    <Toaster
      position="top-right"
      close-button
      :offset="{
        top: 'calc(24px + env(safe-area-inset-top))',
        right: 'calc(24px + env(safe-area-inset-right))'
      }"
      :container-aria-label="t('notifications.label')"
      :toast-options="{
        closeButtonAriaLabel: t('notifications.close'),
        classes: { toast: 'rounded-2xl' }
      }"
    />
  </div>
</template>
