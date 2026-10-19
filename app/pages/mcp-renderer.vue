<script setup lang="ts">
// The frame renderer measures text with these faces, so they must be loaded on this page too.
import '~/assets/css/frame-fonts.css'

const { t } = useI18n()

useSeoMeta({
  title: () => t('meta.agentRendererTitle'),
  description: () => t('meta.agentRendererDescription'),
  robots: 'noindex, nofollow'
})

useAgentRenderer()
</script>

<template>
  <main class="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-12">
    <h1 class="text-base font-semibold text-foreground">{{ t('agentRenderer.title') }}</h1>
    <p class="text-sm leading-relaxed text-muted-foreground">
      {{ t('agentRenderer.description') }}
    </p>
  </main>
</template>
