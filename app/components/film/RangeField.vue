<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    inputLabel: string
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

const slide = (event: Event) => {
  model.value = Number((event.target as HTMLInputElement).value) / props.factor
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
      <span>{{ label }}</span>
      <FilmNumberField
        v-model="model"
        :label="inputLabel"
        :min="min"
        :max="max"
        :step="step"
        :unit="unit"
        :factor="factor"
      />
    </div>
    <input
      :value="display"
      class="range w-full"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
      @input="slide"
    />
  </div>
</template>
