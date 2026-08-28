<template>
  <UApp>
    <div class="film-grain flex min-h-dvh flex-col">
      <FilmAppHeader />
      <NuxtPage :keepalive="{ max: 4 }" class="min-h-0 flex-1" />
      <FilmAppFooter />
    </div>
  </UApp>
</template>
