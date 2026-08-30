<script setup lang="ts">
import type { CompositionSettings } from '~/types/composition'

const MAX_PADDING = 220
const MAX_GAP = 160
const settings = defineModel<CompositionSettings>({ required: true })
const advancedPadding = ref(false)

const clampSpacing = (value: number | string, maximum: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, Math.round(parsed))) : 0
}

const spacingModel = (getValue: () => number, setValue: (value: number) => void, maximum: number) =>
  computed({
    get: getValue,
    set: (value: number | string) => setValue(clampSpacing(value, maximum))
  })

const paddingModel = computed({
  get: () => settings.value.padding.top,
  set: (value: number | string) => {
    const next = clampSpacing(value, MAX_PADDING)
    settings.value.padding = { top: next, right: next, bottom: next, left: next }
  }
})
const gapModel = spacingModel(
  () => settings.value.gap,
  (value) => (settings.value.gap = value),
  MAX_GAP
)
const paddingControls = [
  { key: 'top', label: '上', name: '上边距' },
  { key: 'right', label: '右', name: '右边距' },
  { key: 'bottom', label: '下', name: '下边距' },
  { key: 'left', label: '左', name: '左边距' }
] as const
const updatePadding = (key: (typeof paddingControls)[number]['key'], event: Event) => {
  settings.value.padding[key] = clampSpacing((event.target as HTMLInputElement).value, MAX_PADDING)
}
const isMixedPadding = computed(() => {
  const { top, right, bottom, left } = settings.value.padding
  return top !== right || top !== bottom || top !== left
})
</script>

<template>
  <div class="space-y-5 border-b border-film-900/10 p-5">
    <div>
      <div class="flex items-center justify-between gap-3 text-xs">
        <span class="font-medium">外边距</span>
        <label class="flex items-center gap-2 text-[10px] text-film-500">
          独立设置
          <USwitch
            v-model="advancedPadding"
            size="sm"
            checked-icon="i-lucide-check"
            aria-label="分别设置四边外边距"
          />
        </label>
      </div>

      <div v-if="!advancedPadding && !isMixedPadding" class="mt-4 flex items-center gap-3">
        <input
          v-model.number="paddingModel"
          class="range min-w-0 flex-1"
          type="range"
          min="0"
          :max="MAX_PADDING"
          step="4"
          aria-label="统一外边距"
        />
        <label
          class="flex shrink-0 items-center gap-1 rounded-md border border-film-900/12 bg-film-100 px-2"
        >
          <span class="sr-only">输入统一外边距</span>
          <input
            v-model.number="paddingModel"
            class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0"
            :max="MAX_PADDING"
            step="1"
            aria-label="输入统一外边距"
          />
          <span class="font-mono text-[9px] text-film-400">px</span>
        </label>
      </div>

      <div
        v-else-if="!advancedPadding"
        class="mt-4 flex items-center justify-between gap-3 rounded-md bg-film-200/65 px-3 py-2.5"
      >
        <p class="font-mono text-[9px] leading-relaxed text-film-500">
          上 {{ settings.padding.top }} · 右 {{ settings.padding.right }} · 下
          {{ settings.padding.bottom }} · 左 {{ settings.padding.left }} px
        </p>
        <button
          class="shrink-0 text-[10px] font-medium text-film-700 hover:text-film-900"
          @click="advancedPadding = true"
        >
          展开编辑
        </button>
      </div>

      <div v-else class="mt-4 grid grid-cols-2 gap-2">
        <label
          v-for="control in paddingControls"
          :key="control.name"
          class="flex items-center gap-2 rounded-md border border-film-900/12 bg-film-100 px-2.5"
        >
          <span class="w-4 text-[10px] text-film-500">{{ control.label }}</span>
          <input
            :value="settings.padding[control.key]"
            class="min-w-0 flex-1 bg-transparent py-2 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0"
            :max="MAX_PADDING"
            step="1"
            :aria-label="control.name"
            @input="updatePadding(control.key, $event)"
          />
          <span class="font-mono text-[9px] text-film-400">px</span>
        </label>
      </div>
    </div>

    <div>
      <div class="mb-3 flex items-center justify-between text-xs">
        <span class="font-medium">画面间距</span>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model.number="gapModel"
          class="range min-w-0 flex-1"
          type="range"
          min="0"
          :max="MAX_GAP"
          step="4"
          aria-label="画面间距"
        />
        <label
          class="flex shrink-0 items-center gap-1 rounded-md border border-film-900/12 bg-film-100 px-2"
        >
          <span class="sr-only">输入画面间距</span>
          <input
            v-model.number="gapModel"
            class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0"
            :max="MAX_GAP"
            step="1"
            aria-label="输入画面间距"
          />
          <span class="font-mono text-[9px] text-film-400">px</span>
        </label>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 rounded-lg bg-film-200/70 p-1">
      <button
        class="rounded-md py-2 text-[11px]"
        :class="settings.fit === 'cover' ? 'bg-film-100 font-medium shadow-sm' : 'text-film-500'"
        @click="settings.fit = 'cover'"
      >
        填满裁切
      </button>
      <button
        class="rounded-md py-2 text-[11px]"
        :class="settings.fit === 'contain' ? 'bg-film-100 font-medium shadow-sm' : 'text-film-500'"
        @click="settings.fit = 'contain'"
      >
        完整显示
      </button>
    </div>
  </div>
</template>
