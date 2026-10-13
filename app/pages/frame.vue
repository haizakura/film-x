<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('meta.frameTitle'),
  description: () => t('meta.frameDescription')
})
</script>

<template>
  <FilmFrameEditor />
</template>
