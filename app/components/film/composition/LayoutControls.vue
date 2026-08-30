<script setup lang="ts">
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
            ? 'bg-film-100 font-medium text-film-900 shadow-sm'
            : 'text-film-500 hover:text-film-900'
        "
        @click="settings.layoutDirection = 'horizontal'"
      >
        <UIcon name="i-lucide-columns-2" class="size-3.5" />
        左右
      </button>
      <button
        class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
        :class="
          settings.layoutDirection === 'vertical'
            ? 'bg-film-100 font-medium text-film-900 shadow-sm'
            : 'text-film-500 hover:text-film-900'
        "
        @click="settings.layoutDirection = 'vertical'"
      >
        <UIcon name="i-lucide-rows-2" class="size-3.5" />
        上下
      </button>
    </div>
  </div>
</template>
