<script setup lang="ts">
import { Columns2, Rows2 } from '@lucide/vue'
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
</script>

<template>
  <div class="border-b border-film-900/10 p-5">
    <p class="eyebrow">画面布局</p>
    <div class="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-film-200/75 p-1">
      <button
        class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
        :class="
          settings.layoutDirection === 'horizontal'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-film-500 hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.layoutDirection = 'horizontal'"
      >
        <Columns2 class="size-3.5" aria-hidden="true" />
        左右
      </button>
      <button
        class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
        :class="
          settings.layoutDirection === 'vertical'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-film-500 hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.layoutDirection = 'vertical'"
      >
        <Rows2 class="size-3.5" aria-hidden="true" />
        上下
      </button>
    </div>
  </div>
</template>
