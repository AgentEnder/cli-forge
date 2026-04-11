import { ParsedArgs } from '@cli-forge/parser';
import { contextStorage, ForgeContextData } from './async-context';
import { AnyInternalCLI, InternalCLI } from './internal-cli';
import { CLI } from './public-api';

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
   * @example
   * ```ts
   * afterEach(() => TestHarness.clearMockedContexts());
   *
   * it('resolves provider', () => {
   *   const cleanup = TestHarness.mockContext(myApp, {
   *     providers: { db: mockDb },
   *   });
   *   const ctx = getCommandContext(myApp);
   *   expect(ctx.inject('db')).toBe(mockDb);
   *   cleanup();
   * });
   * ```
   */
  static mockContext<TArgs extends ParsedArgs, TProviders>(
    _cli: CLI<TArgs, any, any, any, TProviders>,
    options: {
      args?: Partial<TArgs>;
      providers?: Partial<TProviders>;
      commandChain?: string[];
    }
  ): () => void {
    const contextData: ForgeContextData = {
      args: (options.args ?? {}) as Record<string, unknown>,
      commandChain: options.commandChain ?? [],
      providers: new Map(Object.entries(options.providers ?? {})),
      providerFactories: new Map(),
      handlerPhase: true,
    };

    contextStorage.enterWith(contextData);

    const dispose = () => {
      contextStorage.enterWith(undefined as any);
      const idx = mockedDisposers.indexOf(dispose);
      if (idx !== -1) mockedDisposers.splice(idx, 1);
    };

    mockedDisposers.push(dispose);
    return dispose;
  }

  /**
   * Removes all mocked contexts registered via {@link mockContext}.
   * Call this in `afterEach` to ensure a clean state between tests.
   */
  static clearMockedContexts(): void {
    for (const dispose of [...mockedDisposers]) {
      dispose();
    }
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
