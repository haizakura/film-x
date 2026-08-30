<script setup lang="ts">
import type { CompositionPattern, CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const backgroundHexInput = ref(settings.value.background)

const patterns: Array<{ label: string; value: CompositionPattern; icon: string }> = [
  { label: '纯色', value: 'none', icon: 'i-lucide-square' },
  { label: '方格', value: 'grid', icon: 'i-lucide-grid-3x3' },
  { label: '圆点', value: 'dots', icon: 'i-lucide-grip' }
]

const normalizeHexColor = (value: string) => {
  const hex = value.trim().replace(/^#/, '')
  return /^[\dA-Fa-f]{6}$/.test(hex) ? `#${hex.toUpperCase()}` : undefined
}

const updateBackgroundHex = () => {
  const normalized = normalizeHexColor(backgroundHexInput.value)
  if (normalized) settings.value.background = normalized
}

const commitBackgroundHex = () => {
  const normalized = normalizeHexColor(backgroundHexInput.value)
  backgroundHexInput.value = normalized || settings.value.background.toUpperCase()
  if (normalized) settings.value.background = normalized
}

watch(
  () => settings.value.background,
  (value) => {
    backgroundHexInput.value = value.toUpperCase()
  }
)
</script>

<template>
  <div class="border-b border-film-900/10 p-5">
    <p class="eyebrow">背景与底纹</p>
    <div class="mt-4 flex items-center gap-2">
      <label class="shrink-0">
        <span class="sr-only">选择背景颜色</span>
        <input
          v-model="settings.background"
          type="color"
          class="size-9 rounded-md border border-film-900/12 bg-transparent p-0.5"
          aria-label="选择背景颜色"
        />
      </label>
      <label class="min-w-0 flex-1">
        <span class="sr-only">背景颜色十六进制 RGB 值</span>
        <input
          v-model="backgroundHexInput"
          class="w-full rounded-md border border-film-900/12 bg-film-100 px-3 py-2 font-mono text-xs uppercase outline-none transition focus:border-orange-500"
          type="text"
          maxlength="7"
          autocomplete="off"
          spellcheck="false"
          aria-label="背景颜色十六进制 RGB 值"
          placeholder="#E9E4DA"
          @input="updateBackgroundHex"
          @blur="commitBackgroundHex"
          @keydown.enter="commitBackgroundHex"
        />
      </label>
    </div>
    <div class="mt-4 grid grid-cols-3 gap-2">
      <button
        v-for="option in patterns"
        :key="option.value"
        class="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[10px] transition"
        :class="
          settings.pattern === option.value
            ? 'border-film-800 bg-film-200/70 text-film-900'
            : 'border-film-900/10 text-film-500 hover:border-film-500/50'
        "
        @click="settings.pattern = option.value"
      >
        <UIcon :name="option.icon" class="size-4" />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
