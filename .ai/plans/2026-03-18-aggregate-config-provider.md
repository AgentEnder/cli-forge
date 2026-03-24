# AggregateConfigProvider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce an `AggregateConfigProvider` that owns config merge logic, tracks per-key provenance, and routes `updateConfig` writes to the correct underlying provider.

**Architecture:** The existing `resolveConfiguration` free function is replaced by an `AggregateConfigProvider` class that wraps child providers (`ConfigurationProvider | AggregateConfigProvider`). On `load`, it iterates children, merges their configs (first-registered wins), and records which leaf provider supplied each key. On `updateConfig`, it groups partial updates by provenance and delegates writes to the owning provider. The parser and CLI layer are updated to accept and work with the new type.

**Tech Stack:** TypeScript, Vitest, Nx

---

### Task 1: Define `AggregateConfigProvider` type and `isAggregateConfigProvider` guard

**Files:**
- Modify: `packages/parser/src/lib/config-files/configuration-loader.ts`

**Step 1: Write the failing test**

Create a new test file for the aggregate provider.

File: `packages/parser/src/lib/config-files/aggregate-config-provider.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AggregateConfigProvider, isAggregateConfigProvider } from './aggregate-config-provider';
import { ConfigurationProvider } from './configuration-loader';

describe('AggregateConfigProvider', () => {
  describe('isAggregateConfigProvider', () => {
    it('should return true for AggregateConfigProvider instances', () => {
      const aggregate = new AggregateConfigProvider([]);
      expect(isAggregateConfigProvider(aggregate)).toBe(true);
    });

    it('should return false for regular ConfigurationProvider instances', () => {
      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
      };
      expect(isAggregateConfigProvider(provider)).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: FAIL — module `./aggregate-config-provider` does not exist

**Step 3: Write minimal implementation**

File: `packages/parser/src/lib/config-files/aggregate-config-provider.ts`

```typescript
import { ConfigurationProvider, ConfigurationDocSection } from './configuration-loader.js';

/**
 * A provider child is either a single-file ConfigurationProvider or a nested AggregateConfigProvider.
 */
export type AnyConfigProvider<T> =
  | ConfigurationProvider<T>
  | AggregateConfigProvider<T>;

/**
 * An aggregate configuration provider that wraps multiple child providers.
 * It owns the merge logic, tracks per-key provenance, and routes
 * `updateConfig` writes to the correct underlying provider.
 *
 * Unlike {@link ConfigurationProvider}, an aggregate has no `resolve` method —
 * it delegates resolution to its children.
 */
export class AggregateConfigProvider<T> {
  readonly providers: AnyConfigProvider<T>[];

  /**
   * After {@link load} is called, maps each top-level key to the leaf
   * {@link ConfigurationProvider} that supplied it.
   */
  provenance: Map<string, ConfigurationProvider<T>> = new Map();

  constructor(providers: AnyConfigProvider<T>[]) {
    this.providers = providers;
  }

  /**
   * Loads and merges configuration from all child providers.
   * First-registered provider wins when keys overlap.
   *
   * @param configurationRoot The directory to resolve config files from.
   * @param visited Shared visited-file map for circular reference detection.
   * @returns The merged configuration object.
   */
  load(
    configurationRoot: string,
    visited?: Map<ConfigurationProvider<T>, Set<string>>
  ): T {
    throw new Error('Not implemented');
  }

