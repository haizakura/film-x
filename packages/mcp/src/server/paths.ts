import { mkdir, readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import type { ExportFormat } from '~/types/image'
import { SUPPORTED_EXTENSIONS, baseName, outputExtension } from '~/utils/image'
import { UserError } from './errors'

export const expandHome = (value: string) => {
  if (value === '~') return homedir()
  if (value.startsWith('~/')) return path.join(homedir(), value.slice(2))
  return value
}

/** Absolute path or `~`/`~/…`; relative paths are ambiguous for a server with its own cwd. */
export const resolveUserPath = (value: string, what = 'path') => {
  const trimmed = value.trim()
  if (!trimmed) throw new UserError(`The ${what} is empty.`)
  const expanded = expandHome(trimmed)
  if (!path.isAbsolute(expanded)) {
    throw new UserError(
      `The ${what} "${value}" is relative. Use an absolute path or one starting with "~/".`
    )
  }
  return path.resolve(expanded)
}

export const extensionOf = (file: string) => path.extname(file).slice(1).toLowerCase()

export const isSupportedImagePath = (file: string) =>
  SUPPORTED_EXTENSIONS.includes(extensionOf(file))

const unsupportedMessage = (file: string) =>
  `"${file}" is not a supported image. Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}.`

export interface ResolvedInput {
  path: string
  name: string
}

export const resolveInput = async (value: string, what = 'image path'): Promise<ResolvedInput> => {
  const file = resolveUserPath(value, what)
  let info
  try {
    info = await stat(file)
  } catch {
    throw new UserError(`File not found: ${file}`)
  }
  if (!info.isFile()) throw new UserError(`Not a regular file: ${file}`)
  if (!isSupportedImagePath(file)) throw new UserError(unsupportedMessage(file))
  return { path: file, name: path.basename(file) }
}

export interface ListedImage {
  path: string
  name: string
  bytes: number
  modified: string
}

export const listImages = async (dir: string, recursive: boolean, limit: number) => {
  const root = resolveUserPath(dir, 'folder')
  let info
  try {
    info = await stat(root)
  } catch {
    throw new UserError(`Folder not found: ${root}`)
  }
  if (!info.isDirectory()) throw new UserError(`Not a folder: ${root}`)

  const entries = await readdir(root, { recursive, withFileTypes: true })
  const files = entries
    .map((entry) => ({ entry, full: path.join(entry.parentPath, entry.name) }))
    // Hidden files and anything inside a hidden folder are skipped.
    .filter(
      ({ entry, full }) =>
        entry.isFile() &&
        isSupportedImagePath(entry.name) &&
        !path
          .relative(root, full)
          .split(path.sep)
          .some((part) => part.startsWith('.'))
    )
    .map(({ full }) => full)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const listed = await Promise.all(
    files.slice(0, limit).map(async (full): Promise<ListedImage | undefined> => {
      try {
        const stats = await stat(full)
        return {
          path: full,
          name: path.basename(full),
          bytes: stats.size,
          modified: stats.mtime.toISOString()
        }
      } catch {
        // The file vanished between listing and stat; skip it.
        return undefined
      }
    })
  )
  return {
    dir: root,
    images: listed.filter((image) => image !== undefined),
    truncated: files.length > limit
  }
}

const FORMAT_EXTENSIONS: Record<ExportFormat, string[]> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp'],
  tiff: ['tif', 'tiff']
}

/** The export format an output extension stands for, if any. */
export const formatFromExtension = (file: string): ExportFormat | undefined =>
  (Object.keys(FORMAT_EXTENSIONS) as ExportFormat[]).find((format) =>
    FORMAT_EXTENSIONS[format].includes(extensionOf(file))
  )

export const defaultOutputName = (inputName: string, suffix: string, format: ExportFormat) =>
  `${baseName(inputName)}${suffix}.${outputExtension(format)}`

/** Explicit output file: absolute, with an extension that matches the chosen format. */
export const resolveExplicitOutput = (value: string, format: ExportFormat) => {
  const file = resolveUserPath(value, 'output path')
  if (!FORMAT_EXTENSIONS[format].includes(extensionOf(file))) {
    throw new UserError(
      `The output path "${file}" must end in .${FORMAT_EXTENSIONS[format].join(' or .')} for ${format} output.`
    )
  }
  return file
}

export const resolveOutputDir = (value: string) => resolveUserPath(value, 'output folder')

export const ensureDir = async (dir: string) => {
  try {
    await mkdir(dir, { recursive: true })
  } catch {
    throw new UserError(`Could not create the output folder: ${dir}`)
  }
}

export const pathExists = async (file: string) => {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

/**
 * Plans the output files of one job: none may be an input, none may repeat, and none may
 * already exist unless overwriting is allowed. Returns the paths in the order given.
 */
export const checkOutputs = async (
  outputs: string[],
  inputs: string[],
  overwrite: boolean,
  claimed: Set<string> = new Set()
) => {
  for (const file of outputs) {
    if (inputs.includes(file)) {
      throw new UserError(`Refusing to write over the input image: ${file}`)
    }
    if (claimed.has(file) || outputs.filter((other) => other === file).length > 1) {
      throw new UserError(`Another output in this call already targets ${file}.`)
    }
  }
  if (!overwrite) {
    const existing = await Promise.all(outputs.map(pathExists))
    const taken = outputs.find((_, index) => existing[index])
    if (taken) {
      throw new UserError(`Output already exists: ${taken}. Pass overwrite: true to replace it.`)
    }
  }
  for (const file of outputs) claimed.add(file)
  return outputs
}
