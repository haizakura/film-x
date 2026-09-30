<script setup lang="ts">
import { normalizeHexColor } from '~/utils/color'

defineProps<{
  pickerLabel: string
  hexLabel: string
  placeholder: string
}>()
const color = defineModel<string>({ required: true })
const hexInput = ref(color.value.toUpperCase())

const updateHex = () => {
  const normalized = normalizeHexColor(hexInput.value)
  if (normalized) color.value = normalized
}

const commitHex = () => {
  const normalized = normalizeHexColor(hexInput.value)
  hexInput.value = normalized || color.value.toUpperCase()
  if (normalized) color.value = normalized
}

watch(color, (value) => {
  hexInput.value = value.toUpperCase()
})
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="shrink-0">
      <span class="sr-only">{{ pickerLabel }}</span>
      <input
        v-model="color"
        type="color"
        class="size-9 rounded-md border border-border bg-transparent p-0.5"
        :aria-label="pickerLabel"
      />
    </label>
    <label class="min-w-0 flex-1">
      <span class="sr-only">{{ hexLabel }}</span>
      <input
        v-model="hexInput"
        class="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-xs uppercase outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        type="text"
        maxlength="7"
        autocomplete="off"
        spellcheck="false"
        :aria-label="hexLabel"
        :placeholder="placeholder"
        @input="updateHex"
        @blur="commitHex"
        @keydown.enter="commitHex"
      />
    </label>
  </div>
</template>