  /**
   * Updates configuration by routing each key to its owning provider.
   * Keys not found in provenance are routed to the first resolving provider.
   *
   * @param values Partial configuration to write.
   */
  async updateConfig(values: Partial<T>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Aggregates documentation sections from all child providers.
   */
  describeConfig(): ConfigurationDocSection[] {
    return [];
  }
}

/**
 * Type guard to distinguish an AggregateConfigProvider from a ConfigurationProvider.
 */
export function isAggregateConfigProvider<T>(
  provider: AnyConfigProvider<T>
): provider is AggregateConfigProvider<T> {
  return provider instanceof AggregateConfigProvider;
}
```

**Step 4: Run test to verify it passes**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat(parser): add AggregateConfigProvider skeleton and type guard
```

---

### Task 2: Implement `AggregateConfigProvider.load` with provenance tracking

**Files:**
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.ts`
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.spec.ts`

**Step 1: Write the failing tests**

Add to `aggregate-config-provider.spec.ts`:

```typescript
import { join } from 'path';

function makeMockProvider<T>(
  config: Record<string, T>
): ConfigurationProvider<any> {
  return {
    resolve: (dir) => {
      for (const key of Object.keys(config)) {
        if (key.startsWith(dir)) return key;
      }
      return undefined;
    },
    load: (file) => config[file],
  };
}

describe('load', () => {
  it('should merge config from multiple providers', () => {
    const providerA = makeMockProvider({
      '/root/.configA': { foo: 'fromA', bar: 1 },
    });
    const providerB = makeMockProvider({
      '/root/.configB': { baz: true },
    });

    const aggregate = new AggregateConfigProvider([providerA, providerB]);
    const result = aggregate.load('/root');

    expect(result).toEqual({ foo: 'fromA', bar: 1, baz: true });
  });

  it('should give precedence to first-registered provider on key conflicts', () => {
    const providerA = makeMockProvider({
      '/root/.configA': { foo: 'fromA' },
    });
    const providerB = makeMockProvider({
      '/root/.configB': { foo: 'fromB', bar: 2 },
    });

    const aggregate = new AggregateConfigProvider([providerA, providerB]);
    const result = aggregate.load('/root');

    expect(result).toEqual({ foo: 'fromA', bar: 2 });
  });

  it('should record provenance for each key', () => {
    const providerA = makeMockProvider({
      '/root/.configA': { foo: 'fromA' },
    });
    const providerB = makeMockProvider({
      '/root/.configB': { bar: 2 },
    });

    const aggregate = new AggregateConfigProvider([providerA, providerB]);
    aggregate.load('/root');

    expect(aggregate.provenance.get('foo')).toBe(providerA);
    expect(aggregate.provenance.get('bar')).toBe(providerB);
  });

  it('should record provenance to first provider on key conflict', () => {
    const providerA = makeMockProvider({
      '/root/.configA': { foo: 'fromA' },
    });
    const providerB = makeMockProvider({
      '/root/.configB': { foo: 'fromB' },
    });

    const aggregate = new AggregateConfigProvider([providerA, providerB]);
    aggregate.load('/root');

    expect(aggregate.provenance.get('foo')).toBe(providerA);
  });

  it('should skip providers that do not resolve', () => {
    const providerA: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({ foo: 'unreachable' }),
    };
    const providerB = makeMockProvider({
      '/root/.configB': { bar: 2 },
    });

    const aggregate = new AggregateConfigProvider([providerA, providerB]);
    const result = aggregate.load('/root');

    expect(result).toEqual({ bar: 2 });
  });

  it('should detect circular references', () => {
    const provider = makeMockProvider({
      '/root/.config': { extends: '/root', foo: 'hello' },
    });

    const aggregate = new AggregateConfigProvider([provider]);
    expect(() => aggregate.load('/root')).toThrow(/[Cc]ircular/);
  });

  it('should handle extends chains', () => {
    const provider: ConfigurationProvider<any> = {
      resolve: (dir) => {
        if (dir === '/root') return '/root/.config';
        if (dir === '/base') return '/base/.config';
        return undefined;
      },
      load: (file) => {
        if (file === '/root/.config') return { extends: '/base', foo: 'root' };
        if (file === '/base/.config') return { bar: 'base' };
        return {};
      },
    };

    const aggregate = new AggregateConfigProvider([provider]);
    const result = aggregate.load('/root');

    expect(result).toEqual({ foo: 'root', bar: 'base' });
  });

  it('should load nested aggregates and merge their provenance', () => {
    const providerA = makeMockProvider({
      '/root/.configA': { foo: 'fromA' },
    });
    const providerB = makeMockProvider({
      '/root/.configB': { bar: 2 },
    });
    const innerAggregate = new AggregateConfigProvider([providerB]);
    const outerAggregate = new AggregateConfigProvider([providerA, innerAggregate]);

    const result = outerAggregate.load('/root');

    expect(result).toEqual({ foo: 'fromA', bar: 2 });
    expect(outerAggregate.provenance.get('foo')).toBe(providerA);
    expect(outerAggregate.provenance.get('bar')).toBe(providerB);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: FAIL — `load` throws "Not implemented"

**Step 3: Write the implementation**

Replace the `load` method in `aggregate-config-provider.ts`:

```typescript
import { join } from 'path';

// Inside AggregateConfigProvider class:

load(
  configurationRoot: string,
  visited?: Map<ConfigurationProvider<T>, Set<string>>
): T {
  const visitedMap = visited ?? new Map<ConfigurationProvider<T>, Set<string>>();
  this.provenance = new Map();

  let combined: T = {} as T;

  for (const provider of this.providers) {
    if (isAggregateConfigProvider(provider)) {
      const childResult = provider.load(configurationRoot, visitedMap);
      // Merge: existing combined keys win (first-registered precedence)
      for (const key of Object.keys(childResult as any)) {
        if (!(key in (combined as any))) {
          (combined as any)[key] = (childResult as any)[key];
          // Inherit provenance from child aggregate
          const childOwner = provider.provenance.get(key);
          if (childOwner) {
            this.provenance.set(key, childOwner);
          }
        }
      }
    } else {
      const filename = provider.resolve(configurationRoot);
      if (filename) {
        const loaderVisited = visitedMap.get(provider) ?? new Set<string>();
        if (loaderVisited.has(filename)) {
          throw new Error(
            `Circular reference detected in configuration file: ${filename}. This is likely caused by an "extends" property pointing to a directory which doesn't contain a configuration file.`
          );
        }
        loaderVisited.add(filename);
        visitedMap.set(provider, loaderVisited);

        const loaded = this.loadWithExtends(
          filename,
          provider,
          configurationRoot,
          visitedMap
        );

        // Merge: existing combined keys win (first-registered precedence)
        for (const key of Object.keys(loaded as any)) {
          if (!(key in (combined as any))) {
            (combined as any)[key] = (loaded as any)[key];
            this.provenance.set(key, provider);
          }
        }
      }
    }
  }
  return combined;
}

private loadWithExtends(
  filename: string,
  provider: ConfigurationProvider<T>,
  configurationRoot: string,
  visited: Map<ConfigurationProvider<T>, Set<string>>
): T {
  const loaded = provider.load(filename);
  if (loaded.extends) {
    const extendsRoot = loaded.extends.startsWith('.')
      ? join(configurationRoot, loaded.extends)
      : loaded.extends;
    // Create a temporary aggregate with the same providers to resolve extends
    const extendsAggregate = new AggregateConfigProvider<T>(this.providers);
    const extended = extendsAggregate.load(extendsRoot, visited);
    return { ...extended, ...loaded };
  }
  return loaded;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat(parser): implement AggregateConfigProvider.load with provenance tracking
```

---

### Task 3: Implement `AggregateConfigProvider.updateConfig` with provenance routing

**Files:**
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.ts`
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.spec.ts`

**Step 1: Write the failing tests**

Add to `aggregate-config-provider.spec.ts`:

```typescript
describe('updateConfig', () => {
  it('should route updates to the provider that owns each key', async () => {
    const updatedA: any[] = [];
    const updatedB: any[] = [];

    const providerA: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
      load: () => ({ foo: 'fromA' }),
      updateConfig: async (updater) => {
        const result =
          typeof updater === 'function' ? await updater({ foo: 'fromA' }) : updater;
        updatedA.push(result);
      },
    };
    const providerB: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configB' : undefined),
      load: () => ({ bar: 2 }),
      updateConfig: async (updater) => {
        const result =
          typeof updater === 'function' ? await updater({ bar: 2 }) : updater;
        updatedB.push(result);
      },
    };

    const aggregate = new AggregateConfigProvider([providerA, providerB]);
    aggregate.load('/root');

    await aggregate.updateConfig({ foo: 'newFoo', bar: 99 });

    expect(updatedA).toEqual([{ foo: 'newFoo' }]);
    expect(updatedB).toEqual([{ bar: 99 }]);
  });

  it('should route unknown keys to the first resolving provider', async () => {
    const updatedA: any[] = [];

    const providerA: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
      load: () => ({ foo: 'fromA' }),
      updateConfig: async (updater) => {
        const result =
          typeof updater === 'function' ? await updater({ foo: 'fromA' }) : updater;
        updatedA.push(result);
      },
    };

    const aggregate = new AggregateConfigProvider([providerA]);
    aggregate.load('/root');

    await aggregate.updateConfig({ newKey: 'newValue' } as any);

    expect(updatedA).toEqual([{ foo: 'fromA', newKey: 'newValue' }]);
  });

