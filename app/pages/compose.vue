<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('meta.composerTitle'),
  description: () => t('meta.composerDescription')
})
</script>

<template>
  <FilmCompositionEditor />
</template>
