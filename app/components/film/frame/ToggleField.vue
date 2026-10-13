<script setup lang="ts">
import { Check } from '@lucide/vue'
import { Switch } from '@/components/ui/switch'

defineProps<{ label: string; ariaLabel?: string; disabled?: boolean }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label
    class="flex items-center justify-between gap-3 text-[10px] text-muted-foreground"
    :class="{ 'opacity-50': disabled }"
  >
    <span>{{ label }}</span>
    <Switch v-model="model" size="sm" :disabled="disabled" :aria-label="ariaLabel ?? label">
      <template #thumb="{ checked }">
        <Check v-if="checked" class="size-2 stroke-3" aria-hidden="true" />
      </template>
    </Switch>
  </label>
</template>
