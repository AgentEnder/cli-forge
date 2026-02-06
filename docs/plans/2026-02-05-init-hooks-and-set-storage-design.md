# Init Hooks & Set-Based Storage Design

## Overview

Two related features that enable plugin-based CLI architectures and improve cross-file command typing in cli-forge:

1. **Init hooks**: A new lifecycle phase enabling dynamic command registration from config-loaded plugins
2. **Set-based storage**: Idempotent registration of options, middleware, and commands to support shared composable builders across parent and child CLIs

---

## Feature 1: Init Hooks (Two-Pass Parsing)

### Problem

Plugins loaded from a configuration file need to register commands with the CLI, but the config file path (`--config`) isn't available until after parsing — at which point the command chain is already resolved. Middleware runs after parsing, so it's too late to register new commands there.

The chicken-and-egg problem:

1. Need to parse `--config` to know which config file to load
2. Need to load the config file to discover plugins
3. Need plugins loaded to register their commands
4. Need commands registered before parsing can resolve them

### Solution

A new `.init()` lifecycle hook that introduces a two-pass parse within `forge()`:

```
forge(argv)
  ├─ Pass 1: shallow parse (options only, skip command resolution)
  │   └─ Only runs if init hooks are registered
  ├─ Init hooks run sequentially with partial args + CLI reference
  │   └─ Can call cli.command(), cli.option(), cli.middleware(), etc.
  ├─ Pass 2: full parse (current behavior — unmatchedParser, validation, etc.)
  ├─ Middleware
  └─ Handler
```

### API

```ts
import { cli } from 'cli-forge';

cli('my-app')
  .option('config', { type: 'string' })
  .init(async (args, cli) => {
    const config = await loadConfig(args.config);
    cli.commands(...config.plugins); // plugins: Array<CLI>
  })
  .forge();
```

### Behavior

- **Pass 1 is conditional**: If no `.init()` hooks are registered, `forge()` goes straight to the current parse path. Zero overhead for existing users.
- **Pass 1 is shallow**: Uses the parser with command resolution disabled — unmatched args are silently ignored, no validation runs. Only extracts values for currently-registered options.
- **Multiple init hooks**: Run sequentially in registration order. All share the same pass 1 result.
- **Init hooks are async**: The callback receives `(args, cli)` where `args` is the partial parse result and `cli` is the current CLI instance for mutation.
- **Pass 2 is unchanged**: After all init hooks complete, the existing `this.parser.parse(args)` runs with the full command set available.

### Implementation Notes

#### Pass 1: Shallow Parse

The parser needs a mode that:
- Resolves registered options (flags, positionals with known keys)
- Skips the `unmatchedParser` callback (no command chain resolution)
- Skips validation (`required`, `choices`, `validate`, `conflicts`, `implies`, `strict`)
- Applies env vars, config files, and defaults as normal (so `--config` can come from env)

This could be implemented as:
- A new `parse()` option: `this.parser.parse(args, { shallow: true })`
- Or a separate method: `this.parser.shallowParse(args)`

#### Changes to `forge()`

```ts
forge = (args: string[] = hideBin(process.argv)) =>
  this.withErrorHandlers(async () => {
    // NEW: Init phase (only if hooks registered)
    if (this.registeredInitHooks.length > 0) {
      const partialArgs = this.parser.parse(args, { shallow: true });
      for (const hook of this.registeredInitHooks) {
        await hook(partialArgs, this);
      }
    }

    // EXISTING: Full parse (unchanged)
    let argv, validationFailedError;
    try {
      argv = this.parser.parse(args);
    } catch (e) { /* ... existing error handling ... */ }

    // ... rest of forge() unchanged ...
  });
```

#### Changes to `InternalCLI`

- Add `registeredInitHooks: Array<(args: TArgs, cli: CLI<TArgs>) => Promise<void>>` field
- Add `.init()` method that pushes to `registeredInitHooks`

#### Typing

The `.init()` callback receives `args` typed as `TArgs` at the point in the builder chain where `.init()` is called. The `cli` parameter is also typed as `CLI<TArgs>`. This means:

