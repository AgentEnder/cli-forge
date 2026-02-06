# Init Hooks & Set-Based Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add init hooks (two-pass parsing for plugin loading) and set-based middleware storage to cli-forge, with a capture-and-replay `makeComposableBuilder`.

**Architecture:** Three changes layered bottom-up: (1) parser gains a `lenient` mode that skips unmatchedParser and validation, (2) `InternalCLI` middleware storage moves from Array to Set for idempotent registration, (3) `makeComposableBuilder` captures operations once and replays them, and (4) `InternalCLI.forge()` gains init hooks with incremental re-parse. Each layer is independently testable.

**Tech Stack:** TypeScript, Vitest, Nx monorepo (`packages/parser`, `packages/cli-forge`)

**Baseline:** Parser tests: 209/209 pass. CLI-forge tests: 58/63 pass (5 pre-existing snapshot failures unrelated to this work).

---

### Task 1: Parser — Add `lenient` parse mode

**Files:**
- Modify: `packages/parser/src/lib/parser.ts:88-106` (ParserOptions type)
- Modify: `packages/parser/src/lib/parser.ts:188-197` (constructor defaults)
- Modify: `packages/parser/src/lib/parser.ts:548-633` (parse method)
- Test: `packages/parser/src/lib/parser.spec.ts`

**Step 1: Write failing tests for lenient parse mode**

Add to `packages/parser/src/lib/parser.spec.ts` inside the main `describe` block:

```typescript
describe('lenient mode', () => {
  it('should collect unmatched flags without calling unmatchedParser', () => {
    let unmatchedParserCalled = false;
    const result = parser({
      lenient: true,
      unmatchedParser: () => {
        unmatchedParserCalled = true;
        return false;
      },
    })
      .option('config', { type: 'string' })
      .parse(['--config', 'test.json', '--unknown', 'value', 'positional']);
    expect(unmatchedParserCalled).toBe(false);
    expect(result.config).toBe('test.json');
    expect(result.unmatched).toEqual(['--unknown', 'value', 'positional']);
  });

  it('should skip validation in lenient mode', () => {
    // Required option missing — should NOT throw
    const result = parser({ lenient: true })
      .option('name', { type: 'string', required: true })
      .parse([]);
    expect(result.name).toBeUndefined();
  });

  it('should still apply env vars and defaults in lenient mode', () => {
    process.env['TEST_PORT'] = '8080';
    try {
      const result = parser({ lenient: true })
        .env('TEST')
        .option('port', { type: 'number' })
        .option('host', { type: 'string', default: 'localhost' })
        .parse([]);
      expect(result.port).toBe(8080);
      expect(result.host).toBe('localhost');
    } finally {
      delete process.env['TEST_PORT'];
    }
  });

  it('should not call unmatchedParser for unmatched positionals', () => {
    let unmatchedParserCalled = false;
    const result = parser({
      lenient: true,
      unmatchedParser: () => {
        unmatchedParserCalled = true;
        return false;
      },
    })
      .option('verbose', { type: 'boolean' })
      .parse(['--verbose', 'some-command', '--watch']);
    expect(unmatchedParserCalled).toBe(false);
    expect(result.verbose).toBe(true);
    expect(result.unmatched).toEqual(['some-command', '--watch']);
  });

  it('should handle -- separator in lenient mode', () => {
    const result = parser({ lenient: true })
      .option('config', { type: 'string' })
      .parse(['--config', 'test.json', '--', 'rest', 'args']);
    expect(result.config).toBe('test.json');
    expect(result['--']).toEqual(['rest', 'args']);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test parser`
