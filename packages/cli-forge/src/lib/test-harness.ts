import { ParsedArgs } from '@cli-forge/parser';
import { InternalCLI } from './cli-forge';
import { CLI } from './public-api';

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

  constructor(cli: CLI<T>) {
    if (cli instanceof InternalCLI) {
      this.cli = cli;
      mockHandler(cli);
    } else {
      throw new Error(
        'TestHarness can only be used with CLI instances created by `cli`.'
      );
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

function mockHandler(cli: InternalCLI) {
  if (cli.configuration?.handler) {
    cli.configuration.handler = () => {
      // Mocked, should do nothing.
    };
  }
  for (const command in cli.registeredCommands) {
    mockHandler(cli.registeredCommands[command]);
  }
}
