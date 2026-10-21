<script setup lang="ts">
import type { FrameImageEntry } from '~/composables/useFrameImage'
import type {
  CameraBrand,
  CameraBrandId,
  FrameInfoField,
  FrameInfoFields,
  FrameSettings,
  FrameSourceType,
  FrameTemplate,
  FrameWordmarkPreset
} from '~/types/frame'
import type { PhotoExif } from '~/utils/exif'

defineProps<{
  brand: CameraBrand
  fields: FrameInfoFields
  exif?: PhotoExif
  hasPhoto: boolean
  customLogo?: FrameImageEntry
  outputSize?: { width: number; height: number }
  exporting: boolean
}>()
const settings = defineModel<FrameSettings>({ required: true })
const presetCode = defineModel<string>('presetCode', { required: true })
const emit = defineEmits<{
  template: [template: FrameTemplate]
  brand: [id: CameraBrandId]
  'wordmark-preset': [preset: FrameWordmarkPreset]
  tagline: [text: string]
  'source-type': [type: FrameSourceType]
  field: [field: FrameInfoField, value: string]
  'fill-exif': []
  'custom-logo': [files: File[]]
  'remove-custom-logo': []
  'copy-preset': []
  'apply-preset': []
  download: []
}>()
const { t } = useI18n()

const tabs = computed(() => [
  { value: 'layout', label: t('toolPanel.layout') },
  { value: 'brand', label: t('toolPanel.brand') },
  { value: 'text', label: t('toolPanel.text') },
  { value: 'style', label: t('toolPanel.style') },
  { value: 'export', label: t('toolPanel.export') }
])
</script>

<template>
  <FilmToolPanel class="panel-surface" :tabs="tabs">
    <template #layout>
      <FilmFrameTemplateControls
        :model-value="settings.template"
        @update:model-value="emit('template', $event)"
      />
      <FilmFrameRatioControls v-model="settings" />
    </template>
    <template #brand>
      <FilmFrameBrandControls
        v-model="settings"
        :brand="brand"
        :custom-logo="customLogo"
        @brand="emit('brand', $event)"
        @wordmark-preset="emit('wordmark-preset', $event)"
        @custom-logo="emit('custom-logo', $event)"
        @remove-custom-logo="emit('remove-custom-logo')"
      />
    </template>
    <template #text>
      <FilmFrameInfoControls
        v-model="settings"
        :fields="fields"
        :exif="exif"
        :has-photo="hasPhoto"
        @tagline="emit('tagline', $event)"
        @source-type="emit('source-type', $event)"
        @field="(field, value) => emit('field', field, value)"
        @fill-exif="emit('fill-exif')"
      />
      <FilmFrameTypographyControls v-model="settings" />
    </template>
    <template #style>
      <FilmFrameStyleControls v-model="settings" />
      <FilmFrameShadowControls v-model="settings" />
    </template>
    <template #export>
      <FilmFramePresetControls
        v-model="presetCode"
        @copy="emit('copy-preset')"
        @apply="emit('apply-preset')"
      />
      <FilmFrameExportControls
        v-model="settings"
        :has-photo="hasPhoto"
        :output-size="outputSize"
        :exporting="exporting"
        @download="emit('download')"
      />
    </template>
  </FilmToolPanel>
</template>
