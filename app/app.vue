<template>
  <UApp>
    <div class="film-grain flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <FilmAppHeader />
      <NuxtPage :keepalive="{ max: 4 }" class="min-h-0 flex-1" />
      <FilmAppFooter />
    </div>
  </UApp>
</template>