```ts
cli('app')
  .option('config', { type: 'string' })
  // args: { config: string }, cli: CLI<{ config: string }>
  .init(async (args, cli) => {
    args.config; // ✓ string
    cli.command(...); // ✓ mutates CLI
  })
```

Since init hooks mutate the CLI dynamically (adding plugin commands), the types added by init cannot be statically inferred. This is an acceptable trade-off for a plugin system — statically-registered options and commands remain fully typed.

---

## Feature 2: Set-Based Storage for Idempotent Registration

### Problem

When child commands are defined in separate files, parent args aren't visible in the child's handler types (TypeScript limitation: generic type parameters resolve at the constraint bound in function bodies, not at the call site).

The natural fix — re-applying shared composable builders to both parent and child — causes duplicate middleware execution, duplicate commands, etc., because the internal storage uses arrays and plain objects.

### Solution

Change the internal storage for middleware to use set-like structures where duplicate registration is a no-op. Options and commands are already keyed by name and are naturally idempotent.

### What Changes

| Storage | Current | New | Dedup Key |
|---------|---------|-----|-----------|
| Options | Map by name | Map by name | Name (already idempotent) |
| Commands | Record by name | Record by name | Name (already idempotent) |
| Middleware | `Array<Function>` (push) | `Set<Function>` | Reference equality |

### Middleware Reference Stability via Capture-and-Replay

For Set-based dedup to work, middleware functions must have stable references. Rather than requiring users to manually extract middleware to named constants, `makeComposableBuilder` uses a **capture-and-replay** strategy:

1. When `makeComposableBuilder(fn)` is called, `fn` runs **once** against a recording Proxy
2. The Proxy captures every method call and its arguments (including inline middleware closures)
3. The returned composable builder function **replays** those captured operations on any CLI it receives

Since the builder function runs only once, inline closures are created once and reused across every application:

```ts
// Inline middleware works — the closure is captured once and replayed with
// the same reference on every subsequent application
const globalOptions = makeComposableBuilder((cmd) =>
  cmd.option('verbose', { type: 'boolean' })
    .middleware((args) => { console.log(args); return args; })  // stable ref
);
```

#### Implementation of `makeComposableBuilder` (capture-and-replay)

```ts
type RecordedOp = { method: string; args: any[] };

function createRecordingProxy(): { proxy: CLI; operations: RecordedOp[] } {
  const operations: RecordedOp[] = [];
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      return (...args: any[]) => {
        operations.push({ method: prop as string, args });
        return proxy; // maintain chaining
      };
    },
  };
  const proxy = new Proxy({}, handler) as CLI;
  return { proxy, operations };
}

function makeComposableBuilder(fn) {
  // Run builder once against recording proxy to capture operations
  const { proxy, operations } = createRecordingProxy();
  fn(proxy);

  // Return a function that replays captured operations on any CLI
  return (init) => {
    for (const op of operations) {
      init[op.method](...op.args);
    }
    return init;
  };
}
```

**Constraint**: Composable builders must be declarative (chaining `.option()`, `.middleware()`, `.command()`, etc.). Conditional logic based on CLI state (e.g., `if (cmd.getChildren()...)`) won't work against the recording proxy, since the proxy has no real state. This matches how composable builders are used in practice.

### Usage Pattern

```ts
// shared/global-options.ts
import { makeComposableBuilder } from 'cli-forge';

export const globalOptions = makeComposableBuilder((cmd) =>
  cmd.option('verbose', { type: 'boolean' })
    .middleware((args) => { /* inline is fine */ return args; })
);

// commands/list.ts
import { cli, chain } from 'cli-forge';
import { globalOptions } from '../shared/global-options';

export const list = chain(cli('list'), globalOptions)
  .option('format', { type: 'string' })
  .command('$0', {
    handler: (args) => {
      args.verbose; // ✓ typed via globalOptions
      args.format;  // ✓ typed locally
    },
  });

// app.ts
import { cli, chain } from 'cli-forge';
import { globalOptions } from './shared/global-options';
import { list } from './commands/list';

chain(cli('app'), globalOptions)
  .command(list)
  .forge();
```

