<script setup lang="ts" generic="T extends string | number">
defineProps<{
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>
  label: string
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    class="grid gap-1 rounded-lg bg-muted p-1"
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-md px-1.5 py-2 text-[11px] transition disabled:cursor-not-allowed disabled:opacity-40"
      :class="
        model === option.value
          ? 'bg-primary font-medium text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      "
      :disabled="option.disabled"
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
