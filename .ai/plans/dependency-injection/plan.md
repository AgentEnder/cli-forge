# Feature Spec: Runtime Context & Providers for CLI Forge

## Context

Originated from a conversation about built-in logging. The real pain points:

1. **Accessing normalized args anywhere** without threading through every function
2. **Accessing config read/write** without coupling to the CLI instance
3. **Initializing services from parsed args** and accessing them without threading

## Evaluation

| Idea | Verdict | Rationale |
|------|---------|-----------|
| Built-in logging | **Nay** | Application-specific. The real problem is context/service access. |
| Full DI (Angular/Effect modules) | **Nay** | Module system + decorators + lifecycle tiers is too much paradigm. |
| Lightweight DI via `.provide()` + `getCommandContext()` | **Yay** | Small API, type-safe, doesn't require controlling the runtime. |

Lightweight DI works here because:

- Linear lifecycle: parse -> middleware -> handler -> done
- Only two lifetimes: global singleton and per-execution
- No circular dependencies - providers are independent values/factories
- Middleware is the natural initialization point (has access to parsed args)

---

## Design

### Prerequisite: `AnyCLI` Type Alias

Before adding a 5th generic, clean up 30+ scattered `CLI<any, any, any, any>` occurrences.

```typescript
// public-api.ts - exported for consumers
export type AnyCLI = CLI<ParsedArgs, any, any, any, any>;

// Deprecate UnknownCLI (line 1107) in favor of AnyCLI
/** @deprecated Use AnyCLI instead */
export type UnknownCLI = AnyCLI;

// internal-cli.ts - internal use only
type AnyInternalCLI = InternalCLI<ParsedArgs, any, any, any, any>;
```

Occurrences to replace:

- `internal-cli.ts`: ~17 `InternalCLI<any, any, any, any>` -> `AnyInternalCLI`
- `resolve-completions.ts`: ~11
- `documentation.ts`: ~1
- `format-help.ts`: ~1
- `composable-builder.ts`: ~1

---

### Context Propagation: AsyncLocalStorage

Context is propagated via `AsyncLocalStorage` from `node:async_hooks`. This works across all target runtimes:

| Runtime | Support |
|---------|---------|
| Node.js 16.4+ | Stable, V8-native in 22+ |
| Bun | Fully supported |
| Deno | Works for direct `await` chains (sufficient for CLI execution flow) |
| Cloudflare Workers | Supported with `nodejs_compat` flag |
| Browsers | Fallback stub (see below) |

**Browser fallback**: Uses the existing `browserAlias` pattern in `tsdown.config.mjs`. The browser build swaps in a simple last-set-wins store. Since browser CLI execution is inherently single-threaded/sequential, this is correct for that environment.

```typescript
// src/lib/async-context.ts (Node/Bun/Deno)
import { AsyncLocalStorage } from 'node:async_hooks';
export const contextStorage = new AsyncLocalStorage<ForgeContextData>();

// src/browser/async-context.ts (Browser fallback)
// Simple last-set-wins store — correct for single-execution browser usage
export const contextStorage = {
  run<T>(store: ForgeContextData, fn: () => T): T {
    currentStore = store;
    try { return fn(); }
    finally { currentStore = undefined; }
  },
  getStore(): ForgeContextData | undefined {
    return currentStore;
  },
};
let currentStore: ForgeContextData | undefined;
```

**Why ALS works here**: `forge()` and `sdk()` are both async flows built on direct `await` chains. ALS propagates correctly through `await`. The Deno caveat (context lost in `setTimeout`/`queueMicrotask`) doesn't apply since cli-forge's execution flow doesn't use timer-based propagation.

**Why not a module-level Map**: SDK mode clones the command tree per invocation (`targetCmd.clone()`). Identity-based lookup on the original CLI instance can't find the clone's context, and concurrent SDK calls would overwrite each other in a shared map. ALS scopes context to the execution's async chain, solving both problems.

---

### No Tokens - String Literal Keys

