<script setup lang="ts">
defineProps<{
  fileInputId: string
  isDragging: boolean
}>()

const emit = defineEmits<{ pick: [] }>()
</script>

<template>
  <main class="mx-auto flex max-w-6xl flex-col px-5 py-10 lg:py-14">
    <section class="mb-8 max-w-3xl lg:mb-10">
      <p
        class="mb-4 flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-amber-700 uppercase"
      >
        <span class="h-px w-7 bg-amber-700" />
        Tool 01 · Splitter
      </p>
      <h2
        class="text-4xl leading-[1.08] font-semibold tracking-[-0.045em] text-balance sm:text-6xl"
      >
        一张扫描，<br />还原两次快门。
      </h2>
      <p class="mt-6 max-w-xl text-base leading-7 text-film-600 sm:text-lg">
        自动识别两幅半格照片之间的中缝。你可以逐张校准分割线、分别旋转，再一次导出整卷照片。
      </p>
    </section>

    <label
      :for="fileInputId"
      role="button"
      tabindex="0"
      class="drop-zone group relative min-h-64 overflow-hidden rounded-2xl border border-dashed border-film-500/45 bg-film-50/60 p-8 text-left transition hover:border-orange-600/60 hover:bg-film-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
      :class="{ 'border-orange-600 bg-orange-500/8': isDragging }"
      @keydown.enter.prevent="emit('pick')"
      @keydown.space.prevent="emit('pick')"
    >
      <span class="absolute top-0 right-0 p-5 font-mono text-[10px] tracking-wider text-film-400"
        >A / B</span
      >
      <span class="flex h-full min-h-56 flex-col items-center justify-center text-center">
        <span
          class="mb-6 grid size-15 place-items-center rounded-full border border-film-900/10 bg-film-100 shadow-sm transition group-hover:-translate-y-1"
        >
          <UIcon name="i-lucide-scan-line" class="size-6 text-film-800" />
        </span>
        <span class="text-lg font-semibold">拖入扫描图像</span>
        <span class="mt-2 text-sm text-film-500">或点击选择单张 / 多张文件</span>
        <span
          class="mt-5 rounded-full bg-film-200/70 px-3 py-1 font-mono text-[10px] tracking-wider text-film-600 uppercase"
        >
          TIFF · JPEG · PNG · WEBP
        </span>
      </span>
    </label>

    <div class="mt-7 grid gap-4 text-sm text-film-600 sm:grid-cols-3">
      <p class="flex items-center gap-2"><span class="step-index">01</span> 原尺寸画质输出</p>
      <p class="flex items-center gap-2"><span class="step-index">02</span> 左右画面独立旋转</p>
      <p class="flex items-center gap-2"><span class="step-index">03</span> 整卷 ZIP 批量下载</p>
    </div>
  </main>
</template>

<style scoped>
.drop-zone::before,
.drop-zone::after {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  content: '';
  background: linear-gradient(transparent 8%, rgb(120 97 67 / 18%) 8% 92%, transparent 92%);
}

.drop-zone::before {
  left: 33.333%;
}

.drop-zone::after {
  right: 33.333%;
}

@media (max-width: 639px) {
  .drop-zone::before,
  .drop-zone::after {
    display: none;
  }
}

.step-index {
  display: inline-grid;
  width: 28px;
  height: 22px;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgb(71 54 35 / 16%);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 9px;
}
</style>
