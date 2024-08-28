import {
  ArgvParser,
  ArrayOptionConfig,
  OptionConfig,
  ParsedArgs,
} from '@cli-forge/parser';

export interface CLIHandlerContext {
  command: CLI<any>;
}

export type CLICommandOptions<
  TInitial extends ParsedArgs,
  TArgs extends TInitial = TInitial
> = {
  description?: string;
  builder?: (parser: CLI<TInitial>) => CLI<TArgs>;
  handler: (args: TArgs, context: CLIHandlerContext) => void | Promise<void>;
};

export type Command<
  TInitial extends ParsedArgs = any,
  TArgs extends TInitial = TInitial
> =
  | ({
      name: string;
    } & CLICommandOptions<TInitial, TArgs>)
  | CLI<TArgs>;

export interface CLI<TArgs extends ParsedArgs = ParsedArgs> {
  command<TCommandArgs extends TArgs>(
    cmd: Command<TArgs, TCommandArgs>
  ): CLI<TArgs>;

  /**
   * Registers a new command with the CLI.
   * @param key What should the new command be called?
   * @param options Settings for the new command. See {@link CLICommandOptions}.
   * @returns Updated CLI instance with the new command registered.
   */
  command<TCommandArgs extends TArgs>(
    key: string,
    options: CLICommandOptions<TArgs, TCommandArgs>
  ): CLI<TArgs>;

