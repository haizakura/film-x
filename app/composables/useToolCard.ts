import { useResizeObserver } from '@vueuse/core'
import type { InjectionKey, Ref } from 'vue'

const CARD_SPACE: InjectionKey<Ref<number>> = Symbol('toolCardSpace')
// Breathing room kept between a lifted canvas and the card.
const LIFT_GAP = 12

/** A tool page shares how far its open mobile tool card reaches above the tab bar, in px. */
export const provideToolCardSpace = () => provide(CARD_SPACE, ref(0))

export const useToolCardSpace = () => inject(CARD_SPACE, () => ref(0), true)

/**
 * Mobile: moves `target` up, at its own size, so the open tool card covers as little of it as
 * possible without leaving `stage`'s content box. The card overlays the bottom of the stage's
 * parent, whose bottom edge meets the tab bar. Returns the style for `target`.
 */
export const useToolCardLift = (
  target: Ref<HTMLElement | undefined>,
  stage: Ref<HTMLElement | undefined>
) => {
  const space = useToolCardSpace()
  const lift = ref(0)

  const update = () => {
    const element = target.value
    const box = stage.value
    const workspace = box?.parentElement
    if (!element || !box || !workspace || !space.value) {
      lift.value = 0
      return
    }
    // The rect includes the current lift; add it back to get the resting position.
    const rect = element.getBoundingClientRect()
    const room = rect.top + lift.value - box.getBoundingClientRect().top
    const cardTop = workspace.getBoundingClientRect().bottom - space.value
    const needed = rect.bottom + lift.value - cardTop + LIFT_GAP
    lift.value = Math.max(0, Math.min(needed, room - parseFloat(getComputedStyle(box).paddingTop)))
  }

  watch(space, update)
  useResizeObserver([target, stage], update)

  return computed(() => (lift.value ? { translate: `0 ${-lift.value}px` } : undefined))
}
