# Dependency Injection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add lightweight DI via `.provide()` + `getCommandContext()` with AsyncLocalStorage-based context propagation to cli-forge.

**Architecture:** AsyncLocalStorage scopes execution context per `forge()`/`sdk()` call. The CLI instance is a type-level witness for `getCommandContext()` — ALS handles runtime lookup. Browser fallback uses a simple last-set-wins store. Provider execution is deferred to handler phase.

**Tech Stack:** TypeScript, AsyncLocalStorage (`node:async_hooks`), tsdown browser aliasing

---

### Task 1: AnyCLI / AnyInternalCLI Type Aliases

**Goal:** Replace 45 scattered `<any, any, any, any>` casts with named type aliases. This is a pure refactor prerequisite before adding the 5th generic.

**Files:**
- Modify: `packages/cli-forge/src/lib/public-api.ts` (add `AnyCLI`, deprecate `UnknownCLI`)
- Modify: `packages/cli-forge/src/lib/internal-cli.ts` (add `AnyInternalCLI`, replace ~17 occurrences)
- Modify: `packages/cli-forge/src/lib/resolve-completions.ts` (replace ~11 occurrences)
- Modify: `packages/cli-forge/src/lib/documentation.ts` (replace 1 occurrence)
- Modify: `packages/cli-forge/src/lib/format-help.ts` (replace 1 occurrence, plus parameter type)
- Modify: `packages/cli-forge/src/lib/composable-builder.ts` (update `ExtractChildren`, `ExtractArgs`)
- Modify: `packages/cli-forge/src/lib/cli-option-groups.ts` (replace 2 occurrences)
- Modify: `packages/cli-forge/src/lib/interactive-shell.ts` (replace 1 occurrence)
- Modify: `packages/cli-forge/src/browser/interactive-shell.ts` (replace 1 occurrence)
- Modify: `packages/cli-forge/src/lib/test-harness.ts` (replace `InternalCLI` bare usage in `mockHandler`)
- Modify: `packages/cli-forge/src/index.ts` (export `AnyCLI`)

**Step 1: Add type aliases**

In `public-api.ts`, near the existing `UnknownCLI` at line 1107:

```typescript
/** Type alias for a CLI instance with any type parameters. */
export type AnyCLI = CLI<ParsedArgs, any, any, any>;

/** @deprecated Use AnyCLI instead */
export type UnknownCLI = AnyCLI;
```

In `internal-cli.ts`, after imports:

```typescript
export type AnyInternalCLI = InternalCLI<ParsedArgs, any, any, any>;
```

**Step 2: Replace all occurrences**

In each file, replace `InternalCLI<any, any, any, any>` with `AnyInternalCLI` and `CLI<any, any, any, any>` with `AnyCLI`. For single-`any` usages like `InternalCLI<any>`, replace with `AnyInternalCLI` as well since they serve the same purpose.

Key replacements in `internal-cli.ts`:
- Line 90: `obj is AnyInternalCLI`
- Line 101: `Record<string, AnyInternalCLI>`
- Line 112: `private _parent?: AnyInternalCLI`
- Line 206, 377, 629, 710, 711, 771, 831, 871, 873, 874, 1062, 1114, 1206: all `AnyInternalCLI`
- Line 743: `CLI<any, any, any, any>` → `AnyCLI`

In `resolve-completions.ts`: Lines 7, 16, 21, 93, 94, 98, 103, 120, 121, 191, 197 → `AnyInternalCLI`

In `documentation.ts`: Line 150 → `AnyInternalCLI`

In `format-help.ts`: Lines 10, 44 → `AnyInternalCLI`

In `composable-builder.ts`: Lines 7, 14 → use `AnyCLI` in the extends clauses

In `cli-option-groups.ts`: Lines 4, 22 → `AnyInternalCLI`

In `interactive-shell.ts` (both node and browser): constructor param → `AnyInternalCLI`

In `test-harness.ts`: Line 60 `mockHandler` param → `AnyInternalCLI`

**Step 3: Export AnyCLI from index.ts**

Add to exports in `packages/cli-forge/src/index.ts`:

```typescript
export type { AnyCLI } from './lib/public-api';
```

**Step 4: Build and test**

Run: `nx build cli-forge && nx test cli-forge && nx test type-tests`
Expected: All pass, no behavior change.

**Step 5: Commit**

```
refactor(cli-forge): replace scattered any casts with AnyCLI/AnyInternalCLI aliases
```

---

### Task 2: Add TProviders Generic to CLI Interface

**Goal:** Add the 5th generic parameter `TProviders = {}` to CLI and InternalCLI. All existing methods pass it through unchanged. No new methods yet.

**Files:**
- Modify: `packages/cli-forge/src/lib/public-api.ts` (CLI interface, all method return types, cli() factory, SDK types)
- Modify: `packages/cli-forge/src/lib/internal-cli.ts` (InternalCLI class declaration, clone())
- Modify: `packages/cli-forge/src/lib/composable-builder.ts` (ComposableBuilder type)
- Modify: `packages/cli-forge/src/lib/test-harness.ts` (TestHarness generic)
- Create: `type-tests/fixtures/providers-basic.ts` (type test for TProviders passthrough)

