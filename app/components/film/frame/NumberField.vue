<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    /** Bounds and step in displayed units. */
    min: number
    max: number
    step?: number
    unit?: string
    /** Multiplier from the model value to the displayed value. */
    factor?: number
  }>(),
  { step: 1, unit: '%', factor: 100 }
)
const model = defineModel<number>({ required: true })

const digits = computed(() => (String(props.step).split('.')[1] ?? '').length)
const display = computed(() => Number((model.value * props.factor).toFixed(digits.value)))

const commit = (event: Event) => {
  const input = event.target as HTMLInputElement
  const parsed = Number(input.value)
  if (Number.isFinite(parsed) && input.value !== '') {
    model.value = Math.min(props.max, Math.max(props.min, parsed)) / props.factor
  }
  // Show the clamped value even when the model did not change.
  input.value = String(display.value)
}
</script>

<template>
  <label class="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2">
    <span class="sr-only">{{ label }}</span>
    <input
      :value="display"
      class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      inputmode="decimal"
      :aria-label="label"
      :title="label"
      @change="commit"
    />
    <span class="font-mono text-[9px] text-muted-foreground/70">{{ unit }}</span>
  </label>
</template>