Plain string literal keys instead of token objects. Since `TProviders` accumulates the type map on the CLI generic (`{ logger: Logger, api: ApiClient }`), `inject()` just needs `keyof TProviders` - the type safety comes from the context, not from a separate token object.

```typescript
app.provide('logger', new Logger());
ctx.inject('logger'); // returns Logger, compile-time checked
```

---

### `TProviders` Generic on CLI

Add a 5th generic that accumulates a `{ [key]: type }` map:

```typescript
export interface CLI<
  TArgs extends ParsedArgs = ParsedArgs,
  THandlerReturn = void,
  TChildren = {},
  TParent = undefined,
  TProviders = {}       // NEW
> {
```

Every method that returns `CLI<...>` passes `TProviders` through unchanged, except `.provide()` which extends it.

#### Recursive Provider Resolution

To support parent provider inheritance, utility types walk the `TParent` chain:

```typescript
/** Recursively gather all providers from a CLI and its ancestors */
type ProvidersOf<T> = T extends CLI<any, any, any, infer Parent, infer Providers>
  ? (Parent extends AnyCLI ? ProvidersOf<Parent> & Providers : Providers)
  : {};

/** Get providers from the parent chain only (excludes own providers) */
type ParentProviders<T> = T extends CLI<any, any, any, infer Parent, any>
  ? (Parent extends AnyCLI ? ProvidersOf<Parent> : {})
  : {};
```

These are used by `getCommandContext` so that calling it on any CLI (including a subcommand) automatically includes ancestor providers in the context type. And by `getChildContext` to merge parent + child providers.

#### Duplicate Key Handling

**Same-level duplicates are forbidden.** Calling `.provide('logger', ...)` twice on the same CLI is a type error:

```typescript
app
  .provide('logger', new Logger())
  .provide('logger', new OtherLogger()); // TYPE ERROR — 'logger' already in TProviders
```

Enforced via conditional type on `TName`:

```typescript
provide<TName extends string, T>(
  key: TName & (TName extends keyof TProviders ? never : TName),
  ...
): ...
```

**Child-shadows-parent is allowed.** A child command can provide a key that a parent already provides, overriding it for that subtree:

```typescript
app
  .provide('logger', new Logger({ level: 'info' }))
  .command('debug', {
    builder: (cmd) => cmd
      .provide('logger', new Logger({ level: 'debug' })), // OK — child scope override
  });
```

This matches standard DI scoping semantics.

---

### `.provide()` on CLI

```typescript
interface CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
  // Eager value
  provide<TName extends string, T>(
    key: TName,
    value: T,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // Factory with lifetime
  provide<TName extends string, T>(
    key: TName,
    config: ProviderConfig<T, TArgs>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;
}

interface ProviderConfig<T, TArgs = any> {
  factory: ((args: TArgs) => T) | (() => T);
  /** Default: 'executionScope' */
  lifetime?: 'global' | 'executionScope';
}
```

**TArgs-aware factories**: Because `.provide()` is in the fluent chain, `executionScope` factories receive the current TArgs:

```typescript
cli('app')
  .option('logLevel', { type: 'string', default: 'info' })

  // TArgs = { logLevel: string }
  .provide('logger', {
    factory: (args) => new Logger(args.logLevel), // args.logLevel typed!
    // lifetime defaults to 'executionScope'
  })

  .option('apiUrl', { type: 'string', required: true })

  // TArgs = { logLevel: string, apiUrl: string }
  .provide('api', {
    factory: (args) => new ApiClient(args.apiUrl), // args.apiUrl typed!
  });
```

**Global factories do NOT receive args**: Since global factories run once and cache permanently, binding them to a specific execution's args is unsound. Global factories must be arg-independent:

```typescript
.provide('pool', {
  factory: () => new ConnectionPool(),  // no args parameter
  lifetime: 'global',
})
```

**Overload resolution**: TypeScript needs to distinguish `provide('key', value)` from `provide('key', { factory })`. The factory overload matches when the second arg has a `factory` property. The eager overload matches everything else. Order: factory overload first (more specific), then eager value fallback.

