import assert from 'node:assert/strict'
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import { hasLocalSite, startStaticSite } from './static-site.mjs'

const server = fileURLToPath(new URL('../dist/server.mjs', import.meta.url))
const sampleDir = fileURLToPath(new URL('../../../sample/', import.meta.url))
const MAX_PREVIEW_BYTES = 1024 * 1024
// Full-size TIFF scans take a while to decode in the headless browser.
const CALL_OPTIONS = { timeout: 300_000 }

const findSample = () => {
  if (process.env.FILM_X_SAMPLE) return process.env.FILM_X_SAMPLE
  if (!existsSync(sampleDir)) return undefined
  const name = readdirSync(sampleDir)
    .sort()
    .find((file) => /\.(tiff?|jpe?g|png|webp)$/i.test(file))
  return name && join(sampleDir, name)
}

const sample = findSample()
const externalSite = process.env.FILM_X_SITE_URL?.trim()
const skip = !existsSync(server)
  ? 'run `pnpm mcp:build` first'
  : !sample
    ? 'no sample image (set FILM_X_SAMPLE)'
    : !externalSite && !hasLocalSite
      ? 'no renderer site: run `pnpm generate` or set FILM_X_SITE_URL'
      : false

let staticSite

let client
let workDir
let input

const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args }, undefined, CALL_OPTIONS)
  const text = result.content.find((block) => block.type === 'text')?.text ?? ''
  const image = result.content.find((block) => block.type === 'image')
  return { result, text, json: result.isError ? undefined : JSON.parse(text), image }
}

/** Long side of a "WIDTHxHEIGHT" size string. */
const longSide = (size) => Math.max(...size.split('x').map(Number))

const assertPreview = (image) => {
  assert.ok(image, 'preview image block')
  assert.equal(image.mimeType, 'image/jpeg')
  assert.ok(Buffer.from(image.data, 'base64').byteLength < MAX_PREVIEW_BYTES)
}

before(async () => {
  if (skip) return
  workDir = mkdtempSync(join(tmpdir(), 'film-x-mcp-'))
  input = join(workDir, `scan${sample.slice(sample.lastIndexOf('.'))}`)
  copyFileSync(sample, input)
  let siteUrl = externalSite
  if (!siteUrl) {
    staticSite = await startStaticSite()
    siteUrl = `http://127.0.0.1:${staticSite.address().port}/`
  }
  client = new Client({ name: 'film-x-test', version: '0.0.0' })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [server],
      stderr: 'inherit',
      env: { ...process.env, FILM_X_SITE_URL: siteUrl }
    })
  )
})

after(async () => {
  await client?.close()
  staticSite?.close()
  if (workDir) rmSync(workDir, { recursive: true, force: true })
})

test('lists the Film X tools', { skip }, async () => {
  const { tools } = await client.listTools()
  const names = tools.map((tool) => tool.name).sort()
  assert.deepEqual(names, [
    'compose_film',
    'frame_photo',
    'frame_preset',
    'list_images',
    'read_photo_exif',
    'split_half_frame'
  ])
})

test('splits a scan, then refuses to overwrite it', { skip }, async () => {
  const first = await call('split_half_frame', { paths: [input], outputDir: workDir })
  assert.ok(!first.result.isError, first.text)
  for (const suffix of ['_01.jpg', '_02.jpg']) {
    assert.ok(statSync(join(workDir, `scan${suffix}`)).size > 0)
  }
  assertPreview(first.image)

  const second = await call('split_half_frame', { paths: [input], outputDir: workDir })
  assert.ok(second.result.isError || /exist/i.test(second.text), second.text)
})

test('refuses to overwrite an input reached through a symlink', { skip }, async () => {
  const link = join(workDir, 'link')
  symlinkSync(workDir, link, 'dir')
  const photo = join(workDir, 'scan_01.jpg')
  const bytes = readFileSync(photo)
  const framed = await call('frame_photo', {
    path: photo,
    output: join(link, 'scan_01.jpg'),
    overwrite: true
  })
  assert.ok(framed.result.isError, framed.text)
  assert.match(framed.text, /input/i)
  assert.deepEqual(readFileSync(photo), bytes)
})

test('composes two frames', { skip }, async () => {
  const output = join(workDir, 'layout.png')
  const { result, text, json, image } = await call('compose_film', {
    paths: [join(workDir, 'scan_01.jpg'), join(workDir, 'scan_02.jpg')],
    sprocket: { enabled: true, text: 'FILM X 400' },
    filmTexture: true,
    format: 'png',
    output
  })
  assert.ok(!result.isError, text)
  assert.ok(statSync(output).size > 0)
  assert.ok(longSide(json.size) <= 8000 + 240 * 2)
  assert.equal(json.settings.frameCount, 2)
  assert.equal(json.settings.sprocket.text, 'FILM X 400')
  assertPreview(image)
})

test('frames a photo and round-trips its preset code', { skip }, async () => {
  const output = join(workDir, 'framed.jpg')
  const framed = await call('frame_photo', {
    path: join(workDir, 'scan_01.jpg'),
    template: 'bar',
    brand: 'leica',
    fields: { camera: 'Leica M6', film: 'Portra 400' },
    outputLongSide: 2000,
    output
  })
  assert.ok(!framed.result.isError, framed.text)
  assert.ok(statSync(output).size > 0)
  assert.equal(longSide(framed.json.size), 2000)
  assert.equal(framed.json.fields.camera, 'Leica M6')
  assert.match(framed.json.presetCode, /^FXF1\./)
  assertPreview(framed.image)

  const preset = await call('frame_preset', { preset: framed.json.presetCode })
  assert.ok(!preset.result.isError, preset.text)
  assert.equal(preset.json.settings.template, 'bar')
  assert.equal(preset.json.settings.logo.brand, 'leica')

  // WebP must come from the site's encoder, not JPEG bytes under a .webp name.
  const webp = join(workDir, 'framed.webp')
  const framedWebp = await call('frame_photo', {
    path: join(workDir, 'scan_01.jpg'),
    outputLongSide: 1000,
    output: webp
  })
  assert.ok(!framedWebp.result.isError, framedWebp.text)
  assert.equal(framedWebp.json.format, 'webp')
  assert.equal(readFileSync(webp).subarray(8, 12).toString('latin1'), 'WEBP')
})

test('reads EXIF and lists images', { skip }, async () => {
  const exif = await call('read_photo_exif', { path: input })
  assert.ok(!exif.result.isError, exif.text)
  assert.equal(typeof exif.json.fields, 'object')

  const listed = await call('list_images', { dir: workDir })
  assert.ok(!listed.result.isError, listed.text)
  assert.ok(listed.text.includes('scan_01.jpg'))
})
