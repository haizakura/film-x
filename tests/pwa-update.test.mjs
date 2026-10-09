import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { MessageChannel } from 'node:worker_threads'

const source = readFileSync(new URL('../public/pwa-update-guard.js', import.meta.url), 'utf8')
const scope = 'https://film.example/tools/'

const client = (idle, path = '', throws = false) => ({
  url: scope + path,
  postMessage(message, ports) {
    assert.equal(message.type, 'FILM_X_CHECK_IDLE')
    if (throws) throw new Error('Window closed')
    if (idle !== undefined) ports[0].postMessage({ idle })
    ports[0].close()
  }
})

const worker = (windows) => {
  let onMessage
  let activations = 0
  let scans = 0
  runInNewContext(source, {
    MessageChannel,
    setTimeout: (callback) => setTimeout(callback, 30),
    clearTimeout,
    self: {
      registration: { scope },
      clients: {
        async matchAll(options) {
          assert.equal(options.type, 'window')
          assert.equal(options.includeUncontrolled, true)
          scans += 1
          return windows
        }
      },
      skipWaiting: async () => {
        activations += 1
      },
      addEventListener: (type, callback) => {
        assert.equal(type, 'message')
        onMessage = callback
      }
    }
  })
  return {
    request(type = 'FILM_X_ACTIVATE_WHEN_IDLE') {
      let result
      onMessage({ data: { type }, waitUntil: (promise) => (result = promise) })
      return result
    },
    get activations() {
      return activations
    },
    get scans() {
      return scans
    }
  }
}

test('activates only after every in-scope window reports idle', async () => {
  const sw = worker([client(true), client(true, 'compose')])
  await sw.request()
  assert.equal(sw.activations, 1)
})

test('a busy window blocks activation from an idle window', async () => {
  const sw = worker([client(true), client(false, 'compose')])
  await sw.request()
  assert.equal(sw.activations, 0)
})

test('suspended or older windows fail closed when they do not respond', async () => {
  const sw = worker([client(undefined)])
  await sw.request()
  assert.equal(sw.activations, 0)
})

test('a closed window or invalid idle reply cannot authorize activation', async () => {
  await Promise.all(
    [client(true, '', true), client('true')].map(async (window) => {
      const sw = worker([window])
      await sw.request()
      assert.equal(sw.activations, 0)
    })
  )
})

test('other applications on the same origin do not block a subpath app', async () => {
  const otherApp = { ...client(false), url: 'https://film.example/other/' }
  const sw = worker([client(true), otherApp])
  await sw.request()
  assert.equal(sw.activations, 1)
})

test('rechecks after a blocked window becomes idle', async () => {
  const windows = [client(false)]
  const sw = worker(windows)
  await sw.request()
  windows[0] = client(true)
  await sw.request()
  assert.equal(sw.activations, 1)
})

test('coalesces simultaneous activation requests', async () => {
  const sw = worker([client(true)])
  const first = sw.request()
  sw.request()
  await first
  assert.equal(sw.activations, 1)
  assert.equal(sw.scans, 1)
})

test('does not lose an idle retry that arrives during a blocked handshake', async () => {
  const windows = [
    {
      ...client(false),
      postMessage(message, ports) {
        client(false).postMessage(message, ports)
        windows[0] = client(true)
      }
    }
  ]
  const sw = worker(windows)
  const first = sw.request()
  sw.request()
  await first
  assert.equal(sw.activations, 1)
  assert.equal(sw.scans, 2)
})

test('ignores unrelated service worker messages', () => {
  const sw = worker([client(true)])
  assert.equal(sw.request('OTHER_MESSAGE'), undefined)
  assert.equal(sw.activations, 0)
  assert.equal(sw.scans, 0)
})