#### Lifetime Semantics

| Lifetime | Scope | Factory Signature | Use Case |
|----------|-------|-------------------|----------|
| `global` | Module-level singleton | `() => T` | Expensive shared resources (DB pools, SDK clients) |
| `executionScope` | Per `forge()` / `sdk()` call | `(args: TArgs) => T` | Request-scoped services (loggers, per-run clients) |

- **Eager values** (no factory): Stored in the ALS context. Same object reference reused if CLI definition is reused, but accessibility is scoped to the execution.
- **`global` factory**: Called once on first `inject()` ever. Cached at module level permanently. No args — avoids binding to a single execution's arg values.
- **`executionScope` factory**: Called once per `forge()`/`sdk()` on first `inject()`. Cached in the ALS context store. Cleaned up when execution completes.

**Lazy by default**: Factories run on first `inject()`, not at `forge()` start. Avoids creating expensive resources for commands that don't use them.

**Provider execution is deferred to handler phase**: `inject()` is only available during and after handler execution. Calling `inject()` during middleware or init hooks throws:

```
Error: inject() is not available during middleware/init. Providers
are resolved during handler execution when args are finalized.
```

This prevents factories from caching values based on partially-parsed args during the discovery loop.

---

### `getCommandContext()` - Context Access

```typescript
import { getCommandContext } from 'cli-forge/context';

// Overload 1: Typed via CLI instance (T inferred)
const ctx = getCommandContext(app);

// Overload 2: Typed via explicit generic (no instance needed)
const ctx = getCommandContext<typeof app>();

ctx.args;              // typed as app's TArgs
ctx.inject('logger');  // typed as Logger, compile-time checked
ctx.getChildContext('deploy'); // typed as deploy's context
```

#### How It Works — AsyncLocalStorage

The CLI instance parameter is a **type-level witness** — it provides type information but is not used for runtime lookup:

```typescript
// Overload signatures
function getCommandContext<T extends AnyCLI>(cli: T): InferContextOfCommand<T>;
function getCommandContext<T extends AnyCLI>(): InferContextOfCommand<T>;

// Runtime: ignores cli argument, reads from ALS
function getCommandContext(cli?: AnyCLI): CommandContext<any, any, any> {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error(
      'No active execution context. Ensure this code runs during forge()/sdk() handler execution.'
    );
  }
  return store.context;
}
```

1. `forge(argv)` / `sdk()` wraps handler execution in `contextStorage.run(contextData, () => ...)`
2. Inside any code called during that execution, `getCommandContext()` reads from `contextStorage.getStore()`
3. ALS automatically scopes context to the async execution chain — concurrent SDK calls are isolated
4. Return type inferred from the passed CLI's generics (or explicit generic parameter)

**Why the CLI parameter is not validated at runtime**: The parameter exists solely to drive TypeScript's type inference. Validating it would require storing the CLI identity in the ALS context and comparing, but this adds runtime cost for no benefit — if you pass the wrong CLI type, you get wrong types, which the compiler would have caught if the code is well-typed.

#### `InferContextOfCommand` Type

```typescript
type InferContextOfCommand<T> = T extends CLI<infer A, any, infer C, any, any>
  ? CommandContext<A, ProvidersOf<T>, C>
  : never;
```

#### CommandContext Interface

```typescript
interface CommandContext<TArgs, TProviders, TChildren = {}> {
  /** Current parsed + middleware-transformed args (this command level's TArgs) */
  readonly args: TArgs;

  /** Resolved command path, e.g. ['deploy', 'staging'] */
  readonly commandChain: readonly string[];

  /**
   * Inject a provided value. Compile-time constrained to string keys
   * registered via .provide() on this CLI or any ancestor CLI.
   * Throws at runtime if key was not provided or factory fails.
   */
  inject<K extends string & keyof TProviders>(key: K): TProviders[K];

  /** Inject with fallback. Returns defaultValue if key not provided (no throw). */
  inject<K extends string & keyof TProviders>(
    key: K,
    defaultValue: TProviders[K],
  ): TProviders[K];

  /** Update configuration files (routes to existing parser config behavior) */
  updateConfig(values: Partial<TArgs>): Promise<void>;
  updateConfig(updater: ConfigUpdater<TArgs>): Promise<void>;

  /**
   * Navigate to a child command's typed context.
   * Throws if that child is not in the active command chain.
   * Merges parent providers with child providers for type-safe inheritance.
   */
  getChildContext<K extends string & keyof TChildren>(
    command: K,
  ): TChildren[K] extends CLI<infer A, any, infer GC, any, infer P>
    ? CommandContext<A, Omit<TProviders, keyof P> & P, GC>
    : never;
}
```