  /**
   * Registers multiple subcommands with the CLI.
   * @param commands Several commands to register. Can be the result of a call to {@link cli} or a configuration object.
   */
  commands(commands: Command[]): CLI<TArgs>;
  /**
   * Registers multiple subcommands with the CLI.
   * @param commands Several commands to register. Can be the result of a call to {@link cli} or a configuration object.
   */
  commands(...commands: Command[]): CLI<TArgs>;

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
  ): CLI<
    TArgs & {
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
  ): CLI<
    TArgs & {
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

  /**
   * Requires a command to be provided when executing the CLI. Useful if your parent command
   * cannot be executed on its own.
   * @returns Updated CLI instance.
   */
  demandCommand(): CLI<TArgs>;

  /**
   * Prints help text to stdout.
   */
  printHelp(): void;

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge(args?: string[]): Promise<void>;
}

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
export class InternalCLI<TArgs extends ParsedArgs = ParsedArgs>
  implements CLI<TArgs>
{
  private registeredCommands: Record<string, InternalCLI<any>> = {};
  private commandChain: string[] = [];
  private requiresCommand = false;

  private _configuration?: CLICommandOptions<any, any>;

  private parser = new ArgvParser<TArgs>({
    unmatchedParser: (arg) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCommand: InternalCLI<any> = this;
      for (const command of this.commandChain) {
        currentCommand = currentCommand.registeredCommands[command];
      }
      const command = currentCommand.registeredCommands[arg];
      if (command && command.configuration) {
        command.configuration.builder?.(command);
        this.commandChain.push(arg);
        return true;
      }
      return false;
    },
  }).option('help', {
    type: 'boolean',
    alias: ['h'],
    description: 'Show help for the current command',
  });

  /**
   * @param name What should the name of the cli command be?
   * @param configuration Configuration for the current CLI command.
   */
  constructor(public name: string) {}

  get configuration() {
    return this._configuration;
  }

  private set configuration(value: CLICommandOptions<any, any> | undefined) {
    this._configuration = value;
  }

  withRootCommandConfiguration<TRootCommandArgs extends TArgs>(
    configuration: CLICommandOptions<TArgs, TRootCommandArgs>
  ): InternalCLI<TArgs> {
    this.configuration = configuration;
    return this;
  }

  command<TCommandArgs extends TArgs>(
    cmd: Command<TArgs, TCommandArgs>
  ): CLI<TArgs>;

  command<TCommandArgs extends TArgs>(
    key: string,
    options: CLICommandOptions<TArgs, TCommandArgs>
  ): CLI<TArgs>;

  command<TCommandArgs extends TArgs>(
    keyOrCommand: string | Command<TArgs, TCommandArgs>,
    options?: CLICommandOptions<TArgs, TCommandArgs>
  ): CLI<TArgs> {
    if (typeof keyOrCommand === 'string') {
      const key = keyOrCommand;
      if (!options) {
        throw new Error(
          'options must be provided when calling `command` with a string'
        );
      }
      if (key === '$0') {
        this.configuration = {
          ...this.configuration,
          builder: options.builder as any,
          handler: options.handler as any,
          description: options.description,
        };
      }
      this.registeredCommands[key] = new InternalCLI<TArgs>(
        key
      ).withRootCommandConfiguration(options);
      this.registeredCommands[key].parser = this.parser;
    } else if (keyOrCommand instanceof InternalCLI) {
      const cmd = keyOrCommand;
      this.registeredCommands[cmd.name] = cmd;
    } else {
      const { name, ...configuration } = keyOrCommand as {
        name: string;
      } & CLICommandOptions<TArgs, TCommandArgs>;
      this.command<TCommandArgs>(name, configuration);
    }
    return this;
  }

  commands(commands: Command[]): typeof this;
  commands(...commands: Command[]): typeof this;
  commands(...a0: Command[] | Command[][]): typeof this {
    const commands = a0.flat();
    for (const val of commands) {
      if (val instanceof InternalCLI) {
        this.registeredCommands[val.name] = val;
        // Include any options that were defined via cli(...).option() instead of via builder
        this.parser.augment(val.parser);
        val.parser = this.parser;
      } else {
        const { name, ...configuration } = val as {
          name: string;
        } & CLICommandOptions<any, any>;
        this.command(name, configuration);
      }
    }
    return this;
  }

  option<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    this.parser.option(name, config);
    return this as any;
  }

  positional<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    this.parser.positional(name, config);
    return this as any;
  }

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
      command = command.registeredCommands[key] as typeof this;
    }
    help.push(
      `Usage: ${[
        this.name,
        ...this.commandChain,
        ...command.parser.configuredPositionals.map((p) => `[${p.key}]`),
      ].join(' ')}`
    );
    if (command.configuration?.description) {
      help.push(command.configuration.description);
    }
    if (Object.keys(command.registeredCommands).length > 0) {
      help.push('');
      help.push('Commands:');
    }
    for (const key in command.registeredCommands) {
      const subcommand = command.registeredCommands[key];
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

    if (Object.keys(command.registeredCommands).length > 0) {
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
  async runCommand<T extends ParsedArgs>(cmd: InternalCLI<T>, args: T) {
    try {
      if (cmd.requiresCommand) {
        throw new Error(
          `${[this.name, ...this.commandChain].join(' ')} requires a command`
        );
      }
      if (cmd.configuration?.handler) {
        await cmd.configuration.handler(args, {
          command: cmd,
        });
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
    let currentCommand: InternalCLI<any> = this;
    for (const command of this.commandChain) {
      currentCommand = currentCommand.registeredCommands[command];
    }
    if (argv.help) {
      this.printHelp();
      return;
    }

    const finalArgV =
      currentCommand === this
        ? (
            (this.configuration?.builder?.(this as any) as InternalCLI<TArgs>)
              ?.parser ?? this.parser
          ).parse(args)
        : argv;

    await this.runCommand(currentCommand, finalArgV);
  }

  getParser() {
    return this.parser.asReadonly();
  }

  getSubcommands() {
    return this.registeredCommands as Readonly<Record<string, InternalCLI>>;
  }

  clone() {
    const clone = new InternalCLI<TArgs>(this.name);
    if (this.configuration) {
      clone.withRootCommandConfiguration(this.configuration);
    }
    clone.registeredCommands = { ...this.registeredCommands };
    clone.commandChain = [...this.commandChain];
    clone.requiresCommand = this.requiresCommand;
    clone.parser = this.parser.clone() as any;
    return clone;
  }
}

/**
 * Constructs a CLI instance. See {@link InternalCLI} for more information.
 * @param name Name for the top level CLI
 * @param rootCommandConfiguration Configuration used when running the bare CLI. e.g. npx my-cli, rather than npx my-cli [cmd]
 * @returns A {@link InternalCLI} instance.
 */
export function cli<TArgs extends ParsedArgs>(
  name: string,
  rootCommandConfiguration?: CLICommandOptions<ParsedArgs, TArgs>
) {
  const cli = new InternalCLI(name);

  if (rootCommandConfiguration) {
    cli.withRootCommandConfiguration(rootCommandConfiguration);
  }

  return cli as CLI<TArgs>;
}

export default cli;
