<script setup lang="ts">
import { MonitorCog, Moon, PanelsTopLeft, ScanLine, ShieldCheck, Sun } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const route = useRoute()
const colorMode = useColorMode()
const { t } = useI18n()

const tools = computed(() => [
  {
    label: t('header.splitter'),
    description: t('header.splitterTagline'),
    icon: ScanLine,
    to: '/'
  },
  {
    label: t('header.composer'),
    description: t('header.composerTagline'),
    icon: PanelsTopLeft,
    to: '/compose'
  }
])
const isActive = (to: string) => route.path === to
const themeIcon = computed(() => {
  if (colorMode.preference === 'system') return MonitorCog
  return colorMode.value === 'dark' ? Moon : Sun
})
const themeLabel = computed(() => {
  const theme =
    colorMode.preference === 'system'
      ? t('header.theme.system')
      : colorMode.preference === 'dark'
        ? t('header.theme.dark')
        : t('header.theme.light')
  return t('header.themeLabel', { theme })
})

const cycleTheme = () => {
  colorMode.preference =
    colorMode.preference === 'system'
      ? 'light'
      : colorMode.preference === 'light'
        ? 'dark'
        : 'system'
}
</script>

<template>
  <header class="app-header shrink-0 border-b border-border bg-card/88 backdrop-blur-xl">
    <div
      class="mx-auto flex max-w-420 flex-wrap items-center gap-x-5 px-4 sm:px-6 lg:flex-nowrap lg:px-8"
    >
      <NuxtLink to="/" class="flex h-16 shrink-0 items-center gap-3" :aria-label="t('header.home')">
        <div class="brand-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <div>
          <p
            class="font-mono text-[9px] leading-none tracking-[0.24em] text-muted-foreground uppercase"
          >
            {{ t('header.brandTagline') }}
          </p>
          <h1 class="mt-1 text-[18px] leading-none font-semibold tracking-[-0.03em]">Film X</h1>
        </div>
      </NuxtLink>

      <nav
        class="order-3 flex w-full items-stretch gap-1 overflow-x-auto border-t border-border py-2 lg:order-0 lg:w-auto lg:flex-1 lg:justify-center lg:border-t-0 lg:py-0"
        :aria-label="t('header.toolsLabel')"
      >
        <NuxtLink
          v-for="tool in tools"
          :key="tool.to"
          :to="tool.to"
          class="tool-tab group flex min-w-max items-center gap-2.5 rounded-lg px-3 py-2 transition-colors lg:px-4"
          :class="
            isActive(tool.to)
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          "
          :aria-current="isActive(tool.to) ? 'page' : undefined"
        >
          <component :is="tool.icon" class="size-4" />
          <span>
            <span class="block text-xs font-semibold">{{ tool.label }}</span>
            <span
              class="hidden font-mono text-[8px] tracking-[0.12em] opacity-60 uppercase xl:block"
              >{{ tool.description }}</span
            >
          </span>
        </NuxtLink>
      </nav>

      <div class="ml-auto flex h-16 shrink-0 items-center gap-1.5">
        <div class="mr-1 hidden items-center gap-2 text-[11px] text-muted-foreground xl:flex">
          <ShieldCheck class="size-3.5 text-primary" />
          {{ t('header.localOnly') }}
        </div>
        <FilmLanguageMenu />
        <ClientOnly>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            :aria-label="themeLabel"
            :title="t('header.themeSwitchTitle', { label: themeLabel })"
            @click="cycleTheme"
          >
            <component :is="themeIcon" />
          </Button>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<style scoped>
.brand-mark {
  display: grid;
  grid-template-columns: repeat(2, 8px);
  gap: 2px;
  width: 22px;
  height: 30px;
  padding: 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
  transform: rotate(-2deg);
}

.brand-mark span {
  background: currentColor;
}

.app-header {
  position: relative;
  z-index: 30;
}
</style>
