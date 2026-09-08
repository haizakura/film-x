<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'

const { t, locale } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value
  }
}))

useSeoMeta({ description: () => t('meta.siteDescription') })
</script>

<template>
  <div class="film-grain flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
    <FilmAppHeader />
    <NuxtPage :keepalive="{ max: 4 }" class="min-h-0 flex-1" />
    <FilmAppFooter />
    <Toaster
      position="top-right"
      close-button
      :container-aria-label="t('notifications.label')"
      :toast-options="{
        closeButtonAriaLabel: t('notifications.close'),
        classes: { toast: 'rounded-2xl' }
      }"
    />
  </div>
</template>
