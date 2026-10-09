// This script runs in the waiting service worker, before it replaces the current app.
let checkingClients = false
let checkAgain = false

const isClientIdle = (client) =>
  new Promise((resolve) => {
    const channel = new MessageChannel()
    const finish = (idle) => {
      clearTimeout(timeout)
      channel.port1.close()
      resolve(idle)
    }
    // Suspended windows and older clients without this protocol block activation.
    const timeout = setTimeout(() => finish(false), 2000)
    channel.port1.onmessage = (event) => finish(event.data?.idle === true)
    try {
      client.postMessage({ type: 'FILM_X_CHECK_IDLE' }, [channel.port2])
    } catch {
      finish(false)
    }
  })

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'FILM_X_ACTIVATE_WHEN_IDLE') return
  if (checkingClients) {
    checkAgain = true
    return
  }
  checkingClients = true
  event.waitUntil(
    (async () => {
      try {
        // A retry must finish the previous handshake before asking every window again.
        // oxlint-disable no-await-in-loop
        do {
          checkAgain = false
          const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
          const appWindows = windows.filter((client) =>
            client.url.startsWith(self.registration.scope)
          )
          const idle = await Promise.all(appWindows.map(isClientIdle))
          if (idle.every(Boolean)) {
            await self.skipWaiting()
            break
          }
        } while (checkAgain)
        // oxlint-enable no-await-in-loop
      } finally {
        checkingClients = false
      }
    })()
  )
})
