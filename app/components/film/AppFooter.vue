<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'

const currentYear = new Date().getFullYear()
const { t } = useI18n()
</script>

<template>
  <footer class="shrink-0 border-t border-border bg-card/85">
    <p
      class="mx-auto flex min-h-10 max-w-420 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-2 font-mono text-[10px] tracking-wide text-muted-foreground"
    >
      © {{ currentYear }} HAIZAKURA · FILM X
      <span class="hidden text-border sm:inline" aria-hidden="true">|</span>
      <span class="inline-flex items-center gap-1.5">
        <ShieldCheck class="size-3.5 text-primary" aria-hidden="true" />
        {{ t('footer.localOnly') }}
      </span>
    </p>
  </footer>
</template>
