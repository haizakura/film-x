<script setup lang="ts">
import type { CompositionImage } from '~/types/composition'

defineProps<{ images: Array<CompositionImage | undefined> }>()

const emit = defineEmits<{
  files: [index: number, files: File[]]
  remove: [index: number]
}>()

const inputId = (index: number) => `composition-image-${index}`
const pickFile = (index: number) => document.getElementById(inputId(index))?.click()
</script>

<template>
  <div class="grid gap-2 border-t border-white/8 bg-black/20 p-3 sm:grid-cols-2">
    <div
      v-for="(_, index) in 2"
      :key="index"
      class="group flex min-w-0 items-center gap-3 rounded-lg border border-white/9 bg-white/4 p-2.5"
    >
      <FilmImageFileInput
        :id="inputId(index)"
        input-class="hidden"
        @files="emit('files', index, $event)"
      />
      <label
        :for="inputId(index)"
        role="button"
        tabindex="0"
        class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md bg-white/8 text-white/70 hover:bg-white/14"
        :aria-label="`选择画面 0${index + 1}`"
        @keydown.enter.prevent="pickFile(index)"
        @keydown.space.prevent="pickFile(index)"
      >
        <UIcon :name="images[index] ? 'i-lucide-image' : 'i-lucide-plus'" class="size-4" />
      </label>
      <label
        :for="inputId(index)"
        role="button"
        tabindex="0"
        class="min-w-0 flex-1 cursor-pointer text-left"
        @keydown.enter.prevent="pickFile(index)"
        @keydown.space.prevent="pickFile(index)"
      >
        <span class="block truncate text-xs font-medium text-white/85">
          {{ images[index]?.name || `选择画面 0${index + 1}` }}
        </span>
        <span class="mt-0.5 block font-mono text-[9px] text-white/35">
          {{ images[index] ? '点击替换 · 支持拖拽' : 'TIFF · JPEG · PNG · WEBP' }}
        </span>
      </label>
      <button
        v-if="images[index]"
        class="invisible grid size-7 place-items-center rounded text-white/40 hover:bg-white/8 hover:text-white group-hover:visible focus:visible"
        :aria-label="`移除画面 0${index + 1}`"
        @click="emit('remove', index)"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
    </div>
  </div>
</template>