**Step 1: Write the type test**

Create `type-tests/fixtures/providers-basic.ts`:

```typescript
import { cli } from 'cli-forge';
import { IsTrue, AssertEqual } from '../assertions/helpers';

// TProviders defaults to {} and passes through option/command chains
const app = cli('test')
  .option('name', { type: 'string' })
  .command('sub', {
    builder: (cmd) => cmd.option('port', { type: 'number' }),
    handler: () => {},
  });

// Verify the CLI type still works - args are inferred
type AppArgs = Parameters<Parameters<typeof app['handler']>[0]>[0];
type _test1 = IsTrue<AssertEqual<AppArgs['name'], string | undefined>>;
```

**Step 2: Update CLI interface declaration**

In `public-api.ts` line 91-97, add `TProviders = {}`:

```typescript
export interface CLI<
  TArgs extends ParsedArgs = ParsedArgs,
  THandlerReturn = void,
  TChildren = {},
  TParent = undefined,
  TProviders = {}
>
```

Update every method that returns `CLI<TArgs, THandlerReturn, TChildren, TParent>` to include `TProviders` as the 5th parameter. This includes:

- `command()` overloads (lines 98-151) — return type adds `, TProviders`
- `commands()` overloads (lines 161-401) — return type adds `, TProviders`
- `option()` overloads (lines 467-584) — return type adds `, TProviders`
- `positional()` overloads (lines 596-694) — return type adds `, TProviders`
- `middleware()` (line 823-830) — return type adds `, TProviders`
- `handler()` (lines 849-854) — return type adds `, TProviders`
- All simple passthrough methods (`config`, `updateConfig`, `enableInteractiveShell`, `errorHandler`, `withPromptProvider`, `conflicts`, `implies`, `demandCommand`, `strict`, `usage`, `examples`, `version`, `group`, `env`, `localize`, `init`, `completion`)

Update `AnyCLI`:

```typescript
export type AnyCLI = CLI<ParsedArgs, any, any, any, any>;
```

Update `UnknownCLI`, `CLIHandlerContext`, `SDKCommand`, `SDKInvokable`, `SDKChildren` and any other types that reference `CLI<...>` to include the 5th parameter.

Update the `cli()` factory function (line 1180) to pass through `TProviders`:

```typescript
export function cli<
  TArgs extends ParsedArgs,
  THandlerReturn = void,
  TChildren = {},
  TName extends string = string
>(
  name: TName,
  ...
) {
  return new InternalCLI(name, rootCommandConfiguration as any) as any as CLI<
    TArgs,
    THandlerReturn,
    TChildren,
    undefined,
    {}  // TProviders starts empty
  >;
}
```

**Step 3: Update InternalCLI class**

In `internal-cli.ts` line 70-76:

```typescript
export class InternalCLI<
  TArgs extends ParsedArgs = ParsedArgs,
  THandlerReturn = void,
  TChildren = {},
  TParent = undefined,
  TProviders = {}
> implements CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>
```

Update `AnyInternalCLI`:

```typescript
export type AnyInternalCLI = InternalCLI<ParsedArgs, any, any, any, any>;
```

Update `clone()` (line 1278):

```typescript
clone() {
  const clone = new InternalCLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>(
    this.name
  );
  ...
}
```

**Step 4: Update ComposableBuilder**

In `composable-builder.ts`:

```typescript
export type ComposableBuilder<
  TArgs2 extends ParsedArgs,
  TAddedChildren = {}
> = <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent, TProviders>(
  init: CLI<TInit, THandlerReturn, TChildren, TParent, TProviders>
) => CLI<Expand<TInit & TArgs2>, THandlerReturn, TChildren & TAddedChildren, TParent, TProviders>
```

**Step 5: Update TestHarness**

The TestHarness doesn't need `TProviders` in its generic since it only uses `TArgs`. Just ensure it accepts `CLI<T, any, any, any, any>`.

**Step 6: Build and test**

Run: `nx build cli-forge && nx test cli-forge && nx test type-tests`
Expected: All pass. The new generic defaults to `{}` so nothing breaks.

**Step 7: Commit**

```
refactor(cli-forge): add TProviders generic parameter to CLI interface
```

---

### Task 3: AsyncLocalStorage Infrastructure

**Goal:** Create the ALS wrapper module with browser fallback stub, wired into the build system.

**Files:**
- Create: `packages/cli-forge/src/lib/async-context.ts` (Node ALS wrapper)
- Create: `packages/cli-forge/src/browser/async-context.ts` (browser fallback)
- Modify: `packages/cli-forge/tsdown.config.mjs` (add browser alias)

**Step 1: Create the Node ALS module**

Create `packages/cli-forge/src/lib/async-context.ts`:

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

export interface ForgeContextData {
  args: Record<string, unknown>;
  commandChain: string[];
  providers: Map<string, unknown>;
  providerFactories: Map<string, { factory: Function; lifetime: string }>;
  globalCache: Map<string, unknown>;
  /** Whether inject() is currently allowed (only during handler phase) */
  handlerPhase: boolean;
}

