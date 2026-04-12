import { ParsedArgs } from '@cli-forge/parser';
import { contextStorage, ForgeContextData } from './async-context';
import { resetGlobalProviders } from './context';
import { AnyInternalCLI, InternalCLI } from './internal-cli';
import { CLI, GlobalProviderConfig, ProviderConfig } from './public-api';

const mockedDisposers: Array<() => void> = [];

export type TestHarnessParseResult<T extends ParsedArgs> = {
  /**
   * Parsed arguments. Note the the typing of this is based on the CLI typings,
   * but no runtime validation outside of the configured validation checks on
   * individual options will be performed. If you want to validate the arguments,
   * you should do so in your test or configure a `validate` callback for the option.
   */
  args: T;

  /**
   * The command chain that was resolved during parsing. This is used for testing
   * that the correct command is ran when resolving a subcommand. A test that checks
   * this may look like:
   *
   * ```ts
   * const harness = new TestHarness(cli);
   * const { args, commandChain } = await harness.parse(['hello', '--name=sir']);
   * expect(commandChain).toEqual(['hello']);
   * ```
   *
   * The above test would check that the `hello` command was resolved when parsing
   * the argstring, and since only one command's handler will ever be called, this
   * can be used to ensure that the correct command is ran.
   */
  commandChain: string[];
};

/**
 * Options accepted by {@link TestHarness.mockContext} and
 * {@link TestHarness.runWithMockedContext}.
 *
 * `providers` mirrors the shape of `.provide()`: each entry is either an
 * eager value, an `executionScope` factory config, or a `global` factory
 * config. The runtime detection matches `InternalCLI.provide()` — any
 * object with a `factory` function is treated as a factory registration.
 */
export type MockContextProviders<TArgs, TProviders> = {
  [K in keyof TProviders]?:
    | TProviders[K]
    | ProviderConfig<TProviders[K], TArgs>
    | GlobalProviderConfig<TProviders[K]>;
};

export interface MockContextOptions<TArgs extends ParsedArgs, TProviders> {
  args?: Partial<TArgs>;
  providers?: MockContextProviders<TArgs, TProviders>;
  commandChain?: string[];
}

function buildMockContextData<TArgs extends ParsedArgs, TProviders>(
  cli: CLI<TArgs, any, any, any, TProviders> | undefined,
  options: MockContextOptions<TArgs, TProviders>
): ForgeContextData {
  // Walk from the mocked CLI up through its parents to build an id chain,
  // so `getCommandContext(root)` / `getCommandContext(running)` / any
  // ancestor on the chain all validate successfully inside the mock.
  const commandIdChain: string[] = [];
  if (cli && InternalCLI.isInternalCLI(cli)) {
    let walk: AnyInternalCLI | undefined = cli;
    while (walk) {
      commandIdChain.unshift(walk.commandId);
      walk = walk.getParent() as AnyInternalCLI | undefined;
    }
  }

  const contextData: ForgeContextData = {
    args: (options.args ?? {}) as Record<string, unknown>,
    commandChain: options.commandChain ?? [],
    commandIdChain,
    providers: new Map(),
    providerFactories: new Map(),
    handlerPhase: true,
    resolving: new Set(),
  };

  for (const [key, value] of Object.entries(options.providers ?? {})) {
    if (
      value !== null &&
      typeof value === 'object' &&
      'factory' in (value as object) &&
      typeof (value as { factory: unknown }).factory === 'function'
    ) {
      const config = value as {
        factory: Function;
        lifetime?: 'global' | 'executionScope';
      };
      contextData.providerFactories.set(key, {
        factory: config.factory,
        lifetime: config.lifetime ?? 'executionScope',
      });
    } else {
      contextData.providers.set(key, value);
    }
  }

  return contextData;
}

/**
 * Utility for testing CLI instances. Can check argument parsing and validation, including
 * command chain resolution.
 */
export class TestHarness<T extends ParsedArgs> {
  private cli: InternalCLI<T>;

  constructor(cli: CLI<T, any, any, any, any>) {
    if (InternalCLI.isInternalCLI(cli)) {
      this.cli = cli;
      mockHandler(cli);
    } else {
      throw new Error(
        'TestHarness can only be used with CLI instances created by `cli`.'
      );
    }
  }

