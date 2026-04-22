---
title: Dependency Injection
description: Register providers with .provide() and inject them into handlers via getCommandContext()
nav:
  order: 9
---

# Dependency injection

CLI Forge ships a small dependency-injection layer so command handlers can access shared services — loggers, database clients, API clients, config objects — without threading them through function calls or reaching for module-level singletons.

The full working example lives in [`examples/di-logger`](/examples/di-logger). This guide explains the underlying model and the subtleties you should know about before using it on a real CLI.

## The model

Two public APIs:

- **`.provide(key, configOrValue)`** — registers a provider on a CLI or subcommand. Values are injected by key.
- **`getCommandContext(cli)`** — reads the active command context from inside a handler. Returns `{ args, commandChain, inject, getChildContext }`.

Providers come in three flavors:

| Form | Signature | When the factory runs | Good for |
|---|---|---|---|
| **Eager value** | `.provide('db', dbInstance)` | Never — the value is stored as-is | Pre-built objects, test doubles |
| **Execution scope** | `.provide('logger', { factory: (args) => ... })` | Once per `forge()` or `sdk()` call, lazily on first inject | Services that depend on parsed args |
| **Global** | `.provide('pool', { factory: () => ..., lifetime: 'global' })` | Once per process, cached permanently | Expensive singletons with no args dependency |

Factories are invoked lazily when `inject()` is called inside a handler, so they always see the final, fully-parsed args — not the half-parsed state you'd get during middleware or init hooks.

## Handlers must live in their own module

To get typed `inject()` calls, `getCommandContext` needs the CLI instance as a type witness:

```typescript
const ctx = getCommandContext(app);
const logger = ctx.inject('logger'); // typed as Logger, not unknown
```

If you try to use `getCommandContext(app)` inside a handler defined _inline_ in the `.command()` call, TypeScript can't resolve `typeof app` — the inference is circular because `app` is still being constructed. The handler's `inject` calls then fall back to `any`.

The fix is to put the handler in its own file:

```typescript
// cli.ts
import { cli } from 'cli-forge';
import { runBuild } from './build';

export const app = cli('builder')
  .option('logLevel', { type: 'string', default: 'info' })
  .provide('logger', { factory: (args) => makeLogger(args.logLevel) })
  .command('build', { handler: runBuild });
```

```typescript
// build.ts
import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export function runBuild() {
  const log = getCommandContext(app).inject('logger'); // typed
  log.info('building');
}
```

By the time `build.ts` is type-checked, `typeof app` is fully resolved and the provider types flow through cleanly.

## Child commands can override parent providers

Re-providing a key on a subcommand shadows the parent's registration — both at runtime and in the types:

```typescript
const app = cli('app')
  .provide('db', prodDb)
  .command('test', {
    builder: (cmd) => cmd.provide('db', testDb), // shadows parent's `db`
    handler: runTest, // sees `testDb` when it inject()s `'db'`
  });
```

Providers added on ancestors are still visible from the child's context — only the conflicting key is overridden.

## Reaching a subcommand's typed context

You have two ways to get a `CommandContext` typed to a subcommand's args and providers. Pick based on where the subcommand's providers live.

### Recommended — pass the subcommand CLI directly

If the subcommand **doesn't need to inherit providers from the root** — i.e. it defines its own, or only uses providers declared on itself — declare it as a standalone CLI, import that reference from the handler's module, and pass it straight to `getCommandContext`:

```typescript
// build.ts
import { cli } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';

export const build = cli('build')
  .option('target', { type: 'string', required: true })
  .provide('logger', { factory: () => makeLogger() })
  .handler(() => {
    const ctx = getCommandContext(build);
    ctx.inject('logger').info(`Target: ${ctx.args.target}`);
  });
```

```typescript
// cli.ts
import { cli } from 'cli-forge';
import { build } from './build';

export const app = cli('app').command(build);
```

This is the most ergonomic form:

- No `getChildContext` hop and no `app.getChildren().build` lookup.
- The handler module owns the subcommand reference, so there's no circular `typeof app` inference to work around.
- `ctx.args` and `ctx.inject()` are fully typed by `build`'s own declarations.
- Runtime validation still fires because `build.commandId` is on the active `commandIdChain` whenever `build` is the running command.

Reach for this pattern by default when you're designing a subcommand that manages its own services.

### When the subcommand inherits providers from the root

The standalone form has one type-level limitation: a standalone `cli('build', ...)` has `TParent = undefined`, so its tracked type doesn't include providers declared on whichever parent eventually composes it. If `build`'s handler needs to `inject()` a provider that lives on `app`, the standalone reference won't carry that type.

Two ways to handle that case:

**(a)** Access the root's providers via the root context and narrow to the child with `getChildContext`:

```typescript
// build.ts
import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export function runBuild() {
  const rootCtx = getCommandContext(app);
  const buildCtx = rootCtx.getChildContext('build');
  rootCtx.inject('logger').info(`Target: ${buildCtx.args.target}`);
}
```

`getChildContext('build')` returns a `CommandContext<buildArgs, ...>` so `buildCtx.args.target` is typed. `rootCtx.inject('logger')` goes through the root's declared providers.

