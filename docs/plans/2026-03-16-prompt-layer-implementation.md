# Prompt Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a provider-based prompting layer to cli-forge that fulfills missing option values by prompting users interactively.

**Architecture:** The prompt system lives entirely in the CLI layer (`packages/cli-forge`). Options get a `prompt` property. Providers are registered via `.withPromptProvider()`. During `forge()`, after the discovery loop and before the final strict parse, promptable options are collected, matched to providers, and prompted. A clack provider is shipped under a separate entry point.

**Tech Stack:** TypeScript, vitest, @clack/prompts (optional peer dep)

---

### Task 1: Define prompt types

**Files:**
- Create: `packages/cli-forge/src/lib/prompt-types.ts`

**Step 1: Create the prompt types file**

```typescript
// packages/cli-forge/src/lib/prompt-types.ts
import type { InternalOptionConfig } from '@cli-forge/parser';

/**
 * Static prompt configuration for an option.
 * - `true` — always prompt
 * - `string` — always prompt with this label
 * - `false` — never prompt
 */
export type PromptConfig = boolean | string;

/**
 * Full prompt configuration, including dynamic resolution.
 * When a function is provided, it receives accumulated args and returns
 * a static PromptConfig. Returning null/undefined from the callback
 * is treated as falsy (don't prompt).
 */
export type PromptOptionConfig<TArgs = unknown> =
  | PromptConfig
  | ((args: Partial<TArgs>) => PromptConfig | null | undefined);

/**
 * An option that needs prompting, passed to prompt providers.
 */
export interface PromptOption {
  /** The option name (key) */
  name: string;
  /** The full option config from the parser, with resolved prompt value */
  config: InternalOptionConfig & { prompt?: PromptConfig };
}

/**
 * A prompt provider that can fulfill missing option values interactively.
 */
export interface PromptProvider {
  /**
   * If provided, this provider only handles options where filter returns true.
   * Providers without filters act as fallbacks.
   */
  filter?: (name: string, config: InternalOptionConfig) => boolean;
  /**
   * Prompt for a single option. Called per-option if promptBatch is not defined.
   */
  prompt?: (option: PromptOption) => Promise<unknown>;
  /**
   * Prompt for multiple options at once. Preferred over prompt when available.
   */
  promptBatch?: (options: PromptOption[]) => Promise<Record<string, unknown>>;
}
```

**Step 2: Export from index**

Add to `packages/cli-forge/src/index.ts`:

```typescript
export type { PromptConfig, PromptOptionConfig, PromptOption, PromptProvider } from './lib/prompt-types';
```

**Step 3: Commit**

```bash
git add packages/cli-forge/src/lib/prompt-types.ts packages/cli-forge/src/index.ts
git commit -m "feat(cli-forge): add prompt provider type definitions"
```

---

