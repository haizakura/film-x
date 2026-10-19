import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import en from '../../../../i18n/locales/en.json'

/** An error whose message is safe and useful to show to the agent as is. */
export class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserError'
  }
}

const appErrors: Record<string, string> = en.errors

const MAX_MESSAGE_LENGTH = 400

/** Turn any failure into the text of a tool error; renderer `AppError` codes get the app's text. */
export const describeError = (error: unknown): string => {
  if (error instanceof UserError) return error.message
  const message = error instanceof Error ? error.message : String(error)
  const code = /errors\.([A-Za-z]+)/.exec(message)?.[1]
  const known = code ? appErrors[code] : undefined
  if (known) return `${known}.`
  const firstLine =
    message
      .split('\n')[0]
      ?.replace(/^[\w.]+: /, '')
      .trim() || 'unknown error'
  return `Rendering failed: ${firstLine.slice(0, MAX_MESSAGE_LENGTH)}`
}

export const toolError = (error: unknown): CallToolResult => ({
  isError: true,
  content: [{ type: 'text', text: describeError(error) }]
})