Both parent and child apply `globalOptions`. At runtime, when they share a parser, the Set prevents duplicate middleware execution. Types flow naturally because both CLIs have `globalOptions` applied.

### Implementation Notes

#### Changes to `InternalCLI`

```ts
// Before
registeredMiddleware: Array<(args: any) => void> = [];

// After
registeredMiddleware: Set<(args: any) => void> = new Set();
```

The `.middleware()` method changes from `.push()` to `.add()`.

`runCommand()` iterates the Set (which preserves insertion order in JavaScript) instead of the array.

#### Changes to `ArgvParser`

Verify that `.option()` with the same name is idempotent (overwrites or no-ops rather than erroring). Current behavior should be checked — it may already be idempotent since options are stored in a Map-like structure.

#### Middleware Execution Order

Sets preserve insertion order in JavaScript. When the same middleware reference is `.add()`ed to a Set that already contains it, the original insertion position is preserved. This means:

- First CLI to register the middleware determines its position in the execution order
- Subsequent registrations are no-ops (correct behavior)

---

## Combined Example: Plugins + Shared Options

```ts
// shared/global-options.ts
import { makeComposableBuilder } from 'cli-forge';

export const globalOptions = makeComposableBuilder((cmd) =>
  cmd.option('verbose', { type: 'boolean', alias: ['v'] })
    .option('config', { type: 'string', description: 'Path to config file' })
);

// plugins/test-plugin.ts (third-party plugin)
import { cli, chain } from 'cli-forge';
import { globalOptions } from '../shared/global-options';

export default chain(cli('test'), globalOptions)
  .option('watch', { type: 'boolean' })
  .command('$0', {
    handler: (args) => {
      if (args.verbose) console.log('Running tests...');
      // run tests, optionally in watch mode
    },
  });

// app.ts
import { cli, chain } from 'cli-forge';
import { globalOptions } from './shared/global-options';

chain(cli('my-app'), globalOptions)
  .init(async (args, app) => {
    if (args.config) {
      const config = await import(args.config);
      app.commands(...config.plugins); // plugins: Array<CLI>
    }
  })
  .forge();

// Usage:
//   my-app --config ./my-config.js test --watch -v
```

---

## Testing Strategy

### Init Hooks

- Unit test: `forge()` with no init hooks — verify no shallow parse occurs
- Unit test: `.init()` receives correct partial args (only registered options)
- Unit test: init hook can register commands that are resolved in pass 2
- Unit test: multiple init hooks run sequentially
- Unit test: async init hooks are awaited
- Unit test: init hook errors propagate to error handler
- E2E: plugin loading from config file with dynamic command registration
- Type test: init callback `args` parameter is correctly typed

### Set-Based Storage

- Unit test: duplicate `.middleware()` with same reference is called once
- Unit test: different middleware references are both called
- Unit test: middleware execution order preserved (insertion order)
- Unit test: duplicate `.option()` with same name is idempotent
- Unit test: composable builder applied to parent and child — middleware runs once
- Type test: `chain(cli('name'), composableBuilder)` correctly infers accumulated types

---

## Migration / Breaking Changes

### Init Hooks

- Purely additive. No breaking changes. Existing CLIs without `.init()` are unaffected.

### Set-Based Middleware Storage

- **Potentially breaking**: If any existing code intentionally registers the same middleware function reference multiple times (expecting it to run multiple times), this would change behavior. This is unlikely in practice but should be noted in release notes.
- Array methods used on `registeredMiddleware` (if any exist in the codebase) would need to change to Set methods.

### `makeComposableBuilder` Capture-and-Replay

- **Behavioral change**: The builder function passed to `makeComposableBuilder` now runs once at creation time (against a recording proxy) rather than on every application. This is transparent for declarative builders (the vast majority), but would break builders that rely on conditional logic based on the CLI's state at application time.
- **Non-breaking for types**: The return type signature is unchanged.
