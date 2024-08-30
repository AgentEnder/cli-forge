import {
  ArgvParser,
  ArrayOptionConfig,
  OptionConfig,
  ParsedArgs,
  ValidationFailedError,
  fromCamelOrDashedCaseToConstCase,
  hideBin,
} from '@cli-forge/parser';
import { getCallingFile, getParentPackageJson } from './utils';
import { INTERACTIVE_SHELL, InteractiveShell } from './interactive-shell';

export interface CLIHandlerContext {
  command: CLI<any>;
}

export type CLICommandOptions<
  TInitial extends ParsedArgs,
  TArgs extends TInitial = TInitial
> = {
  description?: string;
  builder?: (parser: CLI<TInitial>) => CLI<TArgs>;
  handler?: (args: TArgs, context: CLIHandlerContext) => void | Promise<void>;
  usage?: string;
  examples?: string[];
};

export type Command<
  TInitial extends ParsedArgs = any,
  TArgs extends TInitial = TInitial
> =
  | ({
      name: string;
    } & CLICommandOptions<TInitial, TArgs>)
  | CLI<TArgs>;

/**
 * Error Handler for CLI applications. Error handlers should re-throw the error if they cannot handle it.
 *
 * @param e The error that was thrown.
 * @param actions Actions that can be taken by the error handler. Prefer using these over process.exit for better support of interactive shells.
 */
export type ErrorHandler = (
  e: unknown,
  actions: {
    /**
     * Exits the process immediately.
     * @param code
     */
    exit: (code?: number) => void;
  }
) => void;

