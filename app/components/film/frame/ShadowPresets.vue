<script setup lang="ts">
import { FRAME_SHADOW_PRESETS } from '~/types/frame'
import type { FrameShadowPreset } from '~/types/frame'

defineProps<{ label: string; surface: string }>()
const model = defineModel<FrameShadowPreset>({ required: true })
const { t } = useI18n()

const PRESETS = Object.keys(FRAME_SHADOW_PRESETS) as FrameShadowPreset[]
// Tiles approximate each preset with CSS shadows on a swatch sized like the photo unit.
const SWATCH_UNIT = 30

const cssShadow = (preset: FrameShadowPreset) =>
  FRAME_SHADOW_PRESETS[preset]
    .map(
      (layer) =>
        `${layer.offsetX * SWATCH_UNIT}px ${layer.offsetY * SWATCH_UNIT}px ${layer.blur * SWATCH_UNIT}px rgba(0,0,0,${layer.alpha})`
    )
    .join(', ') || 'none'
</script>

<template>
  <div class="grid grid-cols-4 gap-2" role="group" :aria-label="label">
    <button
      v-for="preset in PRESETS"
      :key="preset"
      type="button"
      class="flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2 text-[10px] transition"
      :class="
        model === preset
          ? 'border-primary bg-accent text-accent-foreground'
          : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/60'
      "
      :aria-pressed="model === preset"
      @click="model = preset"
    >
      <span
        class="grid h-9 w-full place-items-center rounded-md"
        :style="{ backgroundColor: surface }"
      >
        <span
          class="block h-4 w-6 rounded-[1px] bg-[#9c968c]"
          :style="{ boxShadow: cssShadow(preset) }"
        />
      </span>
      <span class="max-w-full truncate">{{ t(`frame.shadow.presets.${preset}`) }}</span>
    </button>
  </div>
</template>