export const contextStorage = new AsyncLocalStorage<ForgeContextData>();
```

**Step 2: Create the browser fallback**

Create `packages/cli-forge/src/browser/async-context.ts`:

```typescript
/**
 * Browser-safe fallback for AsyncLocalStorage.
 *
 * Uses a simple last-set-wins store. This is correct for browser usage
 * where CLI execution is single-threaded/sequential.
 *
 * Swapped in via browserAlias in tsdown.config.mjs.
 */

export interface ForgeContextData {
  args: Record<string, unknown>;
  commandChain: string[];
  providers: Map<string, unknown>;
  providerFactories: Map<string, { factory: Function; lifetime: string }>;
  globalCache: Map<string, unknown>;
  handlerPhase: boolean;
}

let currentStore: ForgeContextData | undefined;

export const contextStorage = {
  run<T>(store: ForgeContextData, fn: () => T): T {
    const prev = currentStore;
    currentStore = store;
    try {
      return fn();
    } finally {
      currentStore = prev;
    }
  },
  getStore(): ForgeContextData | undefined {
    return currentStore;
  },
};
```

**Step 3: Add browser alias**

In `packages/cli-forge/tsdown.config.mjs`, add to `browserAlias`:

```javascript
browserAlias: {
  'node-shell-deps': 'src/browser/shell-deps.ts',
  'interactive-shell': 'src/browser/interactive-shell.ts',
  'async-context': 'src/browser/async-context.ts',
},
```

**Step 4: Build**

Run: `nx build cli-forge`
Expected: Build succeeds. Both node and browser bundles produce correctly.

**Step 5: Commit**

```
chore(cli-forge): add AsyncLocalStorage infrastructure with browser fallback
```

---

### Task 4: Implement `.provide()` on CLI

**Goal:** Add the `.provide()` method to the CLI interface and InternalCLI implementation. Stores provider registrations on the CLI instance for later resolution.

**Files:**
- Modify: `packages/cli-forge/src/lib/public-api.ts` (add `.provide()` to CLI interface, add `ProviderConfig`/`GlobalProviderConfig` types)
- Modify: `packages/cli-forge/src/lib/internal-cli.ts` (implement `.provide()`, add provider storage)
- Modify: `packages/cli-forge/src/index.ts` (export new types)
- Create: `type-tests/fixtures/providers-provide.ts` (type test)

**Step 1: Write the type test**

Create `type-tests/fixtures/providers-provide.ts`:

```typescript
import { cli } from 'cli-forge';
import { IsTrue, AssertEqual, AssertProperty } from '../assertions/helpers';

// Eager value provider
const app1 = cli('test')
  .option('name', { type: 'string' })
  .provide('logger', { log: console.log });

// Factory provider (executionScope)
const app2 = cli('test')
  .option('logLevel', { type: 'string', default: 'info' })
  .provide('logger', {
    factory: (args) => ({ level: args.logLevel }),
  });

// Global factory (no args)
const app3 = cli('test')
  .provide('pool', {
    factory: () => ({ connections: 10 }),
    lifetime: 'global' as const,
  });

// Duplicate key at same level is forbidden
const app4 = cli('test')
  .provide('logger', { log: console.log })
  // @ts-expect-error — duplicate key at same level
  .provide('logger', { log: console.log });

// Multiple providers accumulate
const app5 = cli('test')
  .provide('a', 1)
  .provide('b', 'hello')
  .provide('c', true);
```

**Step 2: Add types to public-api.ts**

Add near the top of `public-api.ts`:

```typescript
export interface ProviderConfig<T, TArgs = any> {
  factory: (args: TArgs) => T;
  lifetime?: 'executionScope';
}

export interface GlobalProviderConfig<T> {
  factory: () => T;
  lifetime: 'global';
}
```

Add `.provide()` to the CLI interface (after `handler()` around line 854):

```typescript
  /**
   * Register a provider value or factory. Providers are accessible via
   * `getCommandContext(cli).inject(key)` during handler execution.
   *
   * Eager value:
   * ```ts
   * cli('app').provide('logger', new Logger())
   * ```
   *
   * Factory (executionScope, receives args):
   * ```ts
   * cli('app').provide('logger', { factory: (args) => new Logger(args.logLevel) })
   * ```
   *
   * Factory (global, no args):
   * ```ts
   * cli('app').provide('pool', { factory: () => new Pool(), lifetime: 'global' })
   * ```
   */
  // Global factory (no args)
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    config: GlobalProviderConfig<T>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // ExecutionScope factory (receives args)
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    config: ProviderConfig<T, TArgs>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // Eager value
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    value: T,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;
```

Note the overload ordering: global factory first (most specific — has `lifetime: 'global'`), then executionScope factory (has `factory` prop), then eager value (fallback).

**Step 3: Implement in InternalCLI**

Add provider storage fields to `InternalCLI` (after the existing fields around line 118):

```typescript
  /**
   * Registered providers for this command level.
   * Maps key -> { type: 'eager', value } | { type: 'factory', factory, lifetime }
   */
  registeredProviders: Map<string, ProviderRegistration> = new Map();
