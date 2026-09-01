<script setup lang="ts">
import { RotateCcw, RotateCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { Rotation, SplitSettings } from '~/types/image'
import { rotateClockwise, rotateCounterClockwise } from '~/utils/image'

const props = defineProps<{ settings: SplitSettings }>()
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

const rotationLabel = (rotation: Rotation) => (rotation === 0 ? '原向' : `${rotation}°`)
</script>

<template>
  <div class="border-b border-film-900/10 px-5 py-5">
    <p class="eyebrow">方向</p>
    <div class="mt-4 space-y-3">
      <div
        v-for="side in sides"
        :key="side"
        class="flex items-center justify-between rounded-lg border border-film-900/10 bg-film-100/55 p-3"
      >
        <div>
          <p class="text-xs font-medium">画面 {{ side === 'left' ? '01' : '02' }}</p>
          <p class="mt-0.5 font-mono text-[9px] text-film-500">
            {{ rotationLabel(rotationFor(side)) }}
          </p>
        </div>
        <div class="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            :aria-label="`画面 ${side === 'left' ? '01' : '02'} 逆时针旋转`"
            @click="setRotation(side, 'ccw')"
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            :aria-label="`画面 ${side === 'left' ? '01' : '02'} 顺时针旋转`"
            @click="setRotation(side, 'cw')"
          >
            <RotateCw />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
