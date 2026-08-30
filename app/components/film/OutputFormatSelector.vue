<script setup lang="ts">
import type { ExportFormat } from '~/types/image'

defineProps<{
  modelValue: ExportFormat
  formats: readonly ExportFormat[]
}>()

const emit = defineEmits<{ 'update:modelValue': [format: ExportFormat] }>()

const formatLabel = (format: ExportFormat) => {
  if (format === 'jpeg') return 'JPG'
  if (format === 'tiff') return 'TIF'
  return format.toUpperCase()
}
</script>

<template>
  <div
    class="grid gap-1 rounded-lg bg-film-200/70 p-1"
    :style="{ gridTemplateColumns: `repeat(${formats.length}, minmax(0, 1fr))` }"
  >
    <button
      v-for="option in formats"
      :key="option"
      class="rounded-md px-2 py-2 font-mono text-[10px] font-medium uppercase transition"
      :class="
        modelValue === option
          ? 'bg-film-100 text-film-900 shadow-sm'
          : 'text-film-500 hover:text-film-800'
      "
      @click="emit('update:modelValue', option)"
    >
      {{ formatLabel(option) }}
    </button>
  </div>
</template>
