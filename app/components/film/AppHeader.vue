<script setup lang="ts">
import { MonitorCog, Moon, PanelsTopLeft, ScanLine, Sun } from '@lucide/vue'
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
            <component :is="themeIcon" class="size-5" />
          </Button>
        </ClientOnly>
        <Button as-child variant="ghost" size="icon-sm">
          <a
            href="https://github.com/haizakura/film-x"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t('header.github')"
            :title="t('header.github')"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.683-.217.683-.483 0-.237-.009-1.026-.013-1.86-2.782.604-3.369-1.18-3.369-1.18-.455-1.157-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.555-1.11-4.555-4.943 0-1.092.39-1.985 1.029-2.685-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.56 9.56 0 0 1 12 6.756c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.593 1.028 2.685 0 3.842-2.338 4.687-4.566 4.935.359.31.678.92.678 1.855 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.482A10.001 10.001 0 0 0 22 12c0-5.523-4.477-10-10-10Z"
              />
            </svg>
          </a>
        </Button>
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
