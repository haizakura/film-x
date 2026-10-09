<script setup lang="ts">
import { Image as ImageIcon, Images, RectangleHorizontal, RectangleVertical } from '@lucide/vue'
import type { CompositionFrameCount, CompositionFrameFormat } from '~/types/composition'

defineProps<{ format: CompositionFrameFormat; count: CompositionFrameCount }>()
const emit = defineEmits<{
  'update:format': [value: CompositionFrameFormat]
  'update:count': [value: CompositionFrameCount]
}>()
const { t } = useI18n()

const formatOptions = computed(() => [
  { value: 'half' as const, label: t('composition.frames.half'), icon: RectangleVertical },
  { value: 'full' as const, label: t('composition.frames.full'), icon: RectangleHorizontal }
])
const countOptions = computed(() => [
  { value: 1 as const, label: t('composition.frames.single'), icon: ImageIcon },
  { value: 2 as const, label: t('composition.frames.double'), icon: Images }
])
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('composition.frames.heading') }}</p>
    <div
      class="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      role="group"
      :aria-label="t('composition.frames.format')"
    >
      <button
        v-for="option in formatOptions"
        :key="option.value"
        class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
        :class="
          format === option.value
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        type="button"
        :aria-pressed="format === option.value"
        @click="emit('update:format', option.value)"
      >
        <component :is="option.icon" class="size-3.5" aria-hidden="true" />
        {{ option.label }}
      </button>
    </div>
    <div
      class="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      role="group"
      :aria-label="t('composition.frames.count')"
    >
      <button
        v-for="option in countOptions"
        :key="option.value"
        class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
        :class="
          count === option.value
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        type="button"
        :aria-pressed="count === option.value"
        @click="emit('update:count', option.value)"
      >
        <component :is="option.icon" class="size-3.5" aria-hidden="true" />
        {{ option.label }}
      </button>
    </div>
    <p class="mt-3 text-[10px] leading-relaxed text-muted-foreground">
      {{ t('composition.frames.hint') }}
    </p>
  </div>
</template>
