import {
  ArgvParser,
  ArrayOptionConfig,
  OptionConfig,
  ParsedArgs,
} from '@cli-forge/parser';

export type CLICommandOptions<
  TInitial extends ParsedArgs,
  TArgs extends TInitial
> = {
  description?: string;
  builder?: (parser: CLI<TInitial>) => CLI<TArgs>;
  handler: (args: TArgs) => void | Promise<void>;
};

export type ArgsOf<T extends CLI> = T extends {
  configuration: { handler: (args: infer TArgs) => void };
}
  ? TArgs
  : never;

/**
 * The base class for a CLI application. This class is used to define the structure of the CLI.
 *
 * {@link cli} is provided as a small helper function to create a new CLI instance.
 *
 * @example
 * ```ts
 * import { cli } from 'cli-forge';
 *
 * cli('basic-cli').command('hello', {
 *   builder: (args) =>
 *    args.option('name', {
 *      type: 'string',
 *    }),
 *   handler: (args) => {
 *     console.log(`Hello, ${args.name}!`);
 *   }).forge();
 * ```
 */
export class CLI<T extends ParsedArgs = ParsedArgs, T2 extends T = T> {
  private commands: Record<string, CLI<any>> = {};
  private commandChain: string[] = [];
  private requiresCommand = false;
  private parser = new ArgvParser<T>({
    unmatchedParser: (arg) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCommand: CLI<any> = this;
      for (const command of this.commandChain) {
        currentCommand = currentCommand.commands[command];
      }
      const command = currentCommand.commands[arg];
      if (command && command.configuration) {
        command.configuration.builder?.(command);
        this.commandChain.push(arg);
        return true;
      }
      return false;
    },
  }).option('help', {
    type: 'boolean',
    alias: ['-h'],
    description: 'Show help for the current command',
  });

  /**
   * @param name What should the name of the cli command be?
   * @param configuration Configuration for the current CLI command.
   */
  constructor(
    public name: string,
    public configuration?: CLICommandOptions<T, T2>
  ) {}

  /**
   * Registers a new command with the CLI.
   * @param key What should the new command be called?
   * @param options Settings for the new command. See {@link CLICommandOptions}.
   * @returns Updated CLI instance with the new command registered.
   */
  command<TArgs extends T>(key: string, options: CLICommandOptions<T, TArgs>) {
    if (key === '$0') {
      this.configuration = {
        ...this.configuration,
        builder: options.builder as any,
        handler: options.handler as any,
        description: options.description,
      };
    }
    this.commands[key] = new CLI<T, TArgs>(key, options);
    this.commands[key].parser = this.parser;
    return this;
  }

  /**
   * Registers a new option for the CLI command. This option will be accessible
   * within the command handler, as well as any subcommands.
   *
   * @param name The name of the option.
   * @param config Configuration for the option. See {@link OptionConfig}.
   * @returns Updated CLI instance with the new option registered.
   */
  option<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    this.parser.option(name, config);
    return this as any as CLI<
      T & {
        [key in TOption]: TOptionConfig['coerce'] extends (
          value: string
        ) => infer TCoerce
          ? TCoerce
          : {
              string: string;
              number: number;
              boolean: boolean;
              array: (TOptionConfig extends ArrayOptionConfig<string | number>
                ? TOptionConfig['items'] extends 'string'
                  ? string
                  : number
                : never)[];
            }[TOptionConfig['type']];
      }
    >;
  }

  /**
   * Registers a new positional argument for the CLI command. This argument will be accessible
   * within the command handler, as well as any subcommands.
   * @param name The name of the positional argument.
   * @param config Configuration for the positional argument. See {@link OptionConfig}.
   * @returns Updated CLI instance with the new positional argument registered.
   */
  positional<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    this.parser.option(name, config);
    return this as any as CLI<
      T & {
        [key in TOption]: TOptionConfig['coerce'] extends (
          value: string
        ) => infer TCoerce
          ? TCoerce
          : {
              string: string;
              number: number;
              boolean: boolean;
              array: (TOptionConfig extends ArrayOptionConfig<string | number>
                ? TOptionConfig['items'] extends 'string'
                  ? string
                  : number
                : never)[];
            }[TOptionConfig['type']];
      }
    >;
  }

  /**
   * Requires a command to be provided when executing the CLI. Useful if your parent command
   * cannot be executed on its own.
   * @returns Updated CLI instance.
   */
  demandCommand() {
    this.requiresCommand = true;
    return this;
  }

  /**
   * Gets help text for the current command as a string.
   * @returns Help text for the current command.
   */
  formatHelp() {
    const help: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let command = this;
    for (const key of this.commandChain) {
      command = command.commands[key] as typeof this;
    }
    help.push(`Usage: ${[this.name, ...this.commandChain].join(' ')}`);
    if (command.configuration?.description) {
      help.push(command.configuration.description);
    }
    if (Object.keys(command.commands).length > 0) {
      help.push('');
      help.push('Commands:');
    }
    for (const key in command.commands) {
      const subcommand = command.commands[key];
      help.push(
        `  ${key}${
          subcommand.configuration?.description
            ? ' - ' + subcommand.configuration.description
            : ''
        }`
      );
    }
    if (Object.keys(this.parser.configuredOptions).length > 0) {
      help.push('');
      help.push('Options:');
    }
    for (const key in this.parser.configuredOptions) {
      const option = (this.parser.configuredOptions as any)[
        key
      ] as OptionConfig;
      help.push(
        `  --${key}${option.description ? ' - ' + option.description : ''}`
      );
    }

    if (Object.keys(command.commands).length > 0) {
      help.push(' ');
      help.push(
        `Run \`${[this.name, ...this.commandChain].join(
          ' '
        )} [command] --help\` for more information on a command`
      );
    }

    return help.join('\n');
  }

  /**
   * Prints help text for the current command to the console.
   */
  printHelp() {
    console.log(this.formatHelp());
  }

  /**
   * Runs the current command.
   * @param cmd The command to run.
   * @param args The arguments to pass to the command.
   */
  async runCommand<T extends ParsedArgs>(cmd: CLI<T>, args: T) {
    try {
      if (cmd.requiresCommand) {
        throw new Error(
          `${[this.name, ...this.commandChain].join(' ')} requires a command`
        );
      }
      if (cmd.configuration?.handler) {
        await cmd.configuration.handler(args);
      } else {
        throw new Error(
          `${[this.name, ...this.commandChain].join(' ')} is not implemented.`
        );
      }
    } catch (e) {
      process.exitCode = 1;
      console.error(e);
      this.printHelp();
    }
  }

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  async forge(args: string[] = process.argv.slice(2)) {
    // Parsing the args does two things:
    // - builds argv to pass to handler
    // - fills the command chain + registers commands
    const argv = this.parser.parse(args);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentCommand: CLI<any> = this;
    for (const command of this.commandChain) {
      currentCommand = currentCommand.commands[command];
    }
    if (argv.help) {
      this.printHelp();
      return;
    }

    const finalArgV =
      currentCommand === this
        ? (
            this.configuration?.builder?.(this as any).parser ?? this.parser
          ).parse(args)
        : argv;

    await this.runCommand(currentCommand, finalArgV);
  }

  getParser() {
    return this.parser.asReadonly();
  }

  getSubcommands() {
    return this.commands as Readonly<Record<string, CLI>>;
  }

  clone() {
    const clone = new CLI<T, T2>(this.name, this.configuration);
    clone.commands = { ...this.commands };
    clone.commandChain = [...this.commandChain];
    clone.requiresCommand = this.requiresCommand;
    clone.parser = this.parser.clone() as any;
    return clone;
  }
}

/**
 * Constructs a CLI instance. See {@link CLI} for more information.
 * @param name Name for the top level CLI
 * @returns
 */
export function cli(name: string) {
  return new CLI(name);
}

export default cli;
