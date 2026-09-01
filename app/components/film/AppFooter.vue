<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="shrink-0 border-t border-film-900/10 bg-film-100/85">
    <p
      class="mx-auto flex h-10 max-w-420 items-center justify-center px-5 font-mono text-[10px] tracking-wide text-film-500"
    >
      © {{ currentYear }} HAIZAKURA · FILM X
      <span class="mx-2 text-film-300" aria-hidden="true">|</span>
      <a
        href="https://github.com/haizakura/film-x"
        target="_blank"
        rel="noopener noreferrer"
        class="transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        GitHub
      </a>
    </p>
  </footer>
</template>
