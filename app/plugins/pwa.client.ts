export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return

  const { hasWork, updateReady } = usePwaUpdate()
  const baseURL = useRuntimeConfig().app.baseURL
  let registration: ServiceWorkerRegistration | undefined
  let waitingWorker: ServiceWorker | undefined
  let hadController = Boolean(navigator.serviceWorker.controller)
  let reloadPending = false
  let checking = false

  const applyWhenIdle = () => {
    if (hasWork.value) return
    if (reloadPending) {
      window.location.reload()
      return
    }
    const waiting = registration?.waiting ?? waitingWorker
    if (waiting?.state === 'installed') {
      waiting.postMessage({ type: 'FILM_X_ACTIVATE_WHEN_IDLE' })
    }
  }

  const checkForUpdate = async () => {
    applyWhenIdle()
    if (checking) return
    checking = true
    try {
      if (
        registration &&
        !registration.active &&
        !registration.waiting &&
        !registration.installing
      ) {
        registration.removeEventListener('updatefound', onUpdateFound)
        registration = undefined
      }
      if (!registration) {
        // Reuse the installed registration even when this page was opened offline.
        const existing = await navigator.serviceWorker.getRegistration(baseURL)
        registration =
          existing?.scope === new URL(baseURL, window.location.origin).href
            ? existing
            : await navigator.serviceWorker.register(`${baseURL}sw.js`, {
                scope: baseURL,
                updateViaCache: 'none'
              })
        registration.addEventListener('updatefound', onUpdateFound)
        onUpdateFound()
        if (registration.waiting && registration.active) {
          waitingWorker = registration.waiting
          updateReady.value = true
          applyWhenIdle()
        }
      }
      if (!registration.installing && navigator.onLine) await registration.update()
    } catch {
      // Offline and failed deployments leave the current cached version usable.
    } finally {
      checking = false
    }
  }

  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'FILM_X_CHECK_IDLE') {
      updateReady.value = true
      const port = event.ports[0]
      port?.postMessage({ idle: !hasWork.value })
      port?.close()
    }
  }

  const onControllerChange = () => {
    waitingWorker = undefined
    if (hadController) {
      reloadPending = true
      updateReady.value = true
      applyWhenIdle()
    } else {
      updateReady.value = false
    }
    hadController = true
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void checkForUpdate()
  }

  const onUpdateFound = () => {
    const installing = registration?.installing
    if (!installing) return
    const onStateChange = () => {
      if (installing.state === 'installed' || installing.state === 'redundant') {
        installing.removeEventListener('statechange', onStateChange)
      }
      if (installing.state === 'installed' && registration?.active) {
        // The installed worker is usable before the waiting property reaches every window.
        waitingWorker = installing
        updateReady.value = true
        applyWhenIdle()
      }
    }
    installing.addEventListener('statechange', onStateChange)
  }

  // Listen before registering so the first install and other windows are handled too.
  navigator.serviceWorker.addEventListener('message', onMessage)
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

  const stopWatching = watch(hasWork, applyWhenIdle, { flush: 'sync' })
  const interval = window.setInterval(() => void checkForUpdate(), 60 * 60 * 1000)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('online', checkForUpdate)

  onNuxtReady(() => void checkForUpdate())

  nuxtApp.vueApp.onUnmount(() => {
    stopWatching()
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('online', checkForUpdate)
    navigator.serviceWorker.removeEventListener('message', onMessage)
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    registration?.removeEventListener('updatefound', onUpdateFound)
  })
})