```

Add the `ProviderRegistration` type (in `internal-cli.ts` near the top):

```typescript
type ProviderRegistration =
  | { type: 'eager'; value: unknown }
  | { type: 'factory'; factory: Function; lifetime: 'global' | 'executionScope' };
```

Implement the `.provide()` method:

```typescript
  provide(key: string, valueOrConfig: unknown): any {
    if (this.registeredProviders.has(key)) {
      throw new Error(`Provider '${key}' is already registered on this command.`);
    }
    if (
      valueOrConfig !== null &&
      typeof valueOrConfig === 'object' &&
      'factory' in valueOrConfig &&
      typeof (valueOrConfig as any).factory === 'function'
    ) {
      const config = valueOrConfig as { factory: Function; lifetime?: string };
      this.registeredProviders.set(key, {
        type: 'factory',
        factory: config.factory,
        lifetime: (config.lifetime as 'global' | 'executionScope') ?? 'executionScope',
      });
    } else {
      this.registeredProviders.set(key, { type: 'eager', value: valueOrConfig });
    }
    return this;
  }
```

Update `clone()` to copy providers:

```typescript
  clone() {
    const clone = new InternalCLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>(
      this.name
    );
    // ... existing clone logic ...
    clone.registeredProviders = new Map(this.registeredProviders);
    return clone;
  }
```

**Step 4: Export new types from index.ts**

```typescript
export type { ProviderConfig, GlobalProviderConfig } from './lib/public-api';
```

**Step 5: Build and test**

Run: `nx build cli-forge && nx test cli-forge && nx test type-tests`
Expected: All pass. `.provide()` is callable, types accumulate, duplicates error at type level.

**Step 6: Commit**

```
feat(cli-forge): add .provide() method for registering DI providers
```

---

### Task 5: Context Module — `getCommandContext` and `inject`

**Goal:** Create the `cli-forge/context` entrypoint with `getCommandContext()`, `CommandContext`, and `inject()` implementation.

**Files:**
- Create: `packages/cli-forge/src/lib/context.ts` (main context module)
- Modify: `packages/cli-forge/package.json` (add `./context` export)
- Modify: `packages/cli-forge/src/index.ts` (re-export context types)

**Step 1: Create the context module**

Create `packages/cli-forge/src/lib/context.ts`:

```typescript
import { ParsedArgs } from '@cli-forge/parser';
import type { CLI } from './public-api';
import { contextStorage, ForgeContextData } from './async-context';

// ---- Public Types ----

export type AnyCLI = CLI<ParsedArgs, any, any, any, any>;

/** Recursively gather all providers from a CLI and its ancestors */
export type ProvidersOf<T> = T extends CLI<any, any, any, infer Parent, infer Providers>
  ? (Parent extends AnyCLI ? ProvidersOf<Parent> & Providers : Providers)
  : {};

/** Infer the full CommandContext type from a CLI type */
export type InferContextOfCommand<T> = T extends CLI<infer A, any, infer C, any, any>
  ? CommandContext<A, ProvidersOf<T>, C>
  : never;

export interface CommandContext<TArgs, TProviders, TChildren = {}> {
  /** Current parsed + middleware-transformed args */
  readonly args: TArgs;

  /** Resolved command path, e.g. ['deploy', 'staging'] */
  readonly commandChain: readonly string[];

  /**
   * Inject a provided value. Constrained to keys registered via .provide().
   * Throws if key was not provided.
   */
  inject<K extends string & keyof TProviders>(key: K): TProviders[K];

  /**
   * Inject with fallback. Returns defaultValue if key not provided.
   */
  inject<K extends string & keyof TProviders>(
    key: K,
    defaultValue: TProviders[K],
  ): TProviders[K];

  /**
   * Navigate to a child command's typed context.
   * Throws if that child is not in the active command chain.
   */
  getChildContext<K extends string & keyof TChildren>(
    command: K,
  ): TChildren[K] extends CLI<infer A, any, infer GC, any, infer P>
    ? CommandContext<A, Omit<TProviders, keyof P> & P, GC>
    : never;
}

// ---- Module-level global provider cache ----

const globalProviderCache = new Map<string, unknown>();

// ---- Implementation ----

/**
 * Get the active execution context. The CLI parameter is a type-level
 * witness — it drives TypeScript inference but is not used at runtime.
 *
 * @example
 * // Typed via CLI instance (T inferred)
 * const ctx = getCommandContext(app);
 *
 * // Typed via explicit generic
 * const ctx = getCommandContext<typeof app>();
 */
export function getCommandContext<T extends AnyCLI>(cli?: T): InferContextOfCommand<T> {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error(
      'No active execution context. Ensure this code runs during a forge()/sdk() handler.'
    );
  }
  if (!store.handlerPhase) {
    throw new Error(
      'inject() is not available during middleware/init. Providers are resolved during handler execution when args are finalized.'
    );
  }
  return createCommandContext(store) as InferContextOfCommand<T>;
}