Note: `getChildContext` uses `Omit<TProviders, keyof P> & P` for child provider types, giving proper override semantics when a child shadows a parent provider.

#### Strict `inject()` - Compile-Time & Runtime Checking

**Compile-time**: `TProviders` accumulates as `{ logger: Logger, api: ApiClient }` and `inject()` constrains `K extends keyof TProviders`:

```typescript
const ctx = getCommandContext(app);
ctx.inject('logger'); // OK - 'logger' is in TProviders, returns Logger
ctx.inject('api');    // OK - 'api' is in TProviders, returns ApiClient
ctx.inject('random'); // TYPE ERROR - 'random' not in TProviders
```

**Runtime**: Even if type checking is bypassed (e.g. `as any`), `inject()` validates at runtime:

```typescript
ctx.inject('unknown');           // THROWS: "Provider 'unknown' not found. Registered: logger, api"
ctx.inject('unknown', fallback); // OK - returns fallback, no throw
```

The overload without `defaultValue` always throws for unregistered keys. The overload with `defaultValue` returns it silently.

#### `getChildContext()` - Why It Exists

With `ProvidersOf<T>` walking the parent chain, `getCommandContext(deploySubcommand)` **does** include ancestor providers in its type — if you have a reference to the child CLI instance and its `TParent` generic is correctly set.

However, `getChildContext` is still the primary navigation pattern because:

1. **You typically only have the root CLI reference** — child CLI instances are created inside builders and aren't exported
2. **It provides the child's `TArgs`** — the root context only has root args; `getChildContext` gives you the child command's args
3. **It validates the active command chain** at runtime — throws if `'deploy'` isn't the active command

```typescript
const app = cli('app')
  .option('verbose', { type: 'boolean' })
  .provide('logger', {
    factory: (a) => new Logger(a.verbose),
  })
  .command('deploy', {
    builder: (cmd) =>
      cmd
        .option('target', { type: 'string', required: true })
        .provide('deployClient', {
          factory: (a) => new DeployClient(a.target),
        }),
    handler: async () => {
      await runDeploy();
    },
  });

// In a deeply nested helper:
function runDeploy() {
  const rootCtx = getCommandContext(app);
  rootCtx.args.verbose; // OK - root arg

  const deployCtx = rootCtx.getChildContext('deploy');
  deployCtx.args.target;              // OK - DeployArgs includes target
  deployCtx.inject('deployClient');    // OK - deploy registered this
  deployCtx.inject('logger');          // OK - inherited from parent
  rootCtx.getChildContext('nonexistent'); // TYPE ERROR
}
```

**Runtime behavior**: `getChildContext('deploy')` **throws** if `'deploy'` is not in the active `commandChain`:

```
Error: getChildContext('deploy') called but 'deploy' is not in the active
command chain ['build']. The active command is 'build'.
```

#### Recommended Pattern: Context Helper Functions

To avoid repeating `getCommandContext(app).getChildContext('deploy')` everywhere, define thin helpers:

```typescript
// context-helpers.ts
import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export const getDeployContext = () => getCommandContext(app).getChildContext('deploy');
export const getBuildContext = () => getCommandContext(app).getChildContext('build');
```