  it('should throw if the target provider does not support updateConfig', async () => {
    const providerA: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
      load: () => ({ foo: 'fromA' }),
      // no updateConfig
    };

    const aggregate = new AggregateConfigProvider([providerA]);
    aggregate.load('/root');

    await expect(
      aggregate.updateConfig({ foo: 'newFoo' })
    ).rejects.toThrow(/updateConfig/);
  });

  it('should throw if no providers resolve (no provenance, no fallback)', async () => {
    const providerA: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({}),
    };

    const aggregate = new AggregateConfigProvider([providerA]);
    aggregate.load('/root');

    await expect(
      aggregate.updateConfig({ foo: 'newFoo' })
    ).rejects.toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: FAIL — `updateConfig` throws "Not implemented"

**Step 3: Write the implementation**

Replace the `updateConfig` method in `aggregate-config-provider.ts`. The aggregate also needs to remember the `configurationRoot` used during `load` so that `updateConfig` can find the fallback provider.

```typescript
// Add a private field:
private lastConfigurationRoot?: string;

// In load(), set it at the start:
// this.lastConfigurationRoot = configurationRoot;

async updateConfig(values: Partial<T>): Promise<void> {
  // Group keys by their owning provider
  const updatesByProvider = new Map<ConfigurationProvider<T>, Partial<T>>();

  // Find the first leaf provider that resolves (fallback for new keys)
  let fallbackProvider: ConfigurationProvider<T> | undefined;
  if (this.lastConfigurationRoot) {
    fallbackProvider = this.findFirstResolvingProvider(
      this.lastConfigurationRoot
    );
  }

  for (const key of Object.keys(values) as (keyof T & string)[]) {
    const owner = this.provenance.get(key) ?? fallbackProvider;
    if (!owner) {
      throw new Error(
        `Cannot update config key "${key}": no provider resolved and no fallback available. ` +
          'Ensure at least one configuration file exists.'
      );
    }
    if (!owner.updateConfig) {
      throw new Error(
        `Cannot update config key "${key}": the owning provider does not implement updateConfig.`
      );
    }
    const existing = updatesByProvider.get(owner) ?? ({} as Partial<T>);
    (existing as any)[key] = values[key];
    updatesByProvider.set(owner, existing);
  }

  // Call each provider's updateConfig with an updater that merges the partial update
  const promises: Promise<void>[] = [];
  for (const [provider, partial] of updatesByProvider) {
    promises.push(
      provider.updateConfig!((current) => ({ ...current, ...partial }))
    );
  }
  await Promise.all(promises);
}

private findFirstResolvingProvider(
  configurationRoot: string
): ConfigurationProvider<T> | undefined {
  for (const provider of this.providers) {
    if (isAggregateConfigProvider(provider)) {
      const found = provider.findFirstResolvingProvider(configurationRoot);
      if (found) return found;
    } else {
      if (provider.resolve(configurationRoot)) return provider;
    }
  }
  return undefined;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat(parser): implement AggregateConfigProvider.updateConfig with provenance routing
```

---

### Task 4: Implement `AggregateConfigProvider.describeConfig`

**Files:**
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.ts`
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.spec.ts`

**Step 1: Write the failing test**

```typescript
describe('describeConfig', () => {
  it('should aggregate documentation from all children', () => {
    const providerA: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({}),
      describeConfig: () => ({ heading: 'Config A', body: 'Description A' }),
    };
    const providerB: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({}),
      describeConfig: () => ({ heading: 'Config B', body: 'Description B' }),
    };
    const providerC: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({}),
      // no describeConfig
    };

    const aggregate = new AggregateConfigProvider([
      providerA,
      providerB,
      providerC,
    ]);
    expect(aggregate.describeConfig()).toEqual([
      { heading: 'Config A', body: 'Description A' },
      { heading: 'Config B', body: 'Description B' },
    ]);
  });

  it('should flatten nested aggregate documentation', () => {
    const providerA: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({}),
      describeConfig: () => ({ heading: 'A', body: 'A' }),
    };
    const providerB: ConfigurationProvider<any> = {
      resolve: () => undefined,
      load: () => ({}),
      describeConfig: () => ({ heading: 'B', body: 'B' }),
    };
    const inner = new AggregateConfigProvider([providerB]);
    const outer = new AggregateConfigProvider([providerA, inner]);

    expect(outer.describeConfig()).toEqual([
      { heading: 'A', body: 'A' },
      { heading: 'B', body: 'B' },
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: FAIL — returns `[]`

**Step 3: Write the implementation**

```typescript
describeConfig(): ConfigurationDocSection[] {
  const sections: ConfigurationDocSection[] = [];
  for (const provider of this.providers) {
    if (isAggregateConfigProvider(provider)) {
      sections.push(...provider.describeConfig());
    } else if (provider.describeConfig) {
      sections.push(provider.describeConfig());
    }
  }
  return sections;
}
```

**Step 4: Run test to verify it passes**

Run: `npx nx test parser -- src/lib/config-files/aggregate-config-provider.spec.ts`
Expected: PASS

**Step 5: Commit**

```
feat(parser): implement AggregateConfigProvider.describeConfig
```

---

### Task 5: Export `AggregateConfigProvider` from parser package

**Files:**
- Modify: `packages/parser/src/lib/config-files/index.ts`

**Step 1: Add export**

```typescript
export * from './configuration-loader.js';
export * from './json-file-loader.js';
export * from './package-json-loader.js';
export * from './aggregate-config-provider.js';
```

**Step 2: Verify build**

Run: `npx nx build parser`
Expected: PASS

**Step 3: Commit**

```
chore(parser): export AggregateConfigProvider from config-files barrel
```

---

### Task 6: Update parser to accept `AnyConfigProvider` and use `AggregateConfigProvider` internally

**Files:**
- Modify: `packages/parser/src/lib/parser.ts`

The parser needs to:
1. Accept both `ConfigurationProvider` and `AggregateConfigProvider` in its `config()` method
2. Internally maintain a single `AggregateConfigProvider` that wraps all registered providers
3. Replace the `readFromConfig` method to use the aggregate's `load`
4. Expose `updateConfig` and `getConfigurationDocs` through the aggregate

**Step 1: Write the failing tests**

Add to `packages/parser/src/lib/parser.spec.ts`, in the configuration section:

```typescript
it('should support AggregateConfigProvider', () => {
  const { AggregateConfigProvider } = require('./config-files/aggregate-config-provider');

  const providerA: ConfigurationProvider<any> = {
    resolve: (dir) => join(dir, '.configA'),
    load: () => ({ foo: 'fromA' }),
  };
  const providerB: ConfigurationProvider<any> = {
    resolve: (dir) => join(dir, '.configB'),
    load: () => ({ bar: 2 }),
  };
  const aggregate = new AggregateConfigProvider([providerA, providerB]);

  expect(
    parser()
      .option('foo', { type: 'string' })
      .option('bar', { type: 'number' })
      .config(aggregate)
      .parse([])
  ).toEqual({ foo: 'fromA', bar: 2, unmatched: [] });
});
```

**Step 2: Run test to verify it fails**

Run: `npx nx test parser -- src/lib/parser.spec.ts -t "should support AggregateConfigProvider"`
Expected: FAIL — `config()` does not accept `AggregateConfigProvider`

**Step 3: Update parser implementation**

In `packages/parser/src/lib/parser.ts`:

1. Import `AggregateConfigProvider`, `AnyConfigProvider`, and `isAggregateConfigProvider`
2. Change the type of `configuredConfigurationProviders` to `AnyConfigProvider<TArgs>[]`
3. Update `config()` to accept `AnyConfigProvider<TArgs>`
4. Update `readFromConfig` to handle both provider types — wrap all providers in an ad-hoc `AggregateConfigProvider` for resolution
5. Update `getConfigurationDocs` to handle aggregate providers
6. Add a public `updateConfig` method that delegates to an `AggregateConfigProvider`
7. Update `clone()` to copy the providers array correctly

Key changes:

```typescript
import {
  AggregateConfigProvider,
  AnyConfigProvider,
  isAggregateConfigProvider,
} from './config-files/aggregate-config-provider';

// Change type:
private configuredConfigurationProviders: AnyConfigProvider<TArgs>[] = [];

// Update config():
config(provider: AnyConfigProvider<TArgs>) {
  this.configuredConfigurationProviders.push(provider);
  return this;
}

// Update readFromConfig() — use an AggregateConfigProvider internally:
private cachedAggregate?: AggregateConfigProvider<TArgs>;

private readFromConfig(configuration: InternalOptionConfig) {
  if (
    this.cachedConfig === undefined ||
    this.cachedConfigKey !== this.configuredConfigurationProviders.length
  ) {
    this.cachedAggregate = new AggregateConfigProvider(
      this.configuredConfigurationProviders
    );
    this.cachedConfig = this.cachedAggregate.load(process.cwd());
    this.cachedConfigKey = this.configuredConfigurationProviders.length;
  }
  return this.cachedConfig?.[configuration.key as keyof TArgs];
}

// Add public updateConfig:
async updateConfig(values: Partial<TArgs>): Promise<void> {
  // Ensure config has been loaded (populates provenance)
  if (!this.cachedAggregate) {
    this.cachedAggregate = new AggregateConfigProvider(
      this.configuredConfigurationProviders
    );
    this.cachedAggregate.load(process.cwd());
  }
  return this.cachedAggregate.updateConfig(values);
}

// Update getConfigurationDocs:
getConfigurationDocs(): ConfigurationDocSection[] {
  const sections: ConfigurationDocSection[] = [];
  for (const provider of this.configuredConfigurationProviders) {
    if (isAggregateConfigProvider(provider)) {
      sections.push(...provider.describeConfig());
    } else if (provider.describeConfig) {
      sections.push(provider.describeConfig());
    }
  }
  return sections;
}
```

Also update the `ReadonlyArgvParser` interface to include `updateConfig`:

```typescript
export interface ReadonlyArgvParser<TArgs extends ParsedArgs> {
  // ... existing members ...
  updateConfig(values: Partial<TArgs>): Promise<void>;
}
```

**Step 4: Run full parser tests**

Run: `npx nx test parser`
Expected: PASS — all existing tests should still pass plus the new one

**Step 5: Commit**

```
feat(parser): integrate AggregateConfigProvider into ArgvParser
```

---

### Task 7: Remove `resolveConfiguration` free function

**Files:**
- Modify: `packages/parser/src/lib/config-files/configuration-loader.ts`
- Modify: `packages/parser/src/lib/parser.ts` (remove import)

**Step 1: Verify no other consumers**

Search for `resolveConfiguration` usage. It should only be imported by `parser.ts` (which we just updated to not use it). If other files import it, they need updating too.

Run: `grep -r "resolveConfiguration" packages/`

**Step 2: Remove the function**

In `configuration-loader.ts`, remove the `resolveConfiguration` function and its `join` import (lines 1, 52-100). Keep the `ConfigurationProvider` and `ConfigurationDocSection` types.

**Step 3: Remove the import from parser.ts**

Update the import in `parser.ts` to no longer import `resolveConfiguration`:

```typescript
import {
  ConfigurationDocSection,
  ConfigurationProvider,
} from './config-files/configuration-loader';
```

**Step 4: Run full parser tests**

Run: `npx nx test parser`
Expected: PASS

**Step 5: Commit**

```
refactor(parser): remove resolveConfiguration in favor of AggregateConfigProvider
```

---

### Task 8: Update `getJsonFileConfigLoader` for multi-filename → `AggregateConfigProvider`

**Files:**
- Modify: `packages/parser/src/lib/config-files/json-file-loader.ts`

Currently, `getJsonFileConfigLoader` when given `string[]` does its own multi-file crawl inside a single provider. Change it to create individual providers and wrap them in an `AggregateConfigProvider`.

**Step 1: Write the failing test**

File: `packages/parser/src/lib/config-files/json-file-loader.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getJsonFileConfigLoader } from './json-file-loader';
import { isAggregateConfigProvider } from './aggregate-config-provider';