/**
 * The interface for a CLI application or subcommands.
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
   * Enables the ability to run CLI commands that contain subcommands as an interactive shell.
   * This presents as a small shell that only knows the current command and its subcommands.
   * Any flags already consumed by the command will be passed to every subcommand invocation.
   */
  enableInteractiveShell(): CLI<TArgs>;

  /**
   * Registers a custom global error handler for the CLI. This handler will be called when an error is thrown
   * during the execution of the CLI and not otherwise handled. Error handlers should re-throw the error if they
   * cannot handle it, s.t. the next error handler can attempt to handle it.
   *
   * @param handler Typically called with an Error object, but you should be prepared to handle any type of error.
   * @param actions Actions that can be taken by the error handler. Prefer using these over process.exit for better support of interactive shells.
   */
  errorHandler(handler: ErrorHandler): CLI<TArgs>;

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
   * Adds support for reading CLI options from environment variables.
   * @param prefix The prefix to use when looking up environment variables. Defaults to the command name.
   */
  env(prefix?: string): CLI<TArgs>;

  /**
   * Sets a group of options as mutually exclusive. If more than one option is provided, there will be a validation error.
   * @param options The options that should be mutually exclusive.
   */
  conflicts(...options: [string, string, ...string[]]): CLI<TArgs>;

  /**
   * Sets a group of options as mutually inclusive. If one option is provided, all other options must also be provided.
   * @param option The option that implies the other options.
   * @param impliedOptions The options which become required when the option is provided.
   */
  implies(option: string, ...impliedOptions: string[]): CLI<TArgs>;

  /**
   * Requires a command to be provided when executing the CLI. Useful if your parent command
   * cannot be executed on its own.
   * @returns Updated CLI instance.
   */
  demandCommand(): CLI<TArgs>;

  /**
   * Sets the usage text for the CLI. This text will be displayed in place of the default usage text
   * @param usageText Text displayed in place of the default usage text for `--help` and in generated docs.
   */
  usage(usageText: string): CLI<TArgs>;

  /**
   * Sets the description for the CLI. This text will be displayed in the help text and generated docs.
   * @param examples Examples to display in the help text and generated docs.
   */
  examples(...examples: string[]): CLI<TArgs>;

  /**
   * Allows overriding the version displayed when passing `--version`. Defaults to crawling
   * the file system to get the package.json of the currently executing command.
   * @param override
   */
  version(override?: string): CLI<TArgs>;

  /**
   * Prints help text to stdout.
   */
  printHelp(): void;

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge(args?: string[]): Promise<TArgs>;
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
  /**
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  registeredCommands: Record<string, InternalCLI<any>> = {};

  /**
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  commandChain: string[] = [];

  private requiresCommand: 'IMPLICIT' | 'EXPLICIT' | false = 'IMPLICIT';

  private _configuration?: CLICommandOptions<any, any>;

  private _versionOverride?: string;

  private registeredErrorHandlers: Array<ErrorHandler> = [
    (e: unknown, actions) => {
      if (e instanceof ValidationFailedError) {
        this.printHelp();
        console.log();
        console.log(e.message);
        console.log(e.errors.map((e) => `  - ${e.message}`).join('\n'));
        actions.exit(1);
      }
    },
  ];

  get configuration() {
    return this._configuration;
  }

  private set configuration(value: CLICommandOptions<any, any> | undefined) {
    this._configuration = value;
  }

  private parser = new ArgvParser<TArgs>({
    unmatchedParser: (arg) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCommand: InternalCLI<any> = this;
      for (const command of this.commandChain) {
        currentCommand = currentCommand.registeredCommands[command];
      }
      const command = currentCommand.registeredCommands[arg];
      if (command && command.configuration) {
        command.parser = this.parser;
        command.configuration.builder?.(command);
        this.commandChain.push(arg);
        return true;
      }
      return false;
    },
  })
    .option('help', {
      type: 'boolean',
      alias: ['h'],
      description: 'Show help for the current command',
    })
    .option('version', {
      type: 'boolean',
      description: 'Show the version number for the CLI',
    });

  /**
   * @param name What should the name of the cli command be?
   * @param configuration Configuration for the current CLI command.
   */
  constructor(
    public name: string,
    rootCommandConfiguration?: CLICommandOptions<TArgs>
  ) {
    if (rootCommandConfiguration) {
      this.withRootCommandConfiguration(rootCommandConfiguration);
    } else {
      this.requiresCommand = 'IMPLICIT';
    }
  }

  withRootCommandConfiguration<TRootCommandArgs extends TArgs>(
    configuration: CLICommandOptions<TArgs, TRootCommandArgs>
  ): InternalCLI<TArgs> {
    this.configuration = configuration;
    this.requiresCommand = false;
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
        this.withRootCommandConfiguration({
          ...this._configuration,
          builder: options.builder as any,
          handler: options.handler as any,
          description: options.description,
        });
      }
      this.registeredCommands[key] = new InternalCLI<TArgs>(
        key
      ).withRootCommandConfiguration(options);
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

  commands(commands: Command[]): CLI<TArgs>;
  commands(...commands: Command[]): CLI<TArgs>;
  commands(...a0: Command[] | Command[][]): CLI<TArgs> {
    const commands = a0.flat();
    for (const val of commands) {
      if (val instanceof InternalCLI) {
        this.registeredCommands[val.name] = val;
        // Include any options that were defined via cli(...).option() instead of via builder
        this.parser.augment(val.parser);
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
    // Interface modifies the return type to reflect new params, cast is necessay.... I think 🤔
    return this as any;
  }

  positional<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    this.parser.positional(name, config);
    // Interface modifies the return type to reflect new params, cast is necessay.... I think 🤔
    return this as any;
  }

  conflicts(...args: [string, string, ...string[]]): CLI<TArgs> {
    this.parser.conflicts(...args);
    return this;
  }

  implies(option: string, ...impliedOptions: string[]): CLI<TArgs> {
    this.parser.implies(option, ...impliedOptions);
    return this;
  }

  env(prefix = fromCamelOrDashedCaseToConstCase(this.name)) {
    this.parser.env(prefix);
    return this;
  }

  demandCommand() {
    this.requiresCommand = 'EXPLICIT';
    return this;
  }

  usage(usageText: string) {
    this.configuration ??= {};
    this.configuration.usage = usageText;
    return this;
  }

  examples(...examples: string[]) {
    this.configuration ??= {};
    this.configuration.examples ??= [];
    this.configuration.examples.push(...examples);
    return this;
  }

  version(version?: string) {
    this._versionOverride = version;
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
      `Usage: ${
        this.configuration?.usage
          ? this.configuration.usage
          : [
              this.name,
              ...this.commandChain,
              ...command.parser.configuredPositionals.map((p) =>
                p.required ? `<${p.key}>` : `[${p.key}]`
              ),
            ].join(' ')
      }`
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
    const nonpositionalOptions = Object.values(
      command.parser.configuredOptions
    ).filter((c) => !c.positional);
    if (nonpositionalOptions.length > 0) {
      help.push('');
      help.push('Options:');
    }

    function getOptionParts(option: OptionConfig) {
      const parts = [];
      if (option.description) {
        parts.push(option.description);
      }
      if (option.choices) {
        const choices =
          typeof option.choices === 'function'
            ? option.choices()
            : option.choices;
        parts.push(`(${choices.join(', ')})`);
      }
      if (option.default) {
        parts.push('[default: ' + option.default + ']');
      } else if (option.required) {
        parts.push('[required]');
      }
      if (option.deprecated) {
        parts.push('[deprecated: ' + option.deprecated + ']');
      }
      return parts;
    }

    const allParts: Array<[key: string, ...parts: string[]]> = [];
    for (const option of nonpositionalOptions) {
      allParts.push([option.key, ...getOptionParts(option)]);
    }
    const paddingValues: number[] = [];
    for (let i = 0; i < allParts.length; i++) {
      for (let j = 0; j < allParts[i].length; j++) {
        if (!paddingValues[j]) {
          paddingValues[j] = 0;
        }
        paddingValues[j] = Math.max(paddingValues[j], allParts[i][j].length);
      }
    }
    for (const [key, ...parts] of allParts) {
      help.push(
        `  --${key.padEnd(paddingValues[0])}${parts.length ? ' - ' : ''}${parts
          .map((part, i) => part.padEnd(paddingValues[i + 1]))
          .join(' ')}`
      );
    }

    if (command.configuration?.examples?.length) {
      help.push('');
      help.push('Examples:');
      for (const example of command.configuration.examples) {
        help.push(`  \`${example}\``);
      }
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
  async runCommand<T extends ParsedArgs>(
    cmd: InternalCLI<T>,
    args: T,
    originalArgV: string[]
  ) {
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
        // We can treat a command as a subshell if it has subcommands
        if (Object.keys(cmd.registeredCommands).length > 0) {
          cmd.command('help', { handler: () => this.printHelp() });
          if (!INTERACTIVE_SHELL) {
            const tui = new InteractiveShell(this, {
              prependArgs: originalArgV,
            });
            await new Promise<void>((res) => {
              ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((s) =>
                process.on(s, () => {
                  tui.close();
                  res();
                })
              );
            });
          }
        }
        // No subcommands so subshell doesn't make sense
        // No handler, so nothing to run
        else {
          throw new Error(
            `${[this.name, ...this.commandChain].join(' ')} is not implemented.`
          );
        }
      }
    } catch (e) {
      process.exitCode = 1;
      console.error(e);
      this.printHelp();
    }
  }

  enableInteractiveShell() {
    if (this.requiresCommand === 'EXPLICIT') {
      throw new Error(
        'Interactive shell is not supported for commands that require a command.'
      );
    } else if (process.stdout.isTTY) {
      this.requiresCommand = false;
    }
    return this;
  }

  private versionHandler() {
    if (this._versionOverride) {
      console.log(this._versionOverride);
      return;
    }
    let mainFile = require?.main?.filename;
    mainFile ??= getCallingFile();
    if (!mainFile) {
      console.log('unknown');
      return;
    }
    const packageJson = getParentPackageJson(mainFile);
    console.log(packageJson.version ?? 'unknown');
  }

  private async withErrorHandlers<T>(cb: () => T): Promise<Awaited<T>> {
    try {
      return await cb();
    } catch (e) {
      let handled = false;
      for (const handler of this.registeredErrorHandlers) {
        try {
          handler(e, {
            exit: (c) => {
              process.exit(c);
            },
          });
          // Error was handled, no need to continue
          break;
        } catch {
          // Error was not handled, continue to the next handler
        }
      }
      if (!handled) {
        throw e;
      }
    }
    return {} as Awaited<T>;
  }

  errorHandler(handler: ErrorHandler) {
    this.registeredErrorHandlers.unshift(handler);
    return this;
  }

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge = (args: string[] = hideBin(process.argv)) =>
    this.withErrorHandlers(async () => {
      // Parsing the args does two things:
      // - builds argv to pass to handler
      // - fills the command chain + registers commands
      let argv: TArgs & { help?: boolean; version?: boolean };
      let validationFailedError: ValidationFailedError<TArgs> | undefined;
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
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCommand: InternalCLI = this;
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

      const finalArgV = (() => {
        if (currentCommand === this) {
          if (this.configuration?.builder) {
            return (
              this.configuration.builder?.(this as any) as InternalCLI<TArgs>
            ).parser.parse(args);
          }
        }
        return argv;
      })();

      await this.runCommand(currentCommand, finalArgV, args);
      return finalArgV as TArgs;
    });

  getParser() {
    return this.parser.asReadonly();
  }

  getSubcommands() {
    return this.registeredCommands as Readonly<Record<string, InternalCLI>>;
  }

  clone() {
    const clone = new InternalCLI<TArgs>(this.name);
    clone.parser = this.parser.clone(clone.parser.options) as any;
    if (this.configuration) {
      clone.withRootCommandConfiguration(this.configuration);
    }
    clone.registeredCommands = {};
    for (const command in this.registeredCommands ?? {}) {
      clone.command(this.registeredCommands[command].clone());
      // this.registeredCommands[command].clone();
    }
    clone.commandChain = [...this.commandChain];
    clone.requiresCommand = this.requiresCommand;
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
  return new InternalCLI(name, rootCommandConfiguration) as any as CLI<TArgs>;
}

export default cli;
