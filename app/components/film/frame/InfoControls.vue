<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import {
  FRAME_INFO_LINES,
  FRAME_TEMPLATES,
  MAX_FRAME_SCALE,
  MAX_FRAME_TEXT_LENGTH,
  MIN_FRAME_SCALE
} from '~/types/frame'
import type {
  FrameInfoField,
  FrameInfoFields,
  FrameInfoLine,
  FrameSettings,
  FrameSourceType
} from '~/types/frame'
import type { PhotoExif } from '~/utils/exif'

defineProps<{ fields: FrameInfoFields; exif?: PhotoExif; hasPhoto: boolean }>()
const settings = defineModel<FrameSettings>({ required: true })
const emit = defineEmits<{
  tagline: [text: string]
  'source-type': [type: FrameSourceType]
  field: [field: FrameInfoField, value: string]
  'fill-exif': []
}>()
const { t } = useI18n()

const EXPOSURE_FIELDS: FrameInfoField[] = ['focalLength', 'aperture', 'shutter', 'iso']
const stacked = computed(() => FRAME_TEMPLATES[settings.value.template].layout === 'stack')
const sourceOptions = computed(() => [
  { value: 'digital' as const, label: t('frame.info.digital') },
  { value: 'film' as const, label: t('frame.info.film') }
])
const sourceType = computed({
  get: () => settings.value.sourceType,
  set: (value: FrameSourceType) => emit('source-type', value)
})

const lineLabel = (line: FrameInfoLine) => t(`frame.info.lines.${line}`)
const updateField = (field: FrameInfoField, event: Event) =>
  emit('field', field, (event.target as HTMLInputElement).value)
</script>

<template>
  <div class="space-y-4 border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.info.heading') }}</p>

    <div class="space-y-2">
      <FilmSegmented
        v-model="sourceType"
        :options="sourceOptions"
        :label="t('frame.info.source')"
      />
      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{
          settings.sourceType === 'film' ? t('frame.info.filmHint') : t('frame.info.digitalHint')
        }}
      </p>
    </div>

    <div class="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
      <p class="min-w-0 truncate font-mono text-[9px] text-muted-foreground">
        {{
          !hasPhoto
            ? t('frame.info.noPhoto')
            : exif
              ? t('frame.info.exifReady')
              : t('frame.exifMissing')
        }}
      </p>
      <button
        type="button"
        class="flex shrink-0 items-center gap-1 text-[10px] font-medium text-foreground/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!exif"
        @click="emit('fill-exif')"
      >
        <RefreshCw class="size-3" aria-hidden="true" />
        {{ t('frame.info.fillExif') }}
      </button>
    </div>

    <div v-for="line in FRAME_INFO_LINES" :key="line" class="space-y-2">
      <div class="flex items-center gap-3">
        <FilmToggleField
          v-model="settings.lines[line]"
          class="min-w-0 flex-1"
          :label="lineLabel(line)"
          :aria-label="t('frame.info.show', { line: lineLabel(line) })"
        />
        <FilmNumberField
          v-model="settings.lineScales[line]"
          :label="t('frame.info.size', { line: lineLabel(line) })"
          :min="MIN_FRAME_SCALE * 100"
          :max="MAX_FRAME_SCALE * 100"
          :step="5"
        />
      </div>
      <div v-if="line === 'exposure'" class="grid grid-cols-2 gap-1.5">
        <input
          v-for="field in EXPOSURE_FIELDS"
          :key="field"
          :value="fields[field]"
          class="frame-input"
          type="text"
          :maxlength="MAX_FRAME_TEXT_LENGTH"
          autocomplete="off"
          spellcheck="false"
          :aria-label="t(`frame.info.fields.${field}`)"
          :placeholder="t(`frame.info.placeholders.${field}`)"
          @input="updateField(field, $event)"
        />
      </div>
      <input
        v-else
        :value="fields[line]"
        class="frame-input"
        type="text"
        :maxlength="MAX_FRAME_TEXT_LENGTH"
        autocomplete="off"
        spellcheck="false"
        :aria-label="t(`frame.info.fields.${line}`)"
        :placeholder="t(`frame.info.placeholders.${line}`)"
        @input="updateField(line, $event)"
      />
    </div>

    <div v-if="stacked" class="space-y-2 border-t border-border pt-4">
      <div class="flex items-center gap-3">
        <FilmToggleField
          v-model="settings.showTagline"
          class="min-w-0 flex-1"
          :label="t('frame.info.tagline')"
          :aria-label="t('frame.info.taglineShow')"
        />
        <FilmNumberField
          v-model="settings.taglineScale"
          :label="t('frame.info.size', { line: t('frame.info.tagline') })"
          :min="MIN_FRAME_SCALE * 100"
          :max="MAX_FRAME_SCALE * 100"
          :step="5"
        />
      </div>
      <input
        :value="settings.tagline"
        class="frame-input"
        type="text"
        :maxlength="MAX_FRAME_TEXT_LENGTH"
        autocomplete="off"
        spellcheck="false"
        :aria-label="t('frame.info.tagline')"
        :placeholder="t('frame.info.taglinePlaceholder')"
        @input="emit('tagline', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.frame-input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 2px);
  padding: 0.5rem 0.75rem;
  background: var(--card);
  font-size: 0.75rem;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.frame-input::placeholder {
  color: color-mix(in srgb, var(--muted-foreground) 60%, transparent);
}

.frame-input:focus-visible {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
}
</style>