```typescript
// deploy.ts - clean usage
import { getDeployContext } from './context-helpers';

export async function runDeploy() {
  const ctx = getDeployContext();
  const logger = ctx.inject('logger'); // inherited from parent
  const client = ctx.inject('deployClient');
  // ...
}
```

---

## Lifecycle

### Context Through the Execution Flow

```
forge(argv)
|
|  +- DISCOVERY LOOP ----------------------------------------+
|  |  Non-strict parse -> mergedArgs                         |
|  |  Middleware runs                                         |
|  |  Init hooks (inject() NOT available here)               |
|  |  Discover next subcommand -> loop or break              |
|  +---------------------------------------------------------+
|
|  Prompt resolution
|  Final strict parse -> argv
|
|  contextStorage.run(contextData, () => {     <- ALS scope begins
|    context.args = finalArgs
|    runCommand(argv)
|      Remaining middleware
|      context.args = final result
|      Handler executes                        <- inject() available here
|  })                                          <- ALS scope ends, cleanup
```

### When Factories Run

- **`executionScope`**: Factory called on first `inject()` within the handler phase of this `forge()`/`sdk()` call. Receives finalized `context.args`. Cached in ALS context store for the duration of the execution.
- **`global`**: Factory called on first `inject()` ever. No args parameter. Cached at module level permanently.
- **Eager values**: Stored in ALS context store at handler phase start. Always available during handler execution.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Interactive shell | Child process via `spawnSync()` -> fresh process -> fresh ALS context. No special handling. |
| SDK mode | Each `sdk()` proxy call clones the command tree and runs handler in its own `contextStorage.run()`. Concurrent calls are isolated by ALS. |
| TestHarness | Uses `mockContext()` to set up ALS context for testing (see Testing section). |
| Browser | Fallback stub provides `run()`/`getStore()` with last-set-wins semantics. Correct for single-execution browser usage. |
| Outside handler | `getCommandContext()` throws: `"No active execution context. Ensure this code runs during forge()/sdk() handler execution."` |
| Multiple CLIs | Each `forge()`/`sdk()` call creates its own ALS context. No collision. |
| Nested `forge()` same CLI | Each `contextStorage.run()` creates a new ALS scope. Inner execution sees its own context; outer resumes when inner completes. |

---

## Testing

### `TestHarness.mockContext()` - Context Mocking

`TestHarness.mockContext()` sets up an ALS context so `getCommandContext(cli)` returns the mocked context during tests. The ALS implementation detail is hidden from users — they see a simple setup/teardown pattern:

```typescript
import { TestHarness } from 'cli-forge';
import { app } from './cli';

// Setup — installs a mock ALS context internally
const cleanup = TestHarness.mockContext(app, {
  args: { logLevel: 'debug', apiUrl: 'http://test' },
  providers: {
    logger: mockLogger,
    api: mockApi,
  },
});

// Now any code that calls getCommandContext(app) gets the mocked context
await runDeploy();
expect(mockApi.post).toHaveBeenCalledWith('/deploy/production');

// Teardown
cleanup();

// or bulk cleanup in afterEach():
TestHarness.clearMockedContexts();
```

**How it works**: `mockContext()` enters an ALS context with the provided args and pre-resolved providers. `getCommandContext()` finds this context normally via `contextStorage.getStore()`. Returns a cleanup function that exits the ALS context.

### Integration testing with full execution

For tests that need the full parse -> middleware -> handler flow, `new TestHarness(cli)` works as before — `forge()` sets up the real ALS context:

```typescript
const harness = new TestHarness(app);
const result = await harness.parse(['deploy', '--target', 'production', '--apiUrl', 'http://test']);
// Handler ran with real provider factories, real ALS context
```

### API

```typescript
class TestHarness {
  // Existing API...

  /**
   * Set up a mocked execution context. getCommandContext() will return
   * a context with the given args and providers.
   * Returns a cleanup function that removes the mocked context.
   */
  static mockContext<TArgs, TProviders>(
    cli: CLI<TArgs, any, any, any, TProviders>,
    options: {
      args?: Partial<TArgs>;
      providers?: Partial<TProviders>;
      commandChain?: string[];
    },
  ): () => void;

  /** Clear all mocked contexts. Call in afterEach(). */
  static clearMockedContexts(): void;
}
```

