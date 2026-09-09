<script setup lang="ts">
import { MAX_COMPOSITION_CANVAS_SIDE, type CompositionGeometry } from '~/types/composition'

defineProps<{ geometry: CompositionGeometry }>()
const emit = defineEmits<{
  'update:width': [value: string]
  'update:height': [value: string]
}>()
const { t } = useI18n()

const updateWidth = (event: Event) => emit('update:width', (event.target as HTMLInputElement).value)
const updateHeight = (event: Event) =>
  emit('update:height', (event.target as HTMLInputElement).value)
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="eyebrow">{{ t('composition.size.heading') }}</p>
    <div class="mt-4 grid grid-cols-2 gap-2">
      <label class="rounded-md border border-border bg-card px-3 py-2">
        <span class="block text-[10px] text-muted-foreground">{{
          t('composition.size.width')
        }}</span>
        <span class="mt-1 flex items-center gap-1">
          <input
            :value="geometry.width"
            class="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
            type="number"
            min="1"
            :max="MAX_COMPOSITION_CANVAS_SIDE"
            step="1"
            inputmode="numeric"
            :aria-label="t('composition.size.widthInput')"
            @blur="updateWidth"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </span>
      </label>
      <label class="rounded-md border border-border bg-card px-3 py-2">
        <span class="block text-[10px] text-muted-foreground">{{
          t('composition.size.height')
        }}</span>
        <span class="mt-1 flex items-center gap-1">
          <input
            :value="geometry.height"
            class="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
            type="number"
            min="1"
            :max="MAX_COMPOSITION_CANVAS_SIDE"
            step="1"
            inputmode="numeric"
            :aria-label="t('composition.size.heightInput')"
            @blur="updateHeight"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </span>
      </label>
    </div>
    <p class="mt-2 text-[10px] text-muted-foreground">
      {{ t('composition.size.maxHint', { size: MAX_COMPOSITION_CANVAS_SIDE }) }}
    </p>
  </div>
</template>
