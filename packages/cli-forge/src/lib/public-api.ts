import {
  OptionConfig,
  OptionConfigToType,
  ParsedArgs,
} from '@cli-forge/parser';

import { InternalCLI } from './cli-forge';

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
  option<TOption extends string, const TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TOptionConfig>;
    }
  >;

  /**
   * Registers a new positional argument for the CLI command. This argument will be accessible
   * within the command handler, as well as any subcommands.
   * @param name The name of the positional argument.
   * @param config Configuration for the positional argument. See {@link OptionConfig}.
   * @returns Updated CLI instance with the new positional argument registered.
   */
  positional<TOption extends string, const TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TOptionConfig>;
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

  group({
    label,
    keys,
    sortOrder,
  }: {
    label: string;
    keys: (keyof TArgs)[];
    sortOrder: number;
  }): CLI<TArgs>;
  group(label: string, keys: (keyof TArgs)[]): CLI<TArgs>;

  middleware(callback: (args: TArgs) => void): CLI<TArgs>;

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge(args?: string[]): Promise<TArgs>;
}

export interface CLIHandlerContext {
  command: CLI<any>;
}

/**
 * Represents the configuration needed to create a CLI command.
 */
export interface CLICommandOptions<
  /**
   * The type of the arguments that are already registered before `builder` is invoked.
   */
  TInitial extends ParsedArgs,
  /**
   * The type of the arguments that are registered after `builder` is invoked, and the type that is passed to the handler.
   */
  TArgs extends TInitial = TInitial
> {
  /**
   * The command description. This will be displayed in the help text and generated docs.
   */
  description?: string;

  /**
   * The command builder. This function is called before the command is executed, and is used to register options and positional parameters.
   * @param parser The parser instance to register options and positionals with.
   */
  builder?: (parser: CLI<TInitial>) => CLI<TArgs>;

  /**
   * The command handler. This function is called when the command is executed.
   * @param args The parsed arguments.
   * @param context Context for the handler. Contains the command instance.
   */
  handler?: (args: TArgs, context: CLIHandlerContext) => void | Promise<void>;

  /**
   * The usage text for the command. This text will be displayed in place of the default usage text in the help text and generated docs.
   */
  usage?: string;

  /**
   * Examples to display in the help text and generated docs.
   */
  examples?: string[];

  /**
   * Hides the command from the help text and generated docs. Useful primarily for experimental or internal commands.
   */
  hidden?: boolean;

  /**
   * The epilogue text for the command. This text will be displayed at the end of the help text and generated docs.
   */
  epilogue?: string;
}

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
