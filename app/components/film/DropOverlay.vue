<script setup lang="ts">
import { Images } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    mode?: 'viewport' | 'container'
  }>(),
  {
    title: '松开以添加扫描图像',
    description: undefined,
    mode: 'viewport'
  }
)

const positionClass = computed(() =>
  props.mode === 'container' ? 'absolute inset-0 z-30' : 'fixed inset-3 z-40 rounded-2xl'
)
const surfaceClass = computed(() =>
  props.mode === 'container' ? 'border-primary/70 bg-black/72' : 'border-primary bg-film-900/88'
)
const iconClass = computed(() =>
  props.mode === 'container' ? 'mx-auto size-8 text-primary' : 'mx-auto mb-4 size-10 text-primary'
)
const titleClass = computed(() =>
  props.mode === 'container' ? 'mt-3 text-sm font-semibold' : 'text-xl font-semibold'
)
const descriptionClass = computed(() =>
  props.mode === 'container'
    ? 'mt-1 font-mono text-[9px] tracking-wider text-white/45 uppercase'
    : 'mt-2 font-mono text-[9px] tracking-wider text-white/50 uppercase'
)
</script>

<template>
  <div
    class="pointer-events-none grid place-items-center border-2 border-dashed text-white backdrop-blur-sm"
    :class="[positionClass, surfaceClass]"
  >
    <div class="text-center">
      <Images :class="iconClass" />
      <p :class="titleClass">{{ title }}</p>
      <p v-if="description" :class="descriptionClass">
        {{ description }}
      </p>
    </div>
  </div>
</template>