function createCommandContext(store: ForgeContextData): CommandContext<any, any, any> {
  return {
    get args() {
      return store.args;
    },
    get commandChain() {
      return store.commandChain;
    },
    inject(key: string, ...rest: unknown[]) {
      const hasDefault = rest.length > 0;
      const defaultValue = rest[0];

      // Check if already resolved in this execution
      if (store.providers.has(key)) {
        return store.providers.get(key);
      }

      // Check factory registrations
      const registration = store.providerFactories.get(key);
      if (!registration) {
        if (hasDefault) return defaultValue;
        const registered = [...store.providerFactories.keys(), ...store.providers.keys()];
        throw new Error(
          `Provider '${key}' not found. Registered: ${registered.join(', ') || '(none)'}`
        );
      }

      // Resolve factory
      let value: unknown;
      if (registration.lifetime === 'global') {
        if (globalProviderCache.has(key)) {
          value = globalProviderCache.get(key);
        } else {
          value = registration.factory();
          globalProviderCache.set(key, value);
        }
      } else {
        // executionScope — factory receives args
        value = registration.factory(store.args);
      }

      // Cache in execution scope
      store.providers.set(key, value);
      return value;
    },
    getChildContext(command: string) {
      if (!store.commandChain.includes(command)) {
        throw new Error(
          `getChildContext('${command}') called but '${command}' is not in the active command chain [${store.commandChain.map(c => `'${c}'`).join(', ')}].`
        );
      }
      // Child context shares the same store — providers are inherited
      return createCommandContext(store);
    },
  };
}

/** @internal — exported for TestHarness.mockContext() */
export { globalProviderCache };
```

**Step 2: Add package.json export**

In `packages/cli-forge/package.json`, add to `"exports"`:

```json
"./context": {
  "browser": "./dist/browser/lib/context.mjs",
  "types": "./dist/lib/context.d.mts",
  "import": "./dist/lib/context.mjs",
  "require": "./dist/lib/context.cjs",
  "default": "./dist/lib/context.cjs"
}
```

**Step 3: Re-export types from index.ts**

Add to `packages/cli-forge/src/index.ts`:

```typescript
export type {
  CommandContext,
  InferContextOfCommand,
  ProvidersOf,
} from './lib/context';
export { getCommandContext } from './lib/context';
```

**Step 4: Build**

Run: `nx build cli-forge`
Expected: Build succeeds with the new `./context` entrypoint.

**Step 5: Commit**

```
feat(cli-forge): add getCommandContext and CommandContext for DI access
```

---

### Task 6: Wire ALS into `forge()` and `sdk()`

**Goal:** Wrap handler execution in `contextStorage.run()` so `getCommandContext()` works during handlers.

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.ts` (wrap runCommand in ALS, collect providers from command chain)
- Create: `packages/cli-forge/src/lib/context.spec.ts` (integration tests)

**Step 1: Write the integration test**

Create `packages/cli-forge/src/lib/context.spec.ts`:

```typescript
import { cli } from './public-api';
import { getCommandContext } from './context';

describe('getCommandContext', () => {
  it('should provide args during handler execution', async () => {
    let capturedArgs: any;

    const app = cli('test')
      .option('name', { type: 'string', default: 'world' })
      .handler((args) => {
        const ctx = getCommandContext(app);
        capturedArgs = ctx.args;
      });

    await app.forge(['--name', 'hello']);
    expect(capturedArgs.name).toBe('hello');
  });

  it('should inject eager providers', async () => {
    let injected: any;
    const logger = { log: jest.fn() };

    const app = cli('test')
      .provide('logger', logger)
      .handler(() => {
        const ctx = getCommandContext(app);
        injected = ctx.inject('logger');
      });

    await app.forge([]);
    expect(injected).toBe(logger);
  });

  it('should inject executionScope factory providers with args', async () => {
    let injected: any;

    const app = cli('test')
      .option('level', { type: 'string', default: 'info' })
      .provide('logger', {
        factory: (args: any) => ({ level: args.level }),
      })
      .handler(() => {
        const ctx = getCommandContext(app);
        injected = ctx.inject('logger');
      });

    await app.forge(['--level', 'debug']);
    expect(injected).toEqual({ level: 'debug' });
  });

  it('should inject global factory providers without args', async () => {
    let callCount = 0;

    const app = cli('test')
      .provide('pool', {
        factory: () => { callCount++; return { id: 1 }; },
        lifetime: 'global' as const,
      })
      .handler(() => {
        const ctx = getCommandContext(app);
        ctx.inject('pool');
        ctx.inject('pool'); // second call should use cache
      });

    await app.forge([]);
    expect(callCount).toBe(1);
  });

  it('should throw when called outside handler', () => {
    expect(() => getCommandContext(cli('test'))).toThrow(
      'No active execution context'
    );
  });

  it('should throw for unregistered provider without default', async () => {
    const app = cli('test')
      .handler(() => {
        const ctx = getCommandContext(app) as any;
        ctx.inject('missing');
      });

    await expect(app.forge([])).rejects.toThrow("Provider 'missing' not found");
  });

  it('should return default for unregistered provider with default', async () => {
    let result: any;

    const app = cli('test')
      .handler(() => {
        const ctx = getCommandContext(app) as any;
        result = ctx.inject('missing', 'fallback');
      });

    await app.forge([]);
    expect(result).toBe('fallback');
  });

  it('should work with SDK mode', async () => {
    let injected: any;

    const app = cli('test')
      .provide('svc', { value: 42 })
      .handler(() => {
        const ctx = getCommandContext(app);
        injected = ctx.inject('svc');
      });

    const sdk = app.sdk();
    await sdk();
    expect(injected).toEqual({ value: 42 });
  });

  it('should provide commandChain for subcommands', async () => {
    let chain: any;

    const app = cli('test')
      .command('deploy', {
        builder: (cmd) => cmd,
        handler: () => {
          const ctx = getCommandContext(app);
          chain = ctx.commandChain;
        },
      });

    await app.forge(['deploy']);
    expect(chain).toEqual(['deploy']);
  });
});
```

