<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

const props = defineProps<{
  tabs: ReadonlyArray<{ value: string; label: string }>
}>()
const { t } = useI18n()
const active = ref(props.tabs[0]?.value)
// Mobile only: the controls card floats over the workspace, so it starts closed and
// tapping the open tab again closes it. Desktop always shows the controls.
const open = ref(false)
let lastTab: string | undefined

const toggle = (tab: string) => {
  open.value = !open.value || lastTab !== tab
  lastTab = tab
}

// How far the open card reaches above the tabs, so the workspace can lift its canvas (mobile).
// On desktop the card sits below the tabs, which measures as 0.
const card = ref<HTMLElement>()
const cardSpace = useToolCardSpace()
useResizeObserver(card, () => {
  const panel = card.value?.parentElement
  if (!card.value || !panel) return
  const space = panel.getBoundingClientRect().top - card.value.getBoundingClientRect().top
  cardSpace.value = open.value ? Math.max(0, space) : 0
})
onBeforeUnmount(() => (cardSpace.value = 0))

// Dragging the grab handle down far enough dismisses the card; a shorter drag snaps it back.
const DISMISS_DISTANCE = 60
const dragOffset = ref(0)
let drag: { pointerId: number; startY: number; moved: boolean } | undefined

const startDrag = (event: PointerEvent) => {
  if (event.button !== 0) return
  drag = { pointerId: event.pointerId, startY: event.clientY, moved: false }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const moveDrag = (event: PointerEvent) => {
  if (!drag || drag.pointerId !== event.pointerId) return
  dragOffset.value = Math.max(0, event.clientY - drag.startY)
  if (dragOffset.value > 4) drag.moved = true
}

const endDrag = (event: PointerEvent) => {
  if (!drag || drag.pointerId !== event.pointerId) return
  const handle = event.currentTarget as HTMLElement
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
  if (event.type === 'pointerup' && dragOffset.value > DISMISS_DISTANCE) open.value = false
  dragOffset.value = 0
}

// A tap or keyboard press (detail 0) closes; the click that ends a drag was handled above.
const tapHandle = (event: MouseEvent) => {
  if (event.detail === 0 || !drag?.moved) open.value = false
  drag = undefined
}
</script>

<template>
  <!-- Hidden tabs stay mounted so section-local state survives tab switches. -->
  <TabsRoot
    v-model="active"
    as="aside"
    :unmount-on-hide="false"
    class="tool-panel relative flex min-h-0 flex-col lg:overflow-hidden"
    :data-open="open || undefined"
  >
    <TabsList
      :aria-label="t('toolPanel.label')"
      class="tool-tabs order-last flex shrink-0 overflow-x-auto lg:order-first"
    >
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="tool-tab"
        @click="toggle(tab.value)"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <div
      ref="card"
      class="tool-content"
      :style="dragOffset ? { translate: `0 ${dragOffset}px`, transition: 'none' } : undefined"
    >
      <button
        type="button"
        class="tool-grabber"
        :aria-label="t('toolPanel.collapse')"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @click="tapHandle"
      >
        <span />
      </button>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <TabsContent
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          class="focus-visible:outline-none"
        >
          <slot :name="tab.value" />
        </TabsContent>
      </div>
    </div>
  </TabsRoot>
</template>

<style scoped>
.tool-tabs {
  scrollbar-width: none;
}

.tool-tabs::-webkit-scrollbar {
  display: none;
}

/* Colors follow the header tool navigation. */
.tool-tab {
  flex-shrink: 0;
  border-radius: var(--radius);
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  transition:
    color 150ms ease,
    background-color 150ms ease;
}

.tool-tab:hover {
  color: var(--accent-foreground);
  background: var(--accent);
}

.tool-tab[data-state='active'] {
  color: var(--primary-foreground);
  background: var(--primary);
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 10%),
    0 1px 2px -1px rgb(0 0 0 / 10%);
}

.tool-tab:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ring) 50%, transparent);
  outline-offset: -2px;
}

.tool-content {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

/* Mobile: pill tabs at the bottom; the open tab's controls float over the workspace. */
@media (max-width: 1023px) {
  .tool-tabs {
    gap: 0.25rem;
    padding: 0.5rem;
    border-top: 1px solid var(--border);
    background: var(--card);
  }

  .tool-tab {
    padding: 0.5rem 0.875rem;
  }

  .tool-panel:not([data-open]) .tool-tab[data-state='active'] {
    color: var(--muted-foreground);
    background: transparent;
    box-shadow: none;
  }

  .tool-content {
    position: absolute;
    z-index: 20;
    right: 0.5rem;
    bottom: calc(100% + 0.5rem);
    left: 0.5rem;
    max-height: min(52dvh, 28rem);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 6px);
    background: color-mix(in srgb, var(--card) 67%, transparent);
    box-shadow: 0 16px 40px rgb(0 0 0 / 28%);
    backdrop-filter: blur(16px);
    transition: translate 200ms ease-out;
    /* Tailwind spacing scales from this unit: tighter padding, gaps and control heights, same text. */
    --spacing: 0.1875rem;
  }

  .tool-panel:not([data-open]) .tool-content {
    display: none;
  }

  /* Export footers flow with the card so it stays evenly translucent; sticky would need a fill. */
  .tool-content :deep(.sticky) {
    position: static;
    background: transparent;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  /* main.css's unlayered `font: inherit` otherwise beats the controls' text utilities (16px). */
  .tool-content :deep(:is(button, input, select)) {
    font: revert-layer;
  }

  .tool-grabber {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    padding: 0.625rem 0 0.375rem;
    cursor: grab;
    touch-action: none;
  }

  .tool-grabber span {
    width: 2.25rem;
    height: 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
  }
}

/* Desktop: pill tabs above the controls, which fill the right column. */
@media (min-width: 1024px) {
  .tool-tabs {
    gap: 0.125rem;
    padding: 0.375rem;
    border-bottom: 1px solid var(--border);
  }

  .tool-tab {
    flex-grow: 1;
    padding: 0.375rem 0.5rem;
  }

  .tool-content {
    flex: 1;
  }

  .tool-grabber {
    display: none;
  }
}
</style>
