<script setup lang="ts">
import { ClipboardPaste, Copy } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { MAX_FRAME_PRESET_LENGTH } from '~/types/frame'

const code = defineModel<string>({ required: true })
const emit = defineEmits<{ copy: []; apply: [] }>()
const { t } = useI18n()

const selectAll = (event: FocusEvent) => (event.target as HTMLInputElement).select()
</script>

<template>
  <div class="space-y-3 border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.preset.heading') }}</p>
    <input
      v-model="code"
      class="w-full min-w-0 rounded-md border border-border bg-card px-3 py-2 font-mono text-[10px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      type="text"
      :maxlength="MAX_FRAME_PRESET_LENGTH"
      autocomplete="off"
      spellcheck="false"
      :aria-label="t('frame.preset.input')"
      :placeholder="t('frame.preset.placeholder')"
      @focus="selectAll"
      @keydown.enter.prevent="emit('apply')"
    />
    <div class="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm" type="button" @click="emit('copy')">
        <Copy aria-hidden="true" />
        {{ t('frame.preset.copy') }}
      </Button>
      <Button variant="outline" size="sm" type="button" @click="emit('apply')">
        <ClipboardPaste aria-hidden="true" />
        {{ t('frame.preset.apply') }}
      </Button>
    </div>
    <p class="text-[10px] leading-relaxed text-muted-foreground">{{ t('frame.preset.hint') }}</p>
  </div>
</template>
