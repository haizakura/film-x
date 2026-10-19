import { registerHooks } from 'node:module'

const app = new URL('../app/', import.meta.url)

registerHooks({
  resolve: (specifier, context, next) =>
    next(
      specifier.startsWith('~/') ? new URL(`${specifier.slice(2)}.ts`, app).href : specifier,
      context
    )
})