**Step 2: Wire ALS into forge()**

In `internal-cli.ts`, import the context storage:

```typescript
import { contextStorage, ForgeContextData } from './async-context';
```

In the `forge()` method, after the final strict parse (around line 1266) and before calling `runCommand()`, wrap the execution in `contextStorage.run()`:

Replace line 1266:
```typescript
const finalArgV = await this.runCommand(argv, args, executedMiddleware);
```

With:
```typescript
// Collect all providers from the command chain
const allProviders = this.collectProviders();
const contextData: ForgeContextData = {
  args: argv,
  commandChain: [...this.commandChain],
  providers: new Map(),
  providerFactories: new Map(),
  globalCache: new Map(), // unused — global cache is at module level
  handlerPhase: false,
};

// Register providers into context
for (const [key, reg] of allProviders) {
  if (reg.type === 'eager') {
    contextData.providers.set(key, reg.value);
  } else {
    contextData.providerFactories.set(key, {
      factory: reg.factory,
      lifetime: reg.lifetime,
    });
  }
}

const finalArgV = await contextStorage.run(contextData, async () => {
  contextData.handlerPhase = true;
  contextData.args = argv; // ensure final args visible
  return this.runCommand(argv, args, executedMiddleware);
});
```

Add the `collectProviders()` method to `InternalCLI`:

```typescript
  /**
   * Collect all registered providers from the command chain
   * (root -> subcommand -> nested subcommand).
   * Child providers override parent providers with the same key.
   */
  private collectProviders(): Map<string, ProviderRegistration> {
    const result = new Map<string, ProviderRegistration>();
    // Start from root (this) and walk down the command chain
    let cmd: AnyInternalCLI = this;
    for (const [key, reg] of cmd.registeredProviders) {
      result.set(key, reg);
    }
    for (const name of this.commandChain) {
      cmd = cmd.registeredCommands[name];
      if (cmd) {
        for (const [key, reg] of cmd.registeredProviders) {
          result.set(key, reg); // child overrides parent
        }
      }
    }
    return result;
  }
```

**Step 3: Wire ALS into SDK**

In `buildSDKProxy()`, wrap the handler invocation (around line 829-833):

Replace:
```typescript
// Execute handler
const context: CLIHandlerContext<any, any> = {
  command: cmd as unknown as CLI<any, any, any, any>,
};
const result = await handler(parsedArgs, context);
```

With:
```typescript
// Collect providers from the cloned command
const allProviders = new Map<string, ProviderRegistration>();
// Walk from root to target, collecting providers
let walkCmd: AnyInternalCLI = cmd;
for (const [key, reg] of walkCmd.registeredProviders) {
  allProviders.set(key, reg);
}

const contextData: ForgeContextData = {
  args: parsedArgs,
  commandChain: [],
  providers: new Map(),
  providerFactories: new Map(),
  globalCache: new Map(),
  handlerPhase: true,
};

for (const [key, reg] of allProviders) {
  if (reg.type === 'eager') {
    contextData.providers.set(key, reg.value);
  } else {
    contextData.providerFactories.set(key, {
      factory: reg.factory,
      lifetime: reg.lifetime,
    });
  }
}

const context: CLIHandlerContext<any, any> = {
  command: cmd as unknown as AnyCLI,
};
const result = await contextStorage.run(contextData, async () => {
  return handler(parsedArgs, context);
});
```

**Step 4: Update runCommand to update ALS context args after middleware**

In `runCommand()`, after middleware transforms args (around line 650), update the ALS store:

```typescript
// After middleware loop, update ALS context if active
const store = contextStorage.getStore();
if (store) {
  store.args = args;
}
```

**Step 5: Run tests**

Run: `nx test cli-forge`
Expected: All existing tests pass, new context tests pass.

**Step 6: Commit**

```
feat(cli-forge): wire AsyncLocalStorage into forge() and sdk() execution
```

---

### Task 7: TestHarness `mockContext`

**Goal:** Add `mockContext()` and `clearMockedContexts()` static methods to TestHarness.

**Files:**
- Modify: `packages/cli-forge/src/lib/test-harness.ts`
- Create: `packages/cli-forge/src/lib/test-harness-context.spec.ts`

**Step 1: Write the test**

Create `packages/cli-forge/src/lib/test-harness-context.spec.ts`:

