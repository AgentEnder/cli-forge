## The Logger

A standalone module that defines the logger and its level-filtering logic.
Keeping this out of the CLI module makes it trivial to unit test and reuse.

<%= file('logger.ts') %>

## Registering the Provider

`.provide('logger', { factory })` registers a factory that receives the
finalized, fully-parsed args. Because the factory is only called the first
time `inject('logger')` runs — during the handler phase, after all parsing,
middleware, and validation have completed — `args.logLevel` already reflects
whatever the user passed on the command line (or via environment variables,
config files, defaults, etc.).

<%= file('cli.ts') %>

## Using the Logger in a Handler

The handler lives in its own file and imports the CLI instance. This matters:
`getCommandContext(app)` uses `app` as a **type witness** — TypeScript infers
providers and args types from `typeof app`. If the handler were defined inline
inside the `.command()` call, `typeof app` would be circular and TypeScript
would fall back to `unknown`. Splitting the handler sidesteps that.

At runtime the `app` argument to `getCommandContext` is ignored; the live
context is read from AsyncLocalStorage set up by `forge()`.

<%= file('build.ts') %>

## Why This Pattern

Without DI, a logger typically becomes a module-level singleton that's
imported everywhere:

```ts
// logger.ts
export const logger = makeLogger(process.env.LOG_LEVEL ?? 'info');
```

That works until you want to:

- Override the level per-command invocation (tests, SDK usage, REPL)
- Make the level depend on parsed CLI args (which don't exist at import time)
- Mock the logger in unit tests without module-level surgery

With `.provide()`, the logger is scoped to each execution, reads args from
the actual parse, and can be swapped via `TestHarness.mockContext()` in tests.