---

## Full Example

```typescript
// cli.ts
import { cli } from 'cli-forge';

export const app = cli('deploy-tool')
  .option('logLevel', { type: 'string', default: 'info' })
  .option('apiUrl', { type: 'string', required: true })
  .provide('logger', {
    factory: (args) => createLogger(args.logLevel),
  })
  .provide('api', {
    factory: (args) => new ApiClient(args.apiUrl),
  })
  .command('deploy', {
    builder: (cmd) => cmd.option('target', { type: 'string', required: true }),
    handler: async () => {
      await runDeploy();
    },
  });

await app.forge();
```

```typescript
// deploy.ts
import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export async function runDeploy() {
  const rootCtx = getCommandContext(app);
  const deployCtx = rootCtx.getChildContext('deploy');

  const logger = rootCtx.inject('logger');
  const api = rootCtx.inject('api');
  const target = deployCtx.args.target;

  logger.info(`Deploying to ${target}...`);
  const result = await api.post(`/deploy/${target}`);

  if (result.ok) {
    logger.info('Deploy succeeded');
    await rootCtx.updateConfig({ lastDeploy: new Date().toISOString() });
  } else {
    logger.error(`Deploy failed: ${result.statusText}`);
  }
}
```

```typescript
// deploy.spec.ts
import { TestHarness } from 'cli-forge';
import { app } from './cli';
import { runDeploy } from './deploy';

it('deploys to production', async () => {
  const mockLogger = { info: jest.fn(), error: jest.fn() };
  const mockApi = { post: jest.fn().mockResolvedValue({ ok: true }) };

  const cleanup = TestHarness.mockContext(app, {
    args: { logLevel: 'info', apiUrl: 'http://test', target: 'production' },
    providers: { logger: mockLogger, api: mockApi },
    commandChain: ['deploy'],
  });

  await runDeploy();
  expect(mockApi.post).toHaveBeenCalledWith('/deploy/production');

  cleanup();
});
```

---

## Full API Surface