```typescript
import { cli } from './public-api';
import { TestHarness } from './test-harness';
import { getCommandContext } from './context';

describe('TestHarness.mockContext', () => {
  afterEach(() => {
    TestHarness.clearMockedContexts();
  });

  it('should provide mocked args via getCommandContext', () => {
    const app = cli('test')
      .option('name', { type: 'string' });

    const cleanup = TestHarness.mockContext(app, {
      args: { name: 'mocked' },
    });

    const ctx = getCommandContext(app);
    expect(ctx.args.name).toBe('mocked');
    cleanup();
  });

  it('should provide mocked providers via inject', () => {
    const mockLogger = { log: jest.fn() };

    const app = cli('test')
      .provide('logger', { log: () => {} });

    const cleanup = TestHarness.mockContext(app, {
      args: {},
      providers: { logger: mockLogger },
    });

    const ctx = getCommandContext(app);
    expect(ctx.inject('logger')).toBe(mockLogger);
    cleanup();
  });

  it('cleanup should remove the mocked context', () => {
    const app = cli('test');

    const cleanup = TestHarness.mockContext(app, { args: {} });
    cleanup();

    expect(() => getCommandContext(app)).toThrow('No active execution context');
  });

  it('clearMockedContexts should remove all mocked contexts', () => {
    const app = cli('test');

    TestHarness.mockContext(app, { args: {} });
    TestHarness.clearMockedContexts();

    expect(() => getCommandContext(app)).toThrow('No active execution context');
  });
});
```

**Step 2: Implement mockContext**

In `test-harness.ts`, add the static methods and import `contextStorage`:

```typescript
import { contextStorage, ForgeContextData } from './async-context';

// Track active mocked ALS contexts for cleanup
const mockedDisposers: Array<() => void> = [];

export class TestHarness<T extends ParsedArgs> {
  // ... existing code ...

  /**
   * Set up a mocked execution context for testing.
   * getCommandContext() will return a context with the given args and providers.
   * Returns a cleanup function that removes the mocked context.
   */
  static mockContext<TArgs, TProviders>(
    _cli: CLI<TArgs, any, any, any, TProviders>,
    options: {
      args?: Partial<TArgs>;
      providers?: Partial<TProviders>;
      commandChain?: string[];
    },
  ): () => void {
    const contextData: ForgeContextData = {
      args: (options.args ?? {}) as Record<string, unknown>,
      commandChain: options.commandChain ?? [],
      providers: new Map(
        Object.entries(options.providers ?? {})
      ),
      providerFactories: new Map(),
      globalCache: new Map(),
      handlerPhase: true, // Always true in test mocks so inject() works
    };

    // Enter the ALS context — this sets the store for the current
    // synchronous execution and any async continuations from here.
    contextStorage.enterWith(contextData);

    const dispose = () => {
      // Clear the store by entering with undefined
      contextStorage.enterWith(undefined as any);
      const idx = mockedDisposers.indexOf(dispose);
      if (idx !== -1) mockedDisposers.splice(idx, 1);
    };

    mockedDisposers.push(dispose);
    return dispose;
  }

  /** Clear all mocked contexts. Call in afterEach(). */
  static clearMockedContexts(): void {
    for (const dispose of [...mockedDisposers]) {
      dispose();
    }
  }
}
```

Note: `enterWith()` is not available on Cloudflare Workers, but that's fine — `mockContext` is a testing utility that only runs in Node/Bun test environments. The browser fallback stub should also add `enterWith` support:

Update `packages/cli-forge/src/browser/async-context.ts` to add:

```typescript
export const contextStorage = {
  run<T>(store: ForgeContextData, fn: () => T): T { /* ... existing ... */ },
  getStore(): ForgeContextData | undefined { return currentStore; },
  enterWith(store: ForgeContextData): void { currentStore = store; },
};
```

**Step 3: Run tests**

Run: `nx test cli-forge`
Expected: All pass including new mockContext tests.

**Step 4: Commit**

```
feat(cli-forge): add TestHarness.mockContext for testing DI providers
```

---

### Task 8: Type Tests

**Goal:** Comprehensive type-level tests for TProviders accumulation, inject key constraints, duplicate rejection, child context inheritance, and InferContextOfCommand.

**Files:**
- Create: `type-tests/fixtures/providers-inject.ts`
- Create: `type-tests/fixtures/providers-child-context.ts`
- Create: `type-tests/fixtures/providers-infer-context.ts`

**Step 1: Create inject constraint test**

Create `type-tests/fixtures/providers-inject.ts`:

```typescript
import { cli } from 'cli-forge';
import { getCommandContext, CommandContext } from 'cli-forge/context';

// Setup: app with providers
const app = cli('test')
  .option('verbose', { type: 'boolean' })
  .provide('logger', { info: (msg: string) => console.log(msg) })
  .provide('api', { get: (url: string) => fetch(url) });

// In a handler context:
function testInject() {
  const ctx = getCommandContext(app);

  // Valid injects
  const logger = ctx.inject('logger');
  logger.info('test'); // should be typed

  const api = ctx.inject('api');
  api.get('/test'); // should be typed

  // Invalid inject — uncomment to verify type error
  // @ts-expect-error — 'missing' not in providers
  ctx.inject('missing');
}
```

