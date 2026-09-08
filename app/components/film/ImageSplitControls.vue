<script setup lang="ts">
import { LoaderCircle, ScanSearch } from '@lucide/vue'
import type { AnalysisStatus, SplitSettings } from '~/types/image'

const props = defineProps<{ settings: SplitSettings; analysisStatus: AnalysisStatus }>()
const { t } = useI18n()
const emit = defineEmits<{
  'update:settings': [settings: SplitSettings]
  detect: []
}>()

const updateNumber = (key: 'center' | 'gap', event: Event) => {
  emit('update:settings', {
    ...props.settings,
    [key]: Number((event.target as HTMLInputElement).value)
  })
}
</script>

<template>
  <div class="border-b border-border px-5 py-5">
    <div class="flex items-center justify-between">
      <p class="eyebrow">{{ t('split.heading') }}</p>
      <button
        type="button"
        class="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:cursor-wait disabled:opacity-60"
        :disabled="analysisStatus === 'analyzing' || analysisStatus === 'pending'"
        @click="emit('detect')"
      >
        <component
          :is="
            analysisStatus === 'analyzing' || analysisStatus === 'pending'
              ? LoaderCircle
              : ScanSearch
          "
          class="size-3"
          :class="{ 'animate-spin': analysisStatus === 'analyzing' }"
        />
        {{
          analysisStatus === 'analyzing' || analysisStatus === 'pending'
            ? t('split.detecting')
            : t('split.detectAgain')
        }}
      </button>
    </div>
    <div class="mt-5 space-y-6">
      <label class="block">
        <span class="mb-3 flex items-center justify-between text-xs">
          <span class="font-medium">{{ t('split.position') }}</span>
          <output class="font-mono text-[10px] text-muted-foreground"
            >{{ (settings.center * 100).toFixed(1) }}%</output
          >
        </span>
        <input
          :value="settings.center"
          class="range"
          type="range"
          min="0.4"
          max="0.6"
          step="0.001"
          @input="updateNumber('center', $event)"
        />
      </label>

      <label class="block">
        <span class="mb-3 flex items-center justify-between text-xs">
          <span class="font-medium">{{ t('split.removeGap') }}</span>
          <output class="font-mono text-[10px] text-muted-foreground"
            >{{ (settings.gap * 100).toFixed(1) }}%</output
          >
        </span>
        <input
          :value="settings.gap"
          class="range"
          type="range"
          min="0"
          max="0.08"
          step="0.001"
          @input="updateNumber('gap', $event)"
        />
      </label>
    </div>
  </div>
</template>
