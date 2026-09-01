<script setup lang="ts">
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })

const ratios = [
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 }
]

const selectPresetRatio = (value: number) => {
  settings.value.ratioMode = 'preset'
  settings.value.ratio = value
}
</script>

<template>
  <div class="border-b border-film-900/10 p-5">
    <p class="eyebrow">画布比例</p>
    <div class="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-film-200/75 p-1">
      <button
        v-for="option in ratios"
        :key="option.label"
        class="rounded-md py-2 font-mono text-[10px] transition"
        :class="
          settings.ratioMode === 'preset' && settings.ratio === option.value
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-film-500 hover:bg-accent hover:text-accent-foreground'
        "
        @click="selectPresetRatio(option.value)"
      >
        {{ option.label }}
      </button>
      <button
        class="rounded-md py-2 text-[10px] transition"
        :class="
          settings.ratioMode === 'auto'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-film-500 hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.ratioMode = 'auto'"
      >
        自动
      </button>
      <button
        class="rounded-md py-2 text-[10px] transition"
        :class="
          settings.ratioMode === 'custom'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-film-500 hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.ratioMode = 'custom'"
      >
        自定义
      </button>
    </div>

    <div v-if="settings.ratioMode === 'custom'" class="mt-3 flex items-center gap-2">
      <label class="min-w-0 flex-1">
        <span class="sr-only">自定义比例宽度</span>
        <input
          v-model.number="settings.customRatioWidth"
          class="w-full rounded-md border border-film-900/12 bg-film-100 px-3 py-2 text-center font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="number"
          min="1"
          max="99"
          step="1"
          aria-label="自定义比例宽度"
        />
      </label>
      <span class="font-mono text-xs text-film-400">:</span>
      <label class="min-w-0 flex-1">
        <span class="sr-only">自定义比例高度</span>
        <input
          v-model.number="settings.customRatioHeight"
          class="w-full rounded-md border border-film-900/12 bg-film-100 px-3 py-2 text-center font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="number"
          min="1"
          max="99"
          step="1"
          aria-label="自定义比例高度"
        />
      </label>
    </div>
    <p
      v-else-if="settings.ratioMode === 'auto'"
      class="mt-3 text-[10px] leading-relaxed text-film-500"
    >
      根据图像比例与当前间距自动调整导出尺寸。
    </p>
  </div>
</template>