**Step 2: Create child context test**

Create `type-tests/fixtures/providers-child-context.ts`:

```typescript
import { cli } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';

const app = cli('test')
  .provide('rootSvc', { root: true })
  .command('deploy', {
    builder: (cmd) => cmd
      .option('target', { type: 'string', required: true })
      .provide('deployer', { deploy: (t: string) => {} }),
    handler: () => {},
  });

function testChildContext() {
  const rootCtx = getCommandContext(app);

  const deployCtx = rootCtx.getChildContext('deploy');

  // Child has its own args
  deployCtx.args.target; // string

  // Child inherits parent providers
  deployCtx.inject('rootSvc'); // { root: boolean }

  // Child has its own providers
  deployCtx.inject('deployer'); // { deploy: (t: string) => void }

  // Invalid child
  // @ts-expect-error — 'nonexistent' not in children
  rootCtx.getChildContext('nonexistent');
}
```

**Step 3: Create InferContextOfCommand test**

Create `type-tests/fixtures/providers-infer-context.ts`:

```typescript
import { cli } from 'cli-forge';
import { getCommandContext, InferContextOfCommand } from 'cli-forge/context';

const app = cli('test')
  .option('name', { type: 'string' })
  .provide('svc', { hello: 'world' });

// Overload 1: inferred from instance
function test1() {
  const ctx = getCommandContext(app);
  ctx.args.name; // string | undefined
  ctx.inject('svc'); // { hello: string }
}

// Overload 2: explicit generic
function test2() {
  const ctx = getCommandContext<typeof app>();
  ctx.args.name; // string | undefined
  ctx.inject('svc'); // { hello: string }
}

// InferContextOfCommand utility type
type Ctx = InferContextOfCommand<typeof app>;
// Should have args with name, providers with svc
```

**Step 4: Run type tests**

Run: `nx test type-tests`
Expected: All pass, @ts-expect-error lines correctly catch type errors.

**Step 5: Commit**

```
chore(cli-forge): add type tests for provider injection and context inference
```

---

### Task 9: Example and Documentation

**Goal:** Add a multi-file example demonstrating the providers feature.

**Files:**
- Create: `examples/providers/meta.yml`
- Create: `examples/providers/cli.ts`
- Create: `examples/providers/deploy.ts`

**Step 1: Create the example**

Create `examples/providers/meta.yml`:

```yaml
id: providers
title: Dependency Injection with Providers
description: |
  Demonstrates using .provide() and getCommandContext() to register
  and inject services without threading them through function calls.
entryPoint: ./cli.ts
fileMap:
  './cli.ts': 'cli.ts'
  './deploy.ts': 'deploy.ts'
commands:
  - command: '{filename} deploy --target production --apiUrl http://example.com'
    assertions:
      - contains: 'Deploying to production'
```

Create `examples/providers/cli.ts`:

```typescript
import { cli } from 'cli-forge';
import { runDeploy } from './deploy';

export const app = cli('deploy-tool')
  .option('logLevel', {
    type: 'string',
    default: 'info',
    description: 'Logging level',
  })
  .option('apiUrl', {
    type: 'string',
    required: true,
    description: 'API base URL',
  })
  .provide('logger', {
    factory: (args) => ({
      info: (msg: string) => console.log(`[${args.logLevel}] ${msg}`),
    }),
  })
  .command('deploy', {
    description: 'Deploy to a target environment',
    builder: (cmd) =>
      cmd.option('target', {
        type: 'string',
        required: true,
        description: 'Deployment target',
      }),
    handler: async () => {
      await runDeploy();
    },
  });

app.forge();
```

Create `examples/providers/deploy.ts`:

```typescript
import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export async function runDeploy() {
  const ctx = getCommandContext(app);
  const deployCtx = ctx.getChildContext('deploy');

  const logger = ctx.inject('logger');
  const target = deployCtx.args.target;

  logger.info(`Deploying to ${target}`);
}
```

**Step 2: Run the example**

Run: `npx tsx examples/providers/cli.ts deploy --target production --apiUrl http://example.com`
Expected: Output contains `[info] Deploying to production`

**Step 3: Run e2e**

Run: `nx run e2e:e2e:examples`
Expected: New example passes assertions.

**Step 4: Commit**

```
docs(cli-forge): add providers example demonstrating DI pattern
```

---

## Task Dependency Graph

```
Task 1 (AnyCLI aliases)
  └─> Task 2 (TProviders generic)
        ├─> Task 4 (.provide() method)
        │     └─> Task 6 (Wire ALS into forge/sdk)
        │           ├─> Task 7 (TestHarness.mockContext)
        │           └─> Task 8 (Type tests)
        │                 └─> Task 9 (Example)
        └─> Task 3 (ALS infrastructure) ─────────┘
                  └─> Task 5 (Context module) ────┘
```

Tasks 3 and 4 can be done in parallel after Task 2.
Tasks 5 depends on Task 3.
Task 6 depends on Tasks 4 and 5.
Tasks 7 and 8 depend on Task 6.
Task 9 depends on Task 8.