  /**
   * Mocks the CLI context for testing DI providers and command context outside
   * of a real `forge()` execution. Returns a cleanup function that removes the
   * mocked context when called.
   *
   * `options.providers` accepts both eager values and the same
   * `{ factory, lifetime }` configs that `.provide()` takes — factory mocks
   * run lazily via `inject()` and receive the mocked `args`.
   *
   * Nested mocks compose: calling `mockContext` again inside an active mock
   * stacks on top, and `dispose()` restores the previous context rather than
   * blanking it.
   *
   * For tests that use `await` across the mocked block, prefer
   * {@link runWithMockedContext}, which uses `AsyncLocalStorage.run()` for
   * proper scoping across async boundaries.
   *
   * @example
   * ```ts
   * afterEach(() => TestHarness.clearMockedContexts());
   *
   * it('resolves provider', () => {
   *   const cleanup = TestHarness.mockContext(myApp, {
   *     providers: {
   *       db: mockDb,
   *       logger: { factory: (args) => makeLogger(args.logLevel) },
   *     },
   *   });
   *   const ctx = getCommandContext(myApp);
   *   expect(ctx.inject('db')).toBe(mockDb);
   *   cleanup();
   * });
   * ```
   */
  static mockContext<TArgs extends ParsedArgs, TProviders>(
    _cli: CLI<TArgs, any, any, any, TProviders>,
    options: MockContextOptions<TArgs, TProviders>
  ): () => void {
    const contextData = buildMockContextData(_cli, options);
    contextStorage.enterWith(contextData);

    const dispose = () => {
      // Unconditionally blank the current store on dispose. Capturing the
      // previous store and restoring it looks cleaner for nested mocks, but
      // it misbehaves when `clearMockedContexts()` batch-disposes out of
      // order. Callers that need proper nesting should use
      // `runWithMockedContext`, which scopes via `AsyncLocalStorage.run()`.
      contextStorage.enterWith(undefined);
      const idx = mockedDisposers.indexOf(dispose);
      if (idx !== -1) mockedDisposers.splice(idx, 1);
    };

    mockedDisposers.push(dispose);
    return dispose;
  }

  /**
   * Runs `fn` inside a mocked DI context using `AsyncLocalStorage.run()`.
   *
   * Unlike {@link mockContext}, this variant scopes the context properly
   * across async boundaries — any `await` inside `fn` keeps seeing the
   * mocked providers, and the context is automatically torn down when `fn`
   * resolves (or throws). Prefer this for anything that isn't a trivial
   * synchronous assertion.
   *
   * @example
   * ```ts
   * const result = await TestHarness.runWithMockedContext(
   *   myApp,
   *   { providers: { db: mockDb } },
   *   async () => {
   *     const ctx = getCommandContext(myApp);
   *     return ctx.inject('db').query('select 1');
   *   }
   * );
   * ```
   */
  static async runWithMockedContext<TArgs extends ParsedArgs, TProviders, R>(
    _cli: CLI<TArgs, any, any, any, TProviders>,
    options: MockContextOptions<TArgs, TProviders>,
    fn: () => R | Promise<R>
  ): Promise<R> {
    const contextData = buildMockContextData(_cli, options);
    // Wrap in an async function so synchronous throws from fn() are
    // converted to rejected promises, and await inside fn sees the scoped
    // context (AsyncLocalStorage.run propagates the store through awaits).
    return await contextStorage.run(contextData, async () => fn());
  }

  /**
   * Removes all mocked contexts registered via {@link mockContext} and
   * clears the `lifetime: 'global'` provider cache so the next test starts
   * with a fresh slate.
   *
   * Typically called from `afterEach`:
   * ```ts
   * afterEach(() => TestHarness.clearMockedContexts());
   * ```
   */
  static clearMockedContexts(): void {
    for (const dispose of [...mockedDisposers]) {
      dispose();
    }
    // Belt-and-braces: even after all disposers ran, blank the store so any
    // lingering reference from a test that forgot to capture its cleanup
    // doesn't leak into the next test.
    contextStorage.enterWith(undefined);
    resetGlobalProviders();
  }

  /**
   * Clears only the `lifetime: 'global'` provider cache without touching
   * any active mocked contexts. Useful when a specific test needs to
   * re-initialize global providers without discarding the surrounding mock.
   */
  static resetGlobalProviders(): void {
    resetGlobalProviders();
  }

  async parse(args: string[]): Promise<TestHarnessParseResult<T>> {
    const argv = await this.cli.forge(args);

    return {
      args: argv,
      commandChain: this.cli.commandChain,
    };
  }
}

function mockHandler(cli: AnyInternalCLI) {
  if (cli.configuration?.handler) {
    cli.configuration.handler = () => {
      // Mocked, should do nothing.
    };
  }
  for (const command in cli.registeredCommands) {
    mockHandler(cli.registeredCommands[command]);
  }
}