**(b)** Declare the subcommand inline inside `.command('name', { builder, handler })` and fetch the tracked instance via `app.getChildren()`. The inline form threads the parent's `TProviders` into the builder's `cmd` parameter, so the tracked child type *does* carry inherited providers:

```typescript
// cli.ts
export const app = cli('app')
  .provide('logger', makeLogger)
  .command('build', {
    builder: (cmd) => cmd.option('target', { type: 'string', required: true }),
    handler: runBuild,
  });
```

```typescript
// build.ts
import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export function runBuild() {
  const build = app.getChildren().build;   // tracked instance carries parent providers
  const ctx = getCommandContext(build);
  ctx.inject('logger').info(`Target: ${ctx.args.target}`);
}
```

Both (a) and (b) are runtime-safe — the `commandIdChain` accepts the root, any ancestor, and the running command. The choice is purely about which type surface is more ergonomic for your handler.

### Quick decision guide

| Subcommand shape | Preferred handler pattern |
|---|---|
| Defines its own providers, doesn't need root's | Standalone `cli('sub')`, `getCommandContext(sub)` — **most ergonomic** |
| Needs root-inherited providers | `getCommandContext(app).getChildContext('sub')` or inline `.command('sub', { ... })` + `app.getChildren().sub` |

### Runtime validation

Both forms use the CLI instance as a **runtime** check, not just a type witness. Every `InternalCLI` is stamped with a process-unique `commandId` at construction. When `forge()` builds the execution context, it records the id of every command from the root down to the currently-running one. `getCommandContext(cli)` throws if `cli.commandId` isn't on that chain — so importing the wrong CLI or passing an unrelated app produces a descriptive error instead of silently returning the wrong providers. `getChildContext(name)` does the equivalent check against the command-name chain.

Any command on the active chain is a valid reference: the root app, the running subcommand itself, and any ancestor in between. A sibling that wasn't reached, or a CLI from a different app entirely, will throw.

### The root context's `args` type is a subset

The root `CommandContext.args` type reflects only options defined at the root level. When reached via a subcommand, the underlying args object at runtime also contains the subcommand's options, but they're not visible through `rootCtx.args`. Use either pattern above to read subcommand-level options with the correct types — `rootCtx.getChildContext('sub').args` or `getCommandContext(subCli).args`.

### The no-instance overload is not runtime-safe

`getCommandContext<T>()` with an explicit type parameter but no instance is supported as an escape hatch for cases where you can't get a live CLI reference from the handler's module. **It has no runtime validation** — `T` is accepted as-is, so a mismatched type parameter will silently produce a context typed for a CLI that isn't actually running. Prefer passing the CLI instance whenever feasible.

## Testing providers

The `TestHarness` exposes two APIs for DI tests. Pick `runWithMockedContext` for anything that crosses an `await`:

```typescript
import { TestHarness } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';
import { afterEach, it, expect } from 'vitest';
import { app } from './cli';

afterEach(() => TestHarness.clearMockedContexts());

it('uses the mocked logger', async () => {
  const calls: string[] = [];
  const mockLogger = { info: (msg: string) => calls.push(msg) };

  await TestHarness.runWithMockedContext(
    app,
    {
      args: { logLevel: 'info' },
      providers: { logger: mockLogger },
    },
    async () => {
      await runBuild();
    }
  );

  expect(calls).toContain('Building target: web');
});
```

`runWithMockedContext` scopes the context via `AsyncLocalStorage.run()`, so the mock survives `await` points inside `fn` and is torn down when `fn` resolves (or throws).

`mockContext` is a simpler setup/teardown variant for synchronous tests:

```typescript
it('resolves provider', () => {
  const cleanup = TestHarness.mockContext(app, {
    providers: { db: mockDb },
  });

  expect(getCommandContext(app).inject('db')).toBe(mockDb);
  cleanup();
});
```

Both variants accept eager values _or_ `{ factory }` configs — mocked factories run lazily and receive the mocked `args`, mirroring how real `.provide()` calls work.

### Global providers and test isolation

Providers registered with `lifetime: 'global'` are cached permanently at the module level so they only run once per process. That's the right behavior in production, but it leaks between tests. `TestHarness.clearMockedContexts()` automatically calls `resetGlobalProviders()` for you, so the standard `afterEach(() => TestHarness.clearMockedContexts())` pattern is enough.

If you need to reset the global cache mid-test, both `TestHarness.resetGlobalProviders()` and the raw `resetGlobalProviders` export (from `cli-forge` or `cli-forge/context`) are available.

## Dependency injection and the browser runtime

The Node build uses `AsyncLocalStorage` to scope each `forge()` / `sdk()` execution to its own context — concurrent invocations don't leak providers between each other.

The browser build can't use `AsyncLocalStorage`; it falls back to a simple last-set-wins global store. That's correct for the common case (one CLI running at a time in a playground) but it can't isolate overlapping executions. If two `forge()` calls are in flight at once in the same browser tab — for example, an interactive shell that triggers another invocation before the first resolves — one's providers may be visible inside the other.

The browser build emits a one-shot `console.warn` the first time it detects concurrent `run()` calls, so misuse fails loudly. If you need true isolation in a browser context, sequence your invocations explicitly (`await` the first before starting the second).