### Task 2: Add prompt storage and `withPromptProvider` to InternalCLI

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.ts`
- Modify: `packages/cli-forge/src/lib/public-api.ts`

**Step 1: Write failing test**

Add to `packages/cli-forge/src/lib/internal-cli.spec.ts`:

```typescript
describe('prompt providers', () => {
  it('should register a prompt provider via withPromptProvider', () => {
    const provider: PromptProvider = {
      prompt: async (option) => 'test-value',
    };
    const app = cli('test').withPromptProvider(provider);
    // Should return CLI for chaining
    expect(app).toBeDefined();
  });

  it('should throw if provider has neither prompt nor promptBatch', () => {
    expect(() => {
      cli('test').withPromptProvider({} as any);
    }).toThrow(/must implement at least one of/);
  });
});
```

Import `PromptProvider` from `'../prompt-types'` (or wherever types end up) at top of test file.

**Step 2: Run test to verify it fails**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: FAIL — `withPromptProvider` does not exist.

**Step 3: Add `withPromptProvider` to CLI interface**

In `packages/cli-forge/src/lib/public-api.ts`, add to the `CLI` interface (after the `errorHandler` method around line 425):

```typescript
  /**
   * Registers a prompt provider for interactive option fulfillment.
   * Multiple providers can be registered. Filtered providers are checked first
   * (in registration order), then fallback providers (no filter).
   *
   * @param provider The prompt provider to register.
   */
  withPromptProvider(
    provider: PromptProvider
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;
```

Add `PromptProvider` to imports from `'./prompt-types'`.

**Step 4: Add prompt storage and `withPromptProvider` to InternalCLI**

In `packages/cli-forge/src/lib/internal-cli.ts`:

1. Import `PromptProvider` and `PromptOptionConfig` from `'./prompt-types'`.

2. Add storage fields to `InternalCLI` class (after `registeredInitHooks` around line 123):

```typescript
  private registeredPromptProviders: PromptProvider[] = [];

  /**
   * Stores prompt config for each option, keyed by option name.
   * Set when .option() is called with a `prompt` property.
   */
  promptConfigs: Map<string, PromptOptionConfig<any>> = new Map();
```

3. Add `withPromptProvider` method (after `errorHandler` around line 830):

```typescript
  withPromptProvider(
    provider: PromptProvider
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    if (!provider.prompt && !provider.promptBatch) {
      throw new Error(
        'Prompt provider must implement at least one of \'prompt\' or \'promptBatch\''
      );
    }
    this.registeredPromptProviders.push(provider);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }
```

**Step 5: Run test to verify it passes**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.ts packages/cli-forge/src/lib/public-api.ts packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "feat(cli-forge): add withPromptProvider registration method"
```

---

### Task 3: Intercept `prompt` from option configs

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.ts`
- Modify: `packages/cli-forge/src/lib/public-api.ts`

The `option()` and `positional()` methods on InternalCLI need to:
1. Accept configs with an optional `prompt` property
2. Strip `prompt` before delegating to the parser
3. Store the prompt config in `promptConfigs`

**Step 1: Write failing test**

Add to the `describe('prompt providers')` block in `internal-cli.spec.ts`:

```typescript
  it('should store prompt config from option registration', () => {
    const app = cli('test')
      .option('name', { type: 'string', prompt: true } as any)
      .option('age', { type: 'number', prompt: 'How old are you?' } as any)
      .option('debug', { type: 'boolean' });

    const internal = app as unknown as InternalCLI;
    expect(internal.promptConfigs.get('name')).toBe(true);
    expect(internal.promptConfigs.get('age')).toBe('How old are you?');
    expect(internal.promptConfigs.has('debug')).toBe(false);
  });
```

**Step 2: Run test to verify it fails**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: FAIL — `promptConfigs` is empty.

**Step 3: Update `option()` and `positional()` in InternalCLI**

In `packages/cli-forge/src/lib/internal-cli.ts`, modify the `option` method (lines 372-379):

```typescript
  option<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(name: TOption, config: TOptionConfig & { prompt?: PromptOptionConfig<TArgs> }) {
    const { prompt, ...parserConfig } = config;
    if (prompt !== undefined) {
      this.promptConfigs.set(name, prompt);
    }
    this.parser.option(name, parserConfig as TOptionConfig);
    return this as any;
  }
```

Do the same for `positional()` (lines 381-388):

```typescript
  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(name: TOption, config: TOptionConfig & { prompt?: PromptOptionConfig<TArgs> }) {
    const { prompt, ...parserConfig } = config;
    if (prompt !== undefined) {
      this.promptConfigs.set(name, prompt);
    }
    this.parser.positional(name, parserConfig as TOptionConfig);
    return this as any;
  }
```

**Step 4: Update CLI interface option overloads**

In `packages/cli-forge/src/lib/public-api.ts`, each of the 6 `option()` overloads and 6 `positional()` overloads needs its config parameter extended with `& { prompt?: PromptOptionConfig<TArgs> }`.

For example, the string option overload (line 458-472) changes from:

```typescript
  option<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<...>;
```

To:

```typescript
  option<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<...>;
```

Apply this same `& { prompt?: PromptOptionConfig<TArgs> }` addition to the config parameter of all 12 overloads (6 for `option`, 6 for `positional`).

Import `PromptOptionConfig` from `'./prompt-types'` at the top.

**Step 5: Run test to verify it passes**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.ts packages/cli-forge/src/lib/public-api.ts packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "feat(cli-forge): intercept and store prompt config from option registration"
```

---

### Task 4: Implement prompt resolution logic in `forge()`

**Files:**
- Create: `packages/cli-forge/src/lib/resolve-prompts.ts`
- Modify: `packages/cli-forge/src/lib/internal-cli.ts`

**Step 1: Write failing tests for prompt resolution**

Add to `internal-cli.spec.ts`:

```typescript
describe('prompt resolution in forge', () => {
  it('should prompt for required options with no value when provider exists', async () => {
    const prompted: string[] = [];
    const provider: PromptProvider = {
      prompt: async (option) => {
        prompted.push(option.name);
        return option.name === 'name' ? 'Alice' : 42;
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('name', { type: 'string', required: true })
      .option('age', { type: 'number', required: true })
      .withPromptProvider(provider);

    await app.forge([]);
    expect(prompted).toContain('name');
    expect(prompted).toContain('age');
  });

  it('should not prompt for options with values already provided', async () => {
    const prompted: string[] = [];
    const provider: PromptProvider = {
      prompt: async (option) => {
        prompted.push(option.name);
        return 'value';
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('name', { type: 'string', required: true })
      .withPromptProvider(provider);

    await app.forge(['--name', 'Bob']);
    expect(prompted).not.toContain('name');
  });

  it('should prompt when prompt is true even if not required', async () => {
    const prompted: string[] = [];
    const provider: PromptProvider = {
      prompt: async (option) => {
        prompted.push(option.name);
        return 'value';
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('name', { type: 'string', prompt: true } as any)
      .withPromptProvider(provider);

    await app.forge([]);
    expect(prompted).toContain('name');
  });

  it('should not prompt when prompt is false even if required', async () => {
    const prompted: string[] = [];
    const provider: PromptProvider = {
      prompt: async (option) => {
        prompted.push(option.name);
        return 'value';
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('name', { type: 'string', required: true, prompt: false } as any)
      .withPromptProvider(provider);

    // This will throw due to required validation, but should not prompt
    await expect(app.forge([])).rejects.toThrow();
    expect(prompted).not.toContain('name');
  });

  it('should use prompt callback to resolve config', async () => {
    const prompted: string[] = [];
    const provider: PromptProvider = {
      prompt: async (option) => {
        prompted.push(option.name);
        return 'value';
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('token', {
        type: 'string',
        prompt: (args: any) => (args.authFile ? false : 'Enter token'),
      } as any)
      .withPromptProvider(provider);

    await app.forge([]);
    expect(prompted).toContain('token');
  });

  it('should throw when prompting needed but no provider registered', async () => {
    const app = cli('test', {
      handler: () => {},
    })
      .option('name', { type: 'string', prompt: true } as any);

    await expect(app.forge([])).rejects.toThrow(/no prompt provider/i);
  });

  it('should use filtered providers before fallback providers', async () => {
    const calls: Array<{ provider: string; option: string }> = [];
    const filteredProvider: PromptProvider = {
      filter: (name) => name === 'secret',
      prompt: async (option) => {
        calls.push({ provider: 'filtered', option: option.name });
        return 'secret-value';
      },
    };
    const fallbackProvider: PromptProvider = {
      prompt: async (option) => {
        calls.push({ provider: 'fallback', option: option.name });
        return 'fallback-value';
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('name', { type: 'string', prompt: true } as any)
      .option('secret', { type: 'string', prompt: true } as any)
      .withPromptProvider(filteredProvider)
      .withPromptProvider(fallbackProvider);

    await app.forge([]);
    expect(calls).toContainEqual({ provider: 'filtered', option: 'secret' });
    expect(calls).toContainEqual({ provider: 'fallback', option: 'name' });
  });

  it('should prefer promptBatch over prompt when available', async () => {
    let batchCalled = false;
    const provider: PromptProvider = {
      promptBatch: async (options) => {
        batchCalled = true;
        const result: Record<string, unknown> = {};
        for (const opt of options) {
          result[opt.name] = 'batch-value';
        }
        return result;
      },
      prompt: async () => {
        throw new Error('Should not be called when promptBatch exists');
      },
    };

    const app = cli('test', {
      handler: () => {},
    })
      .option('a', { type: 'string', prompt: true } as any)
      .option('b', { type: 'string', prompt: true } as any)
      .withPromptProvider(provider);

    await app.forge([]);
    expect(batchCalled).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: FAIL

**Step 3: Create `resolve-prompts.ts`**

```typescript
// packages/cli-forge/src/lib/resolve-prompts.ts
import type { InternalOptionConfig } from '@cli-forge/parser';
import type {
  PromptConfig,
  PromptOption,
  PromptOptionConfig,
  PromptProvider,
} from './prompt-types';

/**
 * Collects options that need prompting, matches them to providers,
 * executes prompts, and returns the prompted values.
 */
export async function resolvePrompts(opts: {
  configuredOptions: Record<string, InternalOptionConfig>;
  configuredImplies: Record<string, Set<string>>;
  promptConfigs: Map<string, PromptOptionConfig<any>>;
  providers: PromptProvider[];
  currentArgs: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const { configuredOptions, configuredImplies, promptConfigs, providers, currentArgs } = opts;

  // Step 1: Collect promptable options
  const promptableOptions: PromptOption[] = [];

  for (const [name, config] of Object.entries(configuredOptions)) {
    // Skip internal options
    if (name === 'help' || name === 'version' || name === 'unmatched' || name === '--') {
      continue;
    }

    // Already has a value — skip unless prompt is explicitly true/string
    const hasValue = currentArgs[name] !== undefined;

    const promptSetting = promptConfigs.get(name);
    let resolved: PromptConfig | null | undefined;

    if (typeof promptSetting === 'function') {
      resolved = promptSetting(currentArgs);
      // Callback: null/undefined treated as false
      if (resolved === null || resolved === undefined) {
        continue;
      }
    } else if (promptSetting !== undefined) {
      // Static value
      resolved = promptSetting;
    } else {
      // Not specified: prompt only if required and missing value
      if (hasValue) continue;

      const isRequired = config.required === true;
      const isImplied = isOptionImplied(name, configuredImplies, currentArgs);

      if (!isRequired && !isImplied) continue;
      if (providers.length === 0) continue; // No providers, let validation handle it

      resolved = true; // Will prompt
    }

    if (resolved === false) continue;
    if (hasValue && resolved === undefined) continue;

    promptableOptions.push({
      name,
      config: {
        ...config,
        prompt: resolved === true ? true : resolved,
      },
    });
  }

  if (promptableOptions.length === 0) {
    return {};
  }

  // Step 2: Match options to providers
  const filteredProviders = providers.filter((p) => p.filter);
  const fallbackProviders = providers.filter((p) => !p.filter);

  const providerGroups = new Map<PromptProvider, PromptOption[]>();
  const unmatchedOptions: PromptOption[] = [];

  for (const option of promptableOptions) {
    let matched = false;
    for (const provider of filteredProviders) {
      if (provider.filter!(option.name, option.config)) {
        if (!providerGroups.has(provider)) {
          providerGroups.set(provider, []);
        }
        providerGroups.get(provider)!.push(option);
        matched = true;
        break;
      }
    }
    if (!matched) {
      unmatchedOptions.push(option);
    }
  }

  // Assign unmatched options to first fallback provider
  if (unmatchedOptions.length > 0) {
    if (fallbackProviders.length === 0) {
      const names = unmatchedOptions.map((o) => `'${o.name}'`).join(', ');
      throw new Error(
        `Option(s) ${names} require prompting but no prompt provider is available`
      );
    }
    const fallback = fallbackProviders[0];
    if (!providerGroups.has(fallback)) {
      providerGroups.set(fallback, []);
    }
    providerGroups.get(fallback)!.push(...unmatchedOptions);
  }

  // Step 3: Execute prompts
  const results: Record<string, unknown> = {};

  for (const [provider, options] of providerGroups) {
    if (provider.promptBatch) {
      const batchResults = await provider.promptBatch(options);
      Object.assign(results, batchResults);
    } else if (provider.prompt) {
      for (const option of options) {
        results[option.name] = await provider.prompt(option);
      }
    }
  }

  return results;
}

/**
 * Check if an option is implied by another option that has been set.
 */
function isOptionImplied(
  name: string,
  configuredImplies: Record<string, Set<string>>,
  currentArgs: Record<string, unknown>
): boolean {
  for (const [trigger, implied] of Object.entries(configuredImplies)) {
    if (implied.has(name) && currentArgs[trigger] !== undefined) {
      return true;
    }
  }
  return false;
}
```

**Step 4: Integrate into `forge()` in InternalCLI**

In `packages/cli-forge/src/lib/internal-cli.ts`, import `resolvePrompts`:

```typescript
import { resolvePrompts } from './resolve-prompts';
```

In the `forge` method, insert the prompting step **after the discovery loop break** (after line 1021 `currentCmd = nextCmd;`) and **before the final parse** (before line 1028 `try {`).

Insert between the `// All builders and init hooks have run.` comment (line 1023) and the `try {` (line 1028):

```typescript
      // Prompt for missing option values before final validation.
      // Collect prompt providers from the full command chain.
      const allPromptProviders: PromptProvider[] = [
        ...this.registeredPromptProviders,
      ];
      const allPromptConfigs = new Map(this.promptConfigs);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let walkCmd: InternalCLI<any, any, any, any> = this;
      for (const command of this.commandChain) {
        walkCmd = walkCmd.registeredCommands[command];
        for (const p of walkCmd.registeredPromptProviders) {
          allPromptProviders.push(p);
        }
        for (const [k, v] of walkCmd.promptConfigs) {
          allPromptConfigs.set(k, v);
        }
      }

      if (allPromptProviders.length > 0 || allPromptConfigs.size > 0) {
        const promptedValues = await resolvePrompts({
          configuredOptions: this.parser.configuredOptions as Record<string, any>,
          configuredImplies: this.parser.configuredImplies,
          promptConfigs: allPromptConfigs,
          providers: allPromptProviders,
          currentArgs: mergedArgs,
        });

        // Inject prompted values into accumulated args
        for (const [key, value] of Object.entries(promptedValues)) {
          if (value !== undefined) {
            mergedArgs[key] = value;
          }
        }
      }
```

**Step 5: Run tests to verify they pass**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add packages/cli-forge/src/lib/resolve-prompts.ts packages/cli-forge/src/lib/internal-cli.ts packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "feat(cli-forge): implement prompt resolution in forge() lifecycle"
```

---

### Task 5: Add unit tests for `resolvePrompts` directly

**Files:**
- Create: `packages/cli-forge/src/lib/resolve-prompts.spec.ts`

**Step 1: Write unit tests**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { resolvePrompts } from './resolve-prompts';
import type { InternalOptionConfig } from '@cli-forge/parser';
import type { PromptProvider } from './prompt-types';

function makeConfig(overrides: Partial<InternalOptionConfig> = {}): InternalOptionConfig {
  return {
    type: 'string',
    key: 'test',
    ...overrides,
  } as InternalOptionConfig;
}

describe('resolvePrompts', () => {
  it('should return empty object when no options need prompting', async () => {
    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name' }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [],
      currentArgs: { name: 'Alice' },
    });
    expect(result).toEqual({});
  });

  it('should prompt for required options missing values', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('prompted-value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name', required: true }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({ name: 'prompted-value' });
    expect(provider.prompt).toHaveBeenCalledOnce();
  });

  it('should call prompt callback with current args', async () => {
    const promptFn = vi.fn().mockReturnValue('Enter token');
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('token-value'),
    };

    await resolvePrompts({
      configuredOptions: {
        token: makeConfig({ key: 'token' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([['token', promptFn]]),
      providers: [provider],
      currentArgs: { someFlag: true },
    });

    expect(promptFn).toHaveBeenCalledWith({ someFlag: true });
  });

  it('should prompt for implied options', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        output: makeConfig({ key: 'output' }),
        format: makeConfig({ key: 'format' }),
      },
      configuredImplies: { output: new Set(['format']) },
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: { output: '/tmp/out' },
    });

    expect(result).toEqual({ format: 'value' });
  });

  it('should group options by matched provider for batch calls', async () => {
    const batchProvider: PromptProvider = {
      filter: (name) => name.startsWith('db'),
      promptBatch: vi.fn().mockResolvedValue({ dbHost: 'localhost', dbPort: 5432 }),
    };
    const fallbackProvider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('fallback'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        dbHost: makeConfig({ key: 'dbHost' }),
        dbPort: makeConfig({ key: 'dbPort' }),
        name: makeConfig({ key: 'name' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([
        ['dbHost', true],
        ['dbPort', true],
        ['name', true],
      ]),
      providers: [batchProvider, fallbackProvider],
      currentArgs: {},
    });

    expect(batchProvider.promptBatch).toHaveBeenCalledOnce();
    expect(fallbackProvider.prompt).toHaveBeenCalledOnce();
    expect(result).toEqual({ dbHost: 'localhost', dbPort: 5432, name: 'fallback' });
  });
});
```

**Step 2: Run tests**

```bash
nx test cli-forge -- src/lib/resolve-prompts.spec.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/cli-forge/src/lib/resolve-prompts.spec.ts
git commit -m "test(cli-forge): add unit tests for resolvePrompts"
```

---

### Task 6: Create clack prompt provider

**Files:**
- Create: `packages/cli-forge/src/prompt-providers/clack.ts`
- Modify: `packages/cli-forge/package.json`

**Step 1: Add `@clack/prompts` as optional peer dependency**

In `packages/cli-forge/package.json`, add to `peerDependencies`:

```json
"@clack/prompts": "catalog:"
```

And to `peerDependenciesMeta`:

```json
"@clack/prompts": {
  "optional": true
}
```

Add the export entry:

```json
"./prompt-providers/clack": {
  "require": "./dist/prompt-providers/clack.js",
  "types": "./dist/prompt-providers/clack.d.ts"
}
```

**Step 2: Check if `@clack/prompts` is in the pnpm catalog**

```bash
cat pnpm-workspace.yaml
```

If not present, add it. Then install:

```bash
pnpm install
```

**Step 3: Create the clack provider**

```typescript
// packages/cli-forge/src/prompt-providers/clack.ts
import type { PromptOption, PromptProvider } from '../lib/prompt-types';

/**
 * Creates a prompt provider backed by @clack/prompts.
 * Requires `@clack/prompts` as a peer dependency.
 */
export function createClackPromptProvider(): PromptProvider {
  return {
    async promptBatch(options: PromptOption[]): Promise<Record<string, unknown>> {
      const clack = await import('@clack/prompts');

      const results: Record<string, unknown> = {};

      for (const option of options) {
        const message = getLabel(option);
        const defaultValue = getDefault(option.config);

        let value: unknown;

        if (option.config.type === 'boolean') {
          value = await clack.confirm({
            message,
            initialValue: defaultValue as boolean | undefined,
          });
        } else if (hasChoices(option.config)) {
          const choices = getChoices(option.config);
          if (option.config.type === 'array') {
            value = await clack.multiselect({
              message,
              options: choices.map((c) => ({ value: c, label: String(c) })),
            });
          } else {
            value = await clack.select({
              message,
              options: choices.map((c) => ({ value: c, label: String(c) })),
            });
          }
        } else if (option.config.type === 'number') {
          const raw = await clack.text({
            message,
            placeholder: defaultValue !== undefined ? String(defaultValue) : undefined,
            defaultValue: defaultValue !== undefined ? String(defaultValue) : undefined,
            validate: (val) => {
              if (val && isNaN(Number(val))) {
                return 'Please enter a valid number';
              }
            },
          });
          value = raw !== undefined && raw !== '' ? Number(raw) : defaultValue;
        } else {
          // string, array without choices
          value = await clack.text({
            message,
            placeholder: defaultValue !== undefined ? String(defaultValue) : undefined,
            defaultValue: defaultValue !== undefined ? String(defaultValue) : undefined,
          });
        }

        // clack returns Symbol when user cancels
        if (clack.isCancel(value)) {
          clack.cancel('Operation cancelled.');
          throw new Error('Prompt cancelled by user');
        }

        results[option.name] = value;
      }

      return results;
    },
  };
}

function getLabel(option: PromptOption): string {
  if (typeof option.config.prompt === 'string') {
    return option.config.prompt;
  }
  return option.config.description ?? option.name;
}

function getDefault(config: PromptOption['config']): unknown {
  if (config.default === undefined) return undefined;
  if (typeof config.default === 'object' && config.default !== null) {
    if ('value' in config.default) return config.default.value;
    if ('factory' in config.default) return config.default.factory();
  }
  return config.default;
}

function hasChoices(config: PromptOption['config']): boolean {
  return config.choices !== undefined;
}

function getChoices(config: PromptOption['config']): unknown[] {
  if (typeof config.choices === 'function') {
    return config.choices();
  }
  return config.choices ?? [];
}
```

**Step 4: Commit**

```bash
git add packages/cli-forge/src/prompt-providers/clack.ts packages/cli-forge/package.json
git commit -m "feat(cli-forge): add clack prompt provider"
```

---

### Task 7: Propagate prompt providers through clone and command chain

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.ts`

The `clone()` method (line 1068) needs to copy `registeredPromptProviders` and `promptConfigs`. This ensures the SDK and test harness work correctly.

**Step 1: Write failing test**

Add to `internal-cli.spec.ts`:

```typescript
  it('should propagate prompt providers to subcommands', async () => {
    const prompted: string[] = [];
    const provider: PromptProvider = {
      prompt: async (option) => {
        prompted.push(option.name);
        return 'value';
      },
    };

    const app = cli('test')
      .withPromptProvider(provider)
      .command('sub', {
        builder: (cmd) =>
          cmd.option('name', { type: 'string', required: true }),
        handler: () => {},
      });

    await app.forge(['sub']);
    expect(prompted).toContain('name');
  });
```

**Step 2: Run test to verify it fails**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

**Step 3: Update clone method**

In `packages/cli-forge/src/lib/internal-cli.ts`, update the `clone()` method (around line 1068):

```typescript
  clone() {
    const clone = new InternalCLI<TArgs, THandlerReturn, TChildren, TParent>(
      this.name
    );
    clone.parser = this.parser.clone(clone.parser.options) as any;
    if (this.configuration) {
      clone.withRootCommandConfiguration(this.configuration);
    }
    clone.registeredCommands = {};
    for (const command in this.registeredCommands ?? {}) {
      clone.command(this.registeredCommands[command].clone() as any);
    }
    clone.commandChain = [...this.commandChain];
    clone.requiresCommand = this.requiresCommand;
    clone.registeredPromptProviders = [...this.registeredPromptProviders];
    clone.promptConfigs = new Map(this.promptConfigs);
    return clone;
  }
```

**Step 4: Run test**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.ts packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "feat(cli-forge): propagate prompt providers through clone and command chain"
```

---

### Task 8: Export types and verify build

**Files:**
- Modify: `packages/cli-forge/src/index.ts`

**Step 1: Ensure all prompt types are exported**

In `packages/cli-forge/src/index.ts`, verify the export added in Task 1 is present:

```typescript
export type { PromptConfig, PromptOptionConfig, PromptOption, PromptProvider } from './lib/prompt-types';
```

**Step 2: Build all packages**

```bash
nx run-many -t build
```

Expected: Build succeeds with no errors.

**Step 3: Run all tests**

```bash
nx run-many -t test
```

Expected: All tests pass.

**Step 4: Commit if any adjustments were needed**

```bash
git add -A
git commit -m "chore(cli-forge): verify build and exports for prompt layer"
```

---

### Task 9: Verify with an integration test

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.spec.ts`

**Step 1: Write an end-to-end integration test**

```typescript
describe('prompt integration', () => {
  it('should prompt, inject values, and pass validation', async () => {
    let handlerArgs: any;
    const provider: PromptProvider = {
      promptBatch: async (options) => {
        const results: Record<string, unknown> = {};
        for (const opt of options) {
          if (opt.config.type === 'number') {
            results[opt.name] = 42;
          } else {
            results[opt.name] = 'prompted-' + opt.name;
          }
        }
        return results;
      },
    };

    const app = cli('test', {
      handler: (args) => {
        handlerArgs = args;
      },
    })
      .option('name', { type: 'string', required: true })
      .option('port', { type: 'number', prompt: 'Which port?' } as any)
      .option('verbose', { type: 'boolean', default: false })
      .withPromptProvider(provider);

    await app.forge([]);

    expect(handlerArgs.name).toBe('prompted-name');
    expect(handlerArgs.port).toBe(42);
    expect(handlerArgs.verbose).toBe(false); // default, not prompted
  });
});
```

**Step 2: Run test**

```bash
nx test cli-forge -- src/lib/internal-cli.spec.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "test(cli-forge): add prompt integration test"
```