Expected: 5 new failures (parser options don't accept `lenient` yet)

**Step 3: Implement lenient parse mode**

In `packages/parser/src/lib/parser.ts`:

1. Add `lenient?: boolean` to `ParserOptions` type (after line 105):

```typescript
/**
 * When set to true, skips the unmatchedParser callback and all validation.
 * Unmatched arguments are collected into the `unmatched` array.
 * Env vars, config files, and defaults are still applied.
 */
lenient?: boolean;
```

2. Add default in constructor (line 194, add after `strict: false`):

```typescript
lenient: false,
```

3. Modify `parse()` method — wrap the two `unmatchedParser` calls (lines 574 and 622) with a lenient check:

Line 573-576 (unmatched flags):
```typescript
// Before:
if (this.options.unmatchedParser(arg, argvClone, this)) {
// After:
if (!this.options.lenient && this.options.unmatchedParser(arg, argvClone, this)) {
```

Line 622 (unmatched positionals):
```typescript
// Before:
if (this.options.unmatchedParser(arg, argvClone, this)) {
// After:
if (!this.options.lenient && this.options.unmatchedParser(arg, argvClone, this)) {
```

4. Modify `parse()` return (line 632) — skip validation when lenient:

```typescript
// Before:
return this.validateAndNormalizeResults(result) as TArgs;
// After:
if (this.options.lenient) {
  return this.normalizeOptions(result) as TArgs;
}
return this.validateAndNormalizeResults(result) as TArgs;
```

Note: `normalizeOptions` is already a private method (line 635) that applies env vars, config files, and defaults. We reuse it directly.

**Step 4: Run tests to verify they pass**

Run: `npx nx test parser`
Expected: All 209 existing tests + 5 new tests pass (214 total)

**Step 5: Commit**

```bash
git add packages/parser/src/lib/parser.ts packages/parser/src/lib/parser.spec.ts
git commit -m "feat(parser): add lenient parse mode for init hooks"
```

---

### Task 2: CLI — Change middleware storage from Array to Set

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.ts:88-90` (declaration)
- Modify: `packages/cli-forge/src/lib/internal-cli.ts:441` (push → add)
- Modify: `packages/cli-forge/src/lib/internal-cli.ts:457-466` (runCommand spread)
- Modify: `packages/cli-forge/src/lib/internal-cli.ts:694-703` (collectMiddlewareChain)
- Test: `packages/cli-forge/src/lib/internal-cli.spec.ts`

**Step 1: Write failing tests for Set-based middleware dedup**

Add to `packages/cli-forge/src/lib/internal-cli.spec.ts`:

```typescript
describe('middleware deduplication', () => {
  it('should not run the same middleware twice when registered with same reference', async () => {
    let callCount = 0;
    const mw = (args: any) => {
      callCount++;
      return args;
    };
    await cli('test')
      .middleware(mw)
      .middleware(mw) // same reference
      .command('run', {
        handler: () => {},
      })
      .forge(['run']);
    expect(callCount).toBe(1);
  });

  it('should run different middleware functions even with same body', async () => {
    const calls: string[] = [];
    const mw1 = (args: any) => {
      calls.push('mw1');
      return args;
    };
    const mw2 = (args: any) => {
      calls.push('mw2');
      return args;
    };
    await cli('test')
      .middleware(mw1)
      .middleware(mw2)
      .command('run', {
        handler: () => {},
      })
      .forge(['run']);
    expect(calls).toEqual(['mw1', 'mw2']);
  });

  it('should preserve middleware insertion order', async () => {
    const order: number[] = [];
    const mw1 = (args: any) => {
      order.push(1);
      return args;
    };
    const mw2 = (args: any) => {
      order.push(2);
      return args;
    };
    const mw3 = (args: any) => {
      order.push(3);
      return args;
    };
    await cli('test')
      .middleware(mw1)
      .middleware(mw2)
      .middleware(mw3)
      .middleware(mw1) // duplicate — should not change order
      .command('run', {
        handler: () => {},
      })
      .forge(['run']);
    expect(order).toEqual([1, 2, 3]);
  });

  it('should deduplicate middleware across parent and child commands', async () => {
    let callCount = 0;
    const sharedMw = (args: any) => {
      callCount++;
      return args;
    };
    await cli('test')
      .middleware(sharedMw)
      .command('child', {
        builder: (cmd) => cmd.middleware(sharedMw),
        handler: () => {},
      })
      .forge(['child']);
    expect(callCount).toBe(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test cli-forge`
Expected: The dedup tests fail (Array allows duplicates)

**Step 3: Implement Set-based middleware storage**

In `packages/cli-forge/src/lib/internal-cli.ts`:

1. Change declaration (lines 88-90):
```typescript
// Before:
private registeredMiddleware: Array<
  (args: TArgs) => void | unknown | Promise<void> | Promise<unknown>
> = [];
// After:
private registeredMiddleware = new Set<
  (args: TArgs) => void | unknown | Promise<void> | Promise<unknown>
>();
```

2. Change `middleware()` method (line 441):
```typescript
// Before:
this.registeredMiddleware.push(callback);
// After:
this.registeredMiddleware.add(callback);
```

3. Change `runCommand()` spread (lines 457-466):
```typescript
// Before:
const middlewares: Array<(args: any) => void> = [
  ...this.registeredMiddleware,
];
let cmd: InternalCLI<any, any, any, any> = this;
for (const command of this.commandChain) {
  cmd = cmd.registeredCommands[command];
  middlewares.push(...cmd.registeredMiddleware);
}
// After:
const middlewares = new Set<(args: any) => void>(this.registeredMiddleware);
let cmd: InternalCLI<any, any, any, any> = this;
for (const command of this.commandChain) {
  cmd = cmd.registeredCommands[command];
  for (const mw of cmd.registeredMiddleware) {
    middlewares.add(mw);
  }
}
```

Then update the iteration (line 474) — `for (const middleware of middlewares)` already works on Sets.

4. Change `collectMiddlewareChain()` (lines 694-703):
```typescript
// Before:
return chain.flatMap((c) => c.registeredMiddleware);
// After:
const seen = new Set<(args: any) => unknown | Promise<unknown>>();
for (const c of chain) {
  for (const mw of c.registeredMiddleware) {
    seen.add(mw);
  }
}
return [...seen];
```

**Step 4: Run tests to verify they pass**

Run: `npx nx test cli-forge`
Expected: All existing tests + 4 new dedup tests pass

**Step 5: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.ts packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "feat(cli-forge): use Set for middleware storage to enable idempotent registration"
```

---

### Task 3: Capture-and-replay `makeComposableBuilder`

**Files:**
- Modify: `packages/cli-forge/src/lib/composable-builder.ts`
- Test: `packages/cli-forge/src/lib/composable-builder.spec.ts` (new file)

**Step 1: Write failing tests**

Create `packages/cli-forge/src/lib/composable-builder.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { makeComposableBuilder } from './composable-builder';
import { default as cli } from './public-api';
import { chain } from '@cli-forge/parser';

describe('makeComposableBuilder', () => {
  describe('capture-and-replay', () => {
    it('should produce stable middleware references across applications', async () => {
      const builder = makeComposableBuilder((cmd) =>
        cmd
          .option('verbose', { type: 'boolean' })
          .middleware((args) => args)
      );

      const cli1 = builder(cli('test1'));
      const cli2 = builder(cli('test2'));

      // Access internal middleware sets — both should contain the same reference
      const mw1 = [...(cli1 as any).registeredMiddleware];
      const mw2 = [...(cli2 as any).registeredMiddleware];
      expect(mw1.length).toBe(1);
      expect(mw2.length).toBe(1);
      expect(mw1[0]).toBe(mw2[0]); // Same reference
    });

    it('should correctly replay option registrations', async () => {
      const builder = makeComposableBuilder((cmd) =>
        cmd.option('verbose', { type: 'boolean' })
      );

      let handlerArgs: any;
      await chain(cli('test'), builder)
        .command('$0', {
          handler: (args) => {
            handlerArgs = args;
          },
        })
        .forge(['--verbose']);
      expect(handlerArgs.verbose).toBe(true);
    });

    it('should deduplicate middleware when builder applied to parent and child', async () => {
      let mwCallCount = 0;
      const builder = makeComposableBuilder((cmd) =>
        cmd.option('verbose', { type: 'boolean' }).middleware((args) => {
          mwCallCount++;
          return args;
        })
      );

      await chain(cli('parent'), builder)
        .command('child', {
          builder: (cmd) => chain(cmd, builder).option('format', { type: 'string' }),
          handler: () => {},
        })
        .forge(['child']);
      expect(mwCallCount).toBe(1);
    });

    it('should replay commands registered by the builder', async () => {
      const builder = makeComposableBuilder((cmd) =>
        cmd.command('sub', {
          builder: (c) => c.option('flag', { type: 'boolean' }),
          handler: () => {},
        })
      );

      const myCli = builder(cli('test'));
      const children = myCli.getChildren();
      expect(children).toHaveProperty('sub');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test cli-forge`
Expected: The "stable middleware references" test fails (current impl calls fn every time, creating new closures)

**Step 3: Implement capture-and-replay**

Replace the contents of `packages/cli-forge/src/lib/composable-builder.ts`:

```typescript
import type { ParsedArgs } from '@cli-forge/parser';
import { CLI } from './public-api';

/**
 * Extracts the TChildren type parameter from a CLI type.
 */
export type ExtractChildren<T> = T extends CLI<any, any, infer C, any>
  ? C
  : never;

/**
 * Extracts the TArgs type parameter from a CLI type.
 */
export type ExtractArgs<T> = T extends CLI<infer A, any, any, any> ? A : never;

/**
 * Type for a composable builder function that transforms a CLI.
 * Used with `chain` to compose multiple builders.
 */
export type ComposableBuilder<
  TArgs2 extends ParsedArgs,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TAddedChildren = {}
> = <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent>(
  init: CLI<TInit, THandlerReturn, TChildren, TParent>
) => CLI<TInit & TArgs2, THandlerReturn, TChildren & TAddedChildren, TParent>;

type RecordedOp = { method: string; args: any[] };

/**
 * Creates a recording proxy that captures method calls for replay.
 * The proxy intercepts all method calls, records them, and returns
 * itself for chaining.
 */
function createRecordingProxy(): { proxy: any; operations: RecordedOp[] } {
  const operations: RecordedOp[] = [];
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      return (...args: any[]) => {
        operations.push({ method: prop as string, args });
        return proxy;
      };
    },
  };
  const proxy = new Proxy({}, handler);
  return { proxy, operations };
}

/**
 * Creates a composable builder function that can be used with `chain`.
 * Can be used to add options, commands, middleware, or any other CLI modifications.
 *
 * The builder function is executed once at creation time against a recording proxy.
 * Subsequent applications replay the captured operations, ensuring stable references
 * for middleware functions (enabling Set-based deduplication).
 *
 * @typeParam TArgs2 - The args type after the builder runs
 * @typeParam TChildren2 - The children type added by the builder
 */
export function makeComposableBuilder<
  TArgs2 extends ParsedArgs,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TChildren2 = {}
>(
  fn: (
    // eslint-disable-next-line @typescript-eslint/ban-types
    init: CLI<ParsedArgs, any, {}, any>
  ) => CLI<TArgs2, any, TChildren2, any>
) {
  // Capture operations by running fn once against a recording proxy
  const { proxy, operations } = createRecordingProxy();
  fn(proxy);

  return <TInit extends ParsedArgs, THandlerReturn, TChildren, TParent>(
    init: CLI<TInit, THandlerReturn, TChildren, TParent>
  ) => {
    // Replay captured operations on the real CLI
    let current: any = init;
    for (const op of operations) {
      current = current[op.method](...op.args);
    }
    return current as unknown as CLI<
      TInit & TArgs2,
      THandlerReturn,
      TChildren & TChildren2,
      TParent
    >;
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx nx test cli-forge`
Expected: All existing + new composable builder tests pass

**Step 5: Commit**

```bash
git add packages/cli-forge/src/lib/composable-builder.ts packages/cli-forge/src/lib/composable-builder.spec.ts
git commit -m "feat(cli-forge): capture-and-replay in makeComposableBuilder for stable middleware refs"
```

---

### Task 4: CLI — Add `.init()` hooks with incremental re-parse

**Files:**
- Modify: `packages/cli-forge/src/lib/internal-cli.ts` (add registeredInitHooks, init method, modify forge)
- Modify: `packages/cli-forge/src/lib/public-api.ts` (add init to CLI interface)
- Test: `packages/cli-forge/src/lib/internal-cli.spec.ts`

**Step 1: Write failing tests for init hooks**

Add to `packages/cli-forge/src/lib/internal-cli.spec.ts`:

```typescript
describe('init hooks', () => {
  it('should run init hook before command resolution', async () => {
    let handlerCalled = false;
    await cli('test')
      .option('config', { type: 'string' })
      .init(async (args, app) => {
        expect(args.config).toBe('test.json');
        app.command('serve', {
          handler: () => {
            handlerCalled = true;
          },
        });
      })
      .forge(['--config', 'test.json', 'serve']);
    expect(handlerCalled).toBe(true);
  });

  it('should pass matched args to init hook and re-parse unmatched', async () => {
    let handlerArgs: any;
    await cli('test')
      .option('verbose', { type: 'boolean' })
      .init(async (args, app) => {
        expect(args.verbose).toBe(true);
        app.command('deploy', {
          builder: (cmd) => cmd.option('target', { type: 'string' }),
          handler: (a) => {
            handlerArgs = a;
          },
        });
      })
      .forge(['--verbose', 'deploy', '--target', 'production']);
    expect(handlerArgs.verbose).toBe(true);
    expect(handlerArgs.target).toBe('production');
  });

  it('should run multiple init hooks sequentially', async () => {
    const order: number[] = [];
    await cli('test')
      .option('config', { type: 'string' })
      .init(async (_args, app) => {
        order.push(1);
        app.command('first', { handler: () => {} });
      })
      .init(async (_args, app) => {
        order.push(2);
        app.command('second', { handler: () => {} });
      })
      .forge(['first']);
    expect(order).toEqual([1, 2]);
  });

  it('should skip init phase when no init hooks are registered', async () => {
    // This test verifies no behavioral change for existing CLIs.
    // We check that the normal parse path works unchanged.
    let handlerCalled = false;
    await cli('test')
      .option('name', { type: 'string' })
      .command('$0', {
        handler: (args) => {
          handlerCalled = true;
          expect(args.name).toBe('world');
        },
      })
      .forge(['--name', 'world']);
    expect(handlerCalled).toBe(true);
  });

  it('should support async init hooks', async () => {
    let resolved = false;
    await cli('test')
      .init(async (_args, app) => {
        await new Promise((r) => setTimeout(r, 10));
        resolved = true;
        app.command('run', { handler: () => {} });
      })
      .forge(['run']);
    expect(resolved).toBe(true);
  });

  it('should handle init hook errors through error handler', async () => {
    let caughtError: any;
    await cli('test')
      .errorHandler((e) => {
        caughtError = e;
      })
      .init(async () => {
        throw new Error('init failed');
      })
      .forge([]);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('init failed');
  });

  it('should allow init hooks to add options resolved in re-parse', async () => {
    let handlerArgs: any;
    await cli('test')
      .option('config', { type: 'string' })
      .init(async (_args, app) => {
        app.option('debug', { type: 'boolean' });
      })
      .command('$0', {
        handler: (args) => {
          handlerArgs = args;
        },
      })
      .forge(['--config', 'test.json', '--debug']);
    expect(handlerArgs.config).toBe('test.json');
    expect(handlerArgs.debug).toBe(true);
  });

  it('should work with the full plugin loading pattern', async () => {
    // Simulate the real use case: config → plugins → commands
    const testPlugin = cli('test-cmd')
      .option('watch', { type: 'boolean' })
      .command('$0', {
        handler: () => {},
      });

    let handlerArgs: any;
    testPlugin.command = testPlugin.command; // just to use the var

    await cli('app')
      .option('config', { type: 'string' })
      .init(async (args, app) => {
        // Simulate loading plugins from config
        if (args.config === 'with-plugins') {
          app.command(
            cli('plugin-cmd')
              .option('watch', { type: 'boolean' })
              .command('$0', {
                handler: (a) => {
                  handlerArgs = a;
                },
              })
          );
        }
      })
      .forge(['--config', 'with-plugins', 'plugin-cmd', '--watch']);
    expect(handlerArgs.config).toBe('with-plugins');
    expect(handlerArgs.watch).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test cli-forge`
Expected: Failures — `.init()` method doesn't exist

**Step 3: Add `init` to CLI interface type**

In `packages/cli-forge/src/lib/public-api.ts`, add after the `middleware` method (after line 782):

```typescript
/**
 * Registers an init hook that runs before command resolution.
 * Init hooks receive partially-parsed args (from currently-registered options)
 * and can modify the CLI (register commands, options, middleware) before the
 * full parse runs. This enables plugin loading from config files.
 *
 * @param callback Async function receiving (args, cli). Mutate cli to add commands/options.
 */
init(
  callback: (args: TArgs, cli: CLI<TArgs, THandlerReturn, TChildren, TParent>) => Promise<void>
): CLI<TArgs, THandlerReturn, TChildren, TParent>;
```

**Step 4: Implement init hooks in InternalCLI**

In `packages/cli-forge/src/lib/internal-cli.ts`:

1. Add `registeredInitHooks` field (after line 90, after registeredMiddleware):

```typescript
private registeredInitHooks: Array<
  (args: TArgs, cli: any) => Promise<void>
> = [];
```

2. Add `init()` method (after the `middleware()` method, around line 446):

```typescript
init(
  callback: (args: TArgs, cli: any) => Promise<void>
): any {
  this.registeredInitHooks.push(callback);
  return this;
}
```

3. Modify `forge()` method (lines 801-847). The key change: if init hooks exist, do a lenient parse first, run init hooks, then re-parse only unmatched tokens:

Replace the `forge` method body with:

```typescript
forge = (args: string[] = hideBin(process.argv)) =>
  this.withErrorHandlers(async () => {
    let argv: TArgs & { help?: boolean; version?: boolean };
    let validationFailedError: ValidationFailedError<TArgs> | undefined;

    if (this.registeredInitHooks.length > 0) {
      // Phase 1: Lenient parse — resolve known options, collect unmatched
      const lenientParser = this.parser.clone({
        ...this.parser.options,
        lenient: true,
      });
      const partialArgs = lenientParser.parse(args);

      // Phase 2: Run init hooks — can register commands, options, middleware
      for (const hook of this.registeredInitHooks) {
        await hook(partialArgs as TArgs, this as any);
      }

      // Phase 3: Re-parse only unmatched tokens with augmented parser
      const unmatched = (partialArgs as any).unmatched ?? [];
      if (unmatched.length > 0) {
        try {
          const reparsed = this.parser.parse(unmatched);
          argv = { ...partialArgs, ...reparsed, unmatched: (reparsed as any).unmatched ?? [] } as any;
        } catch (e) {
          if (e instanceof ValidationFailedError) {
            argv = { ...partialArgs, ...e.partialArgV } as any;
            validationFailedError = e;
          } else {
            throw e;
          }
        }
      } else {
        // No unmatched tokens — just validate the original parse
        try {
          argv = this.parser.parse(args);
        } catch (e) {
          if (e instanceof ValidationFailedError) {
            argv = e.partialArgV as TArgs;
            validationFailedError = e;
          } else {
            throw e;
          }
        }
      }
    } else {
      // No init hooks — existing parse path, completely unchanged
      try {
        argv = this.parser.parse(args);
      } catch (e) {
        if (e instanceof ValidationFailedError) {
          argv = e.partialArgV as TArgs;
          validationFailedError = e;
        } else {
          throw e;
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentCommand: InternalCLI<any, any, any, any> = this;
    for (const command of this.commandChain) {
      currentCommand = currentCommand.registeredCommands[command];
    }

    if (argv.version) {
      this.versionHandler();
      return argv;
    }

    if (argv.help) {
      this.printHelp();
      return argv;
    } else if (validationFailedError) {
      throw validationFailedError;
    }

    const finalArgV =
      this.commandChain.length === 0 && this.configuration?.builder
        ? (
            this.configuration.builder?.(
              this as any
            ) as unknown as InternalCLI<TArgs, any, any, any>
          ).parser.parse(args)
        : argv;

    await this.runCommand(finalArgV, args);
    return finalArgV as TArgs;
  });
```

Note: We need to check that `this.parser.clone()` exists and supports options. Check the parser's clone method. If it doesn't accept options for overriding, we may need to temporarily set `this.parser.options.lenient = true` and reset it after, or create a fresh parser. Verify the clone method signature before implementing.

**Step 5: Run tests to verify they pass**

Run: `npx nx test cli-forge`
Expected: All existing + 8 new init hook tests pass

**Step 6: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.ts packages/cli-forge/src/lib/public-api.ts packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "feat(cli-forge): add init hooks with incremental re-parse for plugin loading"
```

---

### Task 5: Export `init` types and verify full integration

**Files:**
- Modify: `packages/cli-forge/src/index.ts` (exports if needed)
- Test: `packages/cli-forge/src/lib/internal-cli.spec.ts` (integration test)

**Step 1: Write a full integration test combining all features**

Add to `packages/cli-forge/src/lib/internal-cli.spec.ts`:

```typescript
describe('init hooks + composable builders + middleware dedup (integration)', () => {
  it('should work end-to-end with shared composable builders and plugin loading', async () => {
    const order: string[] = [];

    // Shared options applied to both parent and plugin
    const globalOptions = makeComposableBuilder((cmd: any) =>
      cmd
        .option('verbose', { type: 'boolean' })
        .middleware((args: any) => {
          order.push('global-middleware');
          return args;
        })
    );

    // Plugin defined in a "separate file" with globalOptions applied
    const pluginCmd = chain(cli('deploy'), globalOptions)
      .option('target', { type: 'string' })
      .command('$0', {
        handler: (args: any) => {
          order.push('handler');
          expect(args.verbose).toBe(true);
          expect(args.target).toBe('prod');
        },
      });

    // Main app also applies globalOptions
    await chain(cli('app'), globalOptions)
      .option('config', { type: 'string' })
      .init(async (_args, app) => {
        order.push('init');
        app.command(pluginCmd);
      })
      .forge(['--verbose', '--config', 'test', 'deploy', '--target', 'prod']);

    // global-middleware should only run ONCE despite being on both parent and child
    expect(order).toEqual(['init', 'global-middleware', 'handler']);
  });
});
```

This test requires importing `makeComposableBuilder` and `chain` — add these imports at the top of the test file.

**Step 2: Run ALL tests across both packages**

Run: `npx nx test parser && npx nx test cli-forge`
Expected: All pass

**Step 3: Commit**

```bash
git add packages/cli-forge/src/lib/internal-cli.spec.ts
git commit -m "test(cli-forge): add integration test for init hooks + composable builders + middleware dedup"
```

---

### Task 6: Verify no regressions

**Step 1: Run full test suite**

```bash
npx nx run-many -t test --projects=parser,cli-forge
```

Expected: Parser 214+ pass, CLI-forge all new + existing non-snapshot tests pass.

**Step 2: Run type tests**

```bash
npx nx test type-tests
```

Expected: All existing type tests pass (composable builder types unchanged at the signature level).

**Step 3: Build both packages**

```bash
npx nx run-many -t build --projects=parser,cli-forge
```

Expected: Clean builds, no TypeScript errors.