```typescript
// -- cli-forge (main entrypoint additions) --

interface ProviderConfig<T, TArgs = any> {
  factory: ((args: TArgs) => T) | (() => T);
  /** Default: 'executionScope' */
  lifetime?: 'global' | 'executionScope';
}

// Global lifetime enforces no-args factory
interface GlobalProviderConfig<T> {
  factory: () => T;
  lifetime: 'global';
}

export type AnyCLI = CLI<ParsedArgs, any, any, any, any>;

// CLI.provide() additions
interface CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders = {}> {
  // Eager value (rejects duplicate keys at same level)
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    value: T,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // Factory — executionScope (receives args)
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    config: ProviderConfig<T, TArgs>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // Factory — global (no args)
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    config: GlobalProviderConfig<T>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;
}

// -- cli-forge/context --

/** Infer the CommandContext type from a CLI type */
type InferContextOfCommand<T> = T extends CLI<infer A, any, infer C, any, any>
  ? CommandContext<A, ProvidersOf<T>, C>
  : never;

/** Recursively gather all providers from a CLI and its ancestors */
type ProvidersOf<T> = T extends CLI<any, any, any, infer Parent, infer Providers>
  ? (Parent extends AnyCLI ? ProvidersOf<Parent> & Providers : Providers)
  : {};

// Overload 1: Typed via CLI instance (T inferred from argument)
function getCommandContext<T extends AnyCLI>(cli: T): InferContextOfCommand<T>;
// Overload 2: Typed via explicit generic (no instance needed)
function getCommandContext<T extends AnyCLI>(): InferContextOfCommand<T>;

interface CommandContext<TArgs, TProviders, TChildren = {}> {
  readonly args: TArgs;
  readonly commandChain: readonly string[];

  inject<K extends string & keyof TProviders>(key: K): TProviders[K];
  inject<K extends string & keyof TProviders>(key: K, defaultValue: TProviders[K]): TProviders[K];

  updateConfig(values: Partial<TArgs>): Promise<void>;
  updateConfig(updater: ConfigUpdater<TArgs>): Promise<void>;

  getChildContext<K extends string & keyof TChildren>(
    command: K,
  ): TChildren[K] extends CLI<infer A, any, infer GC, any, infer P>
    ? CommandContext<A, Omit<TProviders, keyof P> & P, GC>
    : never;
}

// -- TestHarness additions (on existing class) --
class TestHarness {
  static mockContext<TArgs, TProviders>(
    cli: CLI<TArgs, any, any, any, TProviders>,
    options: {
      args?: Partial<TArgs>;
      providers?: Partial<TProviders>;
      commandChain?: string[];
    },
  ): () => void;

  static clearMockedContexts(): void;
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `packages/cli-forge/src/lib/public-api.ts` | Add `TProviders` to CLI, `.provide()`, `AnyCLI`, `ProviderConfig`, `GlobalProviderConfig`, deprecate `UnknownCLI` |
| `packages/cli-forge/src/lib/internal-cli.ts` | Add `TProviders` to InternalCLI, implement `.provide()`, wrap handler execution in `contextStorage.run()`, `AnyInternalCLI`, replace ~17 any casts |
| `packages/cli-forge/src/lib/async-context.ts` | **New**: Node/Bun/Deno AsyncLocalStorage wrapper, `ForgeContextData` type, `contextStorage` export |
| `packages/cli-forge/src/browser/async-context.ts` | **New**: Browser fallback stub with last-set-wins semantics |
| `packages/cli-forge/src/lib/context.ts` | **New**: `getCommandContext`, `CommandContext`, `InferContextOfCommand`, `ProvidersOf` |
| `packages/cli-forge/src/lib/test-harness.ts` | Add `mockContext`, `clearMockedContexts` static methods |
| `packages/cli-forge/src/lib/resolve-completions.ts` | Replace ~11 `InternalCLI<any,...>` with `AnyInternalCLI` |
| `packages/cli-forge/src/lib/documentation.ts` | Replace `InternalCLI<any,...>` with `AnyInternalCLI` |
| `packages/cli-forge/src/lib/format-help.ts` | Replace `InternalCLI<any,...>` with `AnyInternalCLI` |
| `packages/cli-forge/src/lib/composable-builder.ts` | Update generic parameters |
| `packages/cli-forge/tsdown.config.mjs` | Add `'async-context'` to `browserAlias` |
| `packages/cli-forge/package.json` | Add `"./context"` export entry |
| `examples/` | New multi-file example |
| `type-tests/` | TProviders accumulation, inject key constraints, duplicate key rejection, getChildContext, `InferContextOfCommand` |

---

## Resolved Decisions

- **Context propagation**: AsyncLocalStorage with browser fallback stub
- **`getChildContext` runtime**: Throws if child not in active command chain.
- **Tokens vs string keys**: String literal keys. No tokens.
- **Naming**: `getCommandContext()`, `CommandContext`, `InferContextOfCommand`.
- **Parent provider inheritance**: Recursive `ProvidersOf<T>` type walks `TParent` chain.
- **Duplicate keys**: Forbidden at same level (type error). Child-shadows-parent allowed with `Omit` override semantics.
- **Global factories**: No args parameter. Prevents unsound binding to first execution's args.
- **Provider execution timing**: Deferred to handler phase. `inject()` not available during middleware/init hooks.
- **`getCommandContext` overloads**: Both `(cli: T)` and `<T>()` forms. CLI parameter is a type-level witness, not used at runtime.
- **Testing API**: Setup/teardown pattern with `mockContext()` returning cleanup function. ALS is hidden as implementation detail.
- **AnyCLI prerequisite**: Replace scattered `<any, any, any, any>` before adding 5th generic.

## Open Questions (v2 candidates)

1. **Provider disposal**: `executionScope` providers with `dispose?: (value: T) => void` for cleanup?
