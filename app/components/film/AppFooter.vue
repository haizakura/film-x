<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'

const { t } = useI18n()
</script>

<template>
  <!-- Exactly the bottom safe area (the iOS home indicator); no height where there is none. -->
  <footer class="h-[env(safe-area-inset-bottom)] shrink-0 overflow-hidden bg-card">
    <p
      class="flex items-center justify-center gap-1.5 font-mono text-[10px] leading-3 tracking-wide text-muted-foreground"
    >
      <ShieldCheck class="size-3 text-primary" aria-hidden="true" />
      {{ t('footer.localOnly') }}
    </p>
  </footer>
</template>
