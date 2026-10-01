<script setup lang="ts">
import { Check } from '@lucide/vue'
import { Switch } from '@/components/ui/switch'
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="border-b border-border p-5">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-medium">{{ t('composition.texture.heading') }}</p>
      <label class="flex items-center gap-2 text-[10px] text-muted-foreground">
        {{ t('composition.texture.enabled') }}
        <Switch
          v-model="settings.filmTexture"
          size="sm"
          :aria-label="t('composition.texture.enabledLabel')"
        >
          <template #thumb="{ checked }">
            <Check v-if="checked" class="size-2 stroke-3" aria-hidden="true" />
          </template>
        </Switch>
      </label>
    </div>
    <p class="mt-3 text-[10px] leading-relaxed text-muted-foreground">
      {{ t('composition.texture.hint') }}
    </p>
  </div>
</template>
