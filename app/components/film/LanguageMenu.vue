<script setup lang="ts">
import { Check, Languages } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger
} from 'reka-ui'
import { Button } from '@/components/ui/button'

type AppLocale = 'zh-CN' | 'en'

const { locale, setLocale, t } = useI18n()
const open = ref(false)
const openedByHover = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | undefined

const languageOptions: Array<{ value: AppLocale; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' }
]

const clearCloseTimer = () => {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = undefined
}

const supportsHover = (event: PointerEvent) =>
  event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches

const openMenu = (event: PointerEvent) => {
  if (!supportsHover(event)) return
  clearCloseTimer()
  openedByHover.value = true
  open.value = true
}

const closeMenuSoon = (event: PointerEvent) => {
  if (!supportsHover(event) || !openedByHover.value) return
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    open.value = false
  }, 160)
}

const handleTriggerClick = () => {
  if (openedByHover.value && open.value) open.value = false
  openedByHover.value = false
}

const updateLanguage = (value: unknown) => {
  if (value === 'zh-CN' || value === 'en') void setLocale(value)
}

const handleOpenAutoFocus = (event: Event) => {
  if (openedByHover.value) event.preventDefault()
}

watch(open, (value) => {
  if (!value) openedByHover.value = false
})

onBeforeUnmount(clearCloseTimer)
</script>

<template>
  <DropdownMenuRoot v-model:open="open" :modal="false">
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        :aria-label="t('language.label')"
        :title="t('language.label')"
        @click.capture="handleTriggerClick"
        @pointerenter="openMenu"
        @pointerleave="closeMenuSoon"
      >
        <Languages class="size-5" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="8"
        class="z-50 min-w-44 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        @pointerenter="clearCloseTimer"
        @pointerleave="closeMenuSoon"
        @open-auto-focus="handleOpenAutoFocus"
      >
        <DropdownMenuRadioGroup :model-value="locale" @update:model-value="updateLanguage">
          <DropdownMenuRadioItem
            v-for="option in languageOptions"
            :key="option.value"
            :value="option.value"
            :text-value="option.label"
            class="relative flex cursor-pointer items-center rounded-lg py-2.5 pr-9 pl-3 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            {{ option.label }}
            <DropdownMenuItemIndicator
              class="absolute right-3 inline-flex size-4 items-center justify-center text-primary"
            >
              <Check class="size-4" aria-hidden="true" />
            </DropdownMenuItemIndicator>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