describe('getJsonFileConfigLoader', () => {
  it('should return a ConfigurationProvider for a single filename', () => {
    const loader = getJsonFileConfigLoader('config.json');
    expect(isAggregateConfigProvider(loader)).toBe(false);
    expect(loader).toHaveProperty('resolve');
  });

  it('should return an AggregateConfigProvider for multiple filenames', () => {
    const loader = getJsonFileConfigLoader(['config.json', 'alt.config.json']);
    expect(isAggregateConfigProvider(loader)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx nx test parser -- src/lib/config-files/json-file-loader.spec.ts`
Expected: FAIL — multi-filename still returns a single `ConfigurationProvider`

**Step 3: Update implementation**

The return type of `getJsonFileConfigLoader` needs to change. When given a `string[]`, it returns `AggregateConfigProvider<T>`. When given a `string`, it returns `ConfigurationProvider<T>`.

Update `json-file-loader.ts`:

```typescript
import {
  AggregateConfigProvider,
  AnyConfigProvider,
} from './aggregate-config-provider.js';

export function getJsonFileConfigLoader<T>(
  filename: string,
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): ConfigurationProvider<T>;
export function getJsonFileConfigLoader<T>(
  filename: string[],
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): AggregateConfigProvider<T>;
export function getJsonFileConfigLoader<T>(
  filename: string | string[],
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): AnyConfigProvider<T> {
  if (Array.isArray(filename)) {
    const providers = filename.map((f) =>
      getJsonFileConfigLoader(f, transform, writeTransform)
    );
    return new AggregateConfigProvider(providers);
  }

  // ... existing single-file JsonFileConfigLoader class
  // Remove the multi-filename crawl logic from resolve()
  // since filenames is always a single string now
}
```

Simplify the `JsonFileConfigLoader.resolve` method since it now only handles a single filename:

```typescript
resolve(configurationRoot: string) {
  const nearestFile = traverseForFile(filename, configurationRoot);
  if (nearestFile && nearestFile.endsWith('.json')) {
    return nearestFile;
  }
  return undefined;
}
```

Also simplify `describeConfig`, `updateConfig`, and the `inspect.custom` methods since `filenames` is now just a single `string`.

**Step 4: Run tests**

Run: `npx nx test parser`
Expected: PASS

**Step 5: Commit**

```
refactor(parser): getJsonFileConfigLoader returns AggregateConfigProvider for multi-filename
```

---

### Task 9: Update CLI layer to accept `AnyConfigProvider` and expose `updateConfig`

**Files:**
- Modify: `packages/cli-forge/src/lib/public-api.ts`
- Modify: `packages/cli-forge/src/lib/internal-cli.ts`

**Step 1: Update the public API type**

In `public-api.ts`, update the `config` method signature:

```typescript
import { ConfigurationFiles } from '@cli-forge/parser';

// In the CLI interface:
config(
  provider: ConfigurationFiles.AnyConfigProvider<TArgs>
): CLI<TArgs, THandlerReturn, TChildren, TParent>;

updateConfig(values: Partial<TArgs>): Promise<void>;
```

**Step 2: Update the internal CLI implementation**

In `internal-cli.ts`:

```typescript
config(
  provider: ConfigurationFiles.AnyConfigProvider<TArgs>
): CLI<TArgs, THandlerReturn, TChildren, TParent> {
  this.parser.config(
    provider as ConfigurationFiles.AnyConfigProvider<any>
  );
  return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
}

async updateConfig(values: Partial<TArgs>): Promise<void> {
  return this.parser.updateConfig(values);
}
```

**Step 3: Run CLI tests**

Run: `npx nx test cli-forge`
Expected: PASS

**Step 4: Run full build**

Run: `npx nx run-many -t build`
Expected: PASS

**Step 5: Commit**

```
feat(cli-forge): expose updateConfig and accept AnyConfigProvider in CLI layer
```

---

### Task 10: Update existing documentation example and add updateConfig example

**Files:**
- Modify: `packages/cli-forge/src/lib/configuration-providers.ts` (update `JsonFile` return type)

**Step 1: Update `ConfigurationProviders.JsonFile` return type**

When `filename` is an array, the return type should be `AggregateConfigProvider`:

```typescript
JsonFile<T>(filename: string, key?: string): ConfigurationFiles.ConfigurationProvider<T>;
JsonFile<T>(filename: string[], key?: string): ConfigurationFiles.AggregateConfigProvider<T>;
JsonFile<T>(filename: string | string[], key?: string): ConfigurationFiles.AnyConfigProvider<T> {
  // ... existing implementation (getJsonFileConfigLoader handles the split)
}
```

**Step 2: Run full build and all tests**

Run: `npx nx run-many -t build test`
Expected: PASS

**Step 3: Commit**

```
feat(cli-forge): update ConfigurationProviders.JsonFile overloads for aggregate return type
```

---

### Task 11: Final integration test — end-to-end updateConfig with multiple providers

**Files:**
- Modify: `packages/parser/src/lib/config-files/aggregate-config-provider.spec.ts`

**Step 1: Write integration test**

```typescript
describe('integration: multi-provider updateConfig', () => {
  it('should route updates to correct providers across nested aggregates', async () => {
    const updatesA: any[] = [];
    const updatesB: any[] = [];
    const updatesC: any[] = [];

    const providerA: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
      load: () => ({ name: 'fromA', debug: false }),
      updateConfig: async (updater) => {
        const result =
          typeof updater === 'function'
            ? await updater({ name: 'fromA', debug: false })
            : updater;
        updatesA.push(result);
      },
    };
    const providerB: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configB' : undefined),
      load: () => ({ port: 3000 }),
      updateConfig: async (updater) => {
        const result =
          typeof updater === 'function'
            ? await updater({ port: 3000 })
            : updater;
        updatesB.push(result);
      },
    };
    const providerC: ConfigurationProvider<any> = {
      resolve: (dir) => (dir === '/root' ? '/root/.configC' : undefined),
      load: () => ({ host: 'localhost' }),
      updateConfig: async (updater) => {
        const result =
          typeof updater === 'function'
            ? await updater({ host: 'localhost' })
            : updater;
        updatesC.push(result);
      },
    };

    const inner = new AggregateConfigProvider([providerB, providerC]);
    const outer = new AggregateConfigProvider([providerA, inner]);

    outer.load('/root');

    // Update keys from different providers
    await outer.updateConfig({
      name: 'newName',
      port: 8080,
      host: '0.0.0.0',
    });

    // Each provider should only receive its own keys
    expect(updatesA).toEqual([{ name: 'newName', debug: false }]);
    expect(updatesB).toEqual([{ port: 8080 }]);
    expect(updatesC).toEqual([{ host: '0.0.0.0' }]);
  });
});
```

**Step 2: Run all tests**

Run: `npx nx run-many -t test`
Expected: PASS

**Step 3: Commit**

```
test(parser): add integration test for multi-provider updateConfig routing
```

---

## Summary of changes

| File | Change |
|------|--------|
| `packages/parser/src/lib/config-files/aggregate-config-provider.ts` | **New** — `AggregateConfigProvider` class, `AnyConfigProvider` type, `isAggregateConfigProvider` guard |
| `packages/parser/src/lib/config-files/aggregate-config-provider.spec.ts` | **New** — comprehensive tests for load, provenance, updateConfig, describeConfig |
| `packages/parser/src/lib/config-files/configuration-loader.ts` | Remove `resolveConfiguration` function, keep types |
| `packages/parser/src/lib/config-files/json-file-loader.ts` | Multi-filename returns `AggregateConfigProvider`; single-filename simplified |
| `packages/parser/src/lib/config-files/json-file-loader.spec.ts` | **New** — tests for single vs multi-filename return types |
| `packages/parser/src/lib/config-files/index.ts` | Export `aggregate-config-provider` |
| `packages/parser/src/lib/parser.ts` | Accept `AnyConfigProvider`, use `AggregateConfigProvider` internally, expose `updateConfig` |
| `packages/cli-forge/src/lib/public-api.ts` | Add `updateConfig` method, widen `config` param type |
| `packages/cli-forge/src/lib/internal-cli.ts` | Implement `updateConfig`, widen `config` param type |
| `packages/cli-forge/src/lib/configuration-providers.ts` | Overloads for `JsonFile` returning aggregate |
