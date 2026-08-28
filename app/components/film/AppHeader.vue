<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

const tools = [
  { label: '半格切分', description: '一分为二', icon: 'i-lucide-scan-line', to: '/' },
  { label: '排版拼图', description: '双片成章', icon: 'i-lucide-panels-top-left', to: '/compose' }
]

const isActive = (to: string) => route.path === to
const themeIcon = computed(() => {
  if (colorMode.preference === 'system') return 'i-lucide-monitor-cog'
  return colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
})
const themeLabel = computed(() => {
  if (colorMode.preference === 'system') return '主题：跟随系统'
  return colorMode.preference === 'dark' ? '主题：深色' : '主题：浅色'
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
  <header class="app-header shrink-0 border-b border-film-900/10 bg-film-100/88 backdrop-blur-xl">
    <div
      class="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-5 px-4 sm:px-6 lg:flex-nowrap lg:px-8"
    >
      <NuxtLink to="/" class="flex h-16 shrink-0 items-center gap-3" aria-label="Film X 首页">
        <div class="brand-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <div>
          <p class="font-mono text-[9px] leading-none tracking-[0.24em] text-film-500 uppercase">
            Local film lab
          </p>
          <h1 class="mt-1 text-[18px] leading-none font-semibold tracking-[-0.03em]">Film X</h1>
        </div>
      </NuxtLink>

      <nav
        class="order-3 flex w-full items-stretch gap-1 overflow-x-auto border-t border-film-900/8 py-2 lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:border-t-0 lg:py-0"
        aria-label="图像工具"
      >
        <NuxtLink
          v-for="tool in tools"
          :key="tool.to"
          :to="tool.to"
          class="tool-tab group flex min-w-max items-center gap-2.5 rounded-lg px-3 py-2 transition-colors lg:px-4"
          :class="
            isActive(tool.to)
              ? 'bg-film-900 text-film-50'
              : 'text-film-500 hover:bg-film-200/65 hover:text-film-900'
          "
          :aria-current="isActive(tool.to) ? 'page' : undefined"
        >
          <UIcon :name="tool.icon" class="size-4" />
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
        <div class="mr-1 hidden items-center gap-2 text-[11px] text-film-500 xl:flex">
          <UIcon name="i-lucide-shield-check" class="size-3.5 text-emerald-600" />
          图像仅在本地处理
        </div>
        <ClientOnly>
          <UButton
            :icon="themeIcon"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="themeLabel"
            :title="`${themeLabel}，点击切换`"
            @click="cycleTheme"
          />
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
  border: 1px solid color-mix(in srgb, var(--color-film-900) 55%, transparent);
  border-radius: 2px;
  transform: rotate(-2deg);
}

.brand-mark span {
  background: var(--color-film-900);
}

.app-header {
  position: relative;
  z-index: 30;
}
</style>
