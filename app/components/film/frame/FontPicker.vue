<script setup lang="ts">
import { FRAME_FONTS } from '~/types/frame'
import type { FrameFontCategory, FrameFontId } from '~/types/frame'
import { getFrameFontFamily } from '~/utils/frameFonts'

defineProps<{ label: string }>()
const model = defineModel<FrameFontId>({ required: true })
const { t } = useI18n()

const CATEGORIES: FrameFontCategory[] = ['serif', 'sans', 'mono', 'script', 'system']
const SYSTEM_LABELS: Partial<Record<FrameFontId, string>> = {
  'system-sans': 'frame.typography.systemSans',
  'system-serif': 'frame.typography.systemSerif',
  'system-kai': 'frame.typography.systemKai'
}

const fontLabel = (id: FrameFontId) => {
  const key = SYSTEM_LABELS[id]
  return key ? t(key) : FRAME_FONTS[id].family.replaceAll('"', '')
}

const groups = computed(() =>
  CATEGORIES.map((category) => ({
    category,
    label: t(`frame.typography.categories.${category}`),
    fonts: (Object.keys(FRAME_FONTS) as FrameFontId[]).filter(
      (id) => FRAME_FONTS[id].category === category
    )
  }))
)
</script>

<template>
  <div
    class="max-h-56 space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-border bg-card/60 p-2"
    role="group"
    :aria-label="label"
  >
    <div v-for="group in groups" :key="group.category">
      <p class="mb-1.5 px-1 font-mono text-[8px] tracking-[0.16em] text-muted-foreground uppercase">
        {{ group.label }}
      </p>
      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="font in group.fonts"
          :key="font"
          type="button"
          class="truncate rounded-md border px-2 py-1.5 text-left text-[13px] leading-tight transition"
          :class="
            model === font
              ? 'border-primary bg-accent text-accent-foreground'
              : 'border-transparent text-foreground/80 hover:border-border hover:bg-accent/60'
          "
          :style="{ fontFamily: getFrameFontFamily(font) }"
          :aria-pressed="model === font"
          :title="fontLabel(font)"
          @click="model = font"
        >
          {{ fontLabel(font) }}
        </button>
      </div>
    </div>
  </div>
</template>
