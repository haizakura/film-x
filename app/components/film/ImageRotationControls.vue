<script setup lang="ts">
import { RotateCcw, RotateCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { Rotation, SplitSettings } from '~/types/image'
import { rotateClockwise, rotateCounterClockwise } from '~/utils/image'

const props = defineProps<{ settings: SplitSettings }>()
const { t } = useI18n()
const emit = defineEmits<{ 'update:settings': [settings: SplitSettings] }>()
const sides = ['left', 'right'] as const

const setRotation = (side: (typeof sides)[number], direction: 'cw' | 'ccw') => {
  const key = side === 'left' ? 'leftRotation' : 'rightRotation'
  const current = props.settings[key]
  const rotation = direction === 'cw' ? rotateClockwise(current) : rotateCounterClockwise(current)
  emit('update:settings', { ...props.settings, [key]: rotation })
}

const rotationFor = (side: (typeof sides)[number]): Rotation =>
  side === 'left' ? props.settings.leftRotation : props.settings.rightRotation

const rotationLabel = (rotation: Rotation) =>
  rotation === 0 ? t('rotation.original') : `${rotation}°`
</script>

<template>
  <div class="border-b border-border px-5 py-5">
    <p class="eyebrow">{{ t('rotation.heading') }}</p>
    <div class="mt-4 space-y-3">
      <div
        v-for="side in sides"
        :key="side"
        class="flex items-center justify-between rounded-lg border border-border bg-card/55 p-3"
      >
        <div>
          <p class="text-xs font-medium">
            {{ t('rotation.frame', { number: side === 'left' ? '01' : '02' }) }}
          </p>
          <p class="mt-0.5 font-mono text-[9px] text-muted-foreground">
            {{ rotationLabel(rotationFor(side)) }}
          </p>
        </div>
        <div class="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            :aria-label="t('rotation.counterClockwise', { number: side === 'left' ? '01' : '02' })"
            @click="setRotation(side, 'ccw')"
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            :aria-label="t('rotation.clockwise', { number: side === 'left' ? '01' : '02' })"
            @click="setRotation(side, 'cw')"
          >
            <RotateCw />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
