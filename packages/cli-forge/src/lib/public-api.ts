import {
  type ConfigurationFiles,
  OptionConfig,
  OptionConfigToType,
  ParsedArgs,
  EnvOptionConfig,
  ObjectOptionConfig,
  StringOptionConfig,
  NumberOptionConfig,
  BooleanOptionConfig,
  ArrayOptionConfig,
  ResolveProperties,
  AdditionalPropertiesType,
  WithOptional,
} from '@cli-forge/parser';

import { InternalCLI } from './internal-cli';

/**
 * Registry of child commands with their typed CLI instances.
 * TChildren maps command names to their argument types.
 */
export type ChildCommandsRegistry<TChildren extends Record<string, ParsedArgs>> = {
  [K in keyof TChildren]: CLI<TChildren[K]>;
};

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
export interface CLI<
  TArgs extends ParsedArgs = ParsedArgs,
  TChildren extends Record<string, ParsedArgs> = {}
> {
  command<TCommandArgs extends TArgs>(
    cmd: Command<TArgs, TCommandArgs>
  ): CLI<TArgs, TChildren>;

  /**
   * Registers a new command with the CLI.
   * @param key What should the new command be called?
   * @param options Settings for the new command. See {@link CLICommandOptions}.
   * @returns Updated CLI instance with the new command registered.
   * 
   * Note: The return type preserves type accumulation for direct fluent usage.
   * For generic helper functions that wrap command registration, the registerCommand 
   * pattern works best when chaining calls directly without intermediate variables.
   */
  command<TCommandArgs extends TArgs, TKey extends string>(
    key: TKey,
    options: CLICommandOptions<TArgs, TCommandArgs, TArgs, TChildren>
  ): CLI<TArgs, TChildren & { [K in TKey]: TCommandArgs }>;

  /**
   * Registers multiple subcommands with the CLI.
   * @param commands Several commands to register. Can be the result of a call to {@link cli} or a configuration object.
   */
  commands(commands: Command[]): CLI<TArgs, TChildren>;
  /**
   * Registers multiple subcommands with the CLI.
   * @param commands Several commands to register. Can be the result of a call to {@link cli} or a configuration object.
   */
  commands(...commands: Command[]): CLI<TArgs, TChildren>;

  /**
   * Register's a configuration provider for the CLI. See {@link ConfigurationProviders} for built-in providers.
   *
   * @param provider Provider to register.
   */
  config(provider: ConfigurationFiles.ConfigurationProvider<TArgs>): CLI<TArgs, TChildren>;

  /**
   * Enables the ability to run CLI commands that contain subcommands as an interactive shell.
   * This presents as a small shell that only knows the current command and its subcommands.
   * Any flags already consumed by the command will be passed to every subcommand invocation.
   */
  enableInteractiveShell(): CLI<TArgs, TChildren>;

  /**
   * Registers a custom global error handler for the CLI. This handler will be called when an error is thrown
   * during the execution of the CLI and not otherwise handled. Error handlers should re-throw the error if they
   * cannot handle it, s.t. the next error handler can attempt to handle it.
   *
   * @param handler Typically called with an Error object, but you should be prepared to handle any type of error.
   * @param actions Actions that can be taken by the error handler. Prefer using these over process.exit for better support of interactive shells.
   */
  errorHandler(handler: ErrorHandler): CLI<TArgs, TChildren>;

  /**
   * Registers a new option for the CLI command. This option will be accessible
   * within the command handler, as well as any subcommands.
   *
   * @param name The name of the option.
   * @param config Configuration for the option. See {@link UnknownOptionConfig}.
   * @returns Updated CLI instance with the new option registered.
   */
  // Object option overload - must come first for proper contextual typing
  // Uses direct ObjectOptionConfig type (not `extends`) to ensure TypeScript
  // infers TProps from `properties` BEFORE evaluating the coerce callback type
  option<
    TOption extends string,
    TCoerce,
    const TProps extends Record<string, { type: string }>,
    TAdditionalProps extends false | 'string' | 'number' | 'boolean' = false
  >(
    name: TOption,
    config: ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>
  ): CLI<
    TArgs & {
      [key in TOption]: WithOptional<
        unknown extends TCoerce
          ? ResolveProperties<TProps> & AdditionalPropertiesType<TAdditionalProps>
          : TCoerce,
        ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>
      >;
    },
    TChildren
  >;
  // String option overload
  option<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Number option overload
  option<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Boolean option overload
  option<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Array option overload
  option<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Generic fallback overload
  option<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any, any>
  >(
    name: TOption,
    config: TOptionConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TOptionConfig>;
    },
    TChildren
  >;

  /**
   * Registers a new positional argument for the CLI command. This argument will be accessible
   * within the command handler, as well as any subcommands.
   * @param name The name of the positional argument.
   * @param config Configuration for the positional argument. See {@link UnknownOptionConfig}.
   * @returns Updated CLI instance with the new positional argument registered.
   */
  // Object option overload - must come first for proper contextual typing
  // Uses direct ObjectOptionConfig type (not `extends`) to ensure TypeScript
  // infers TProps from `properties` BEFORE evaluating the coerce callback type
  positional<
    TOption extends string,
    TCoerce,
    const TProps extends Record<string, { type: string }>,
    TAdditionalProps extends false | 'string' | 'number' | 'boolean' = false
  >(
    name: TOption,
    config: ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>
  ): CLI<
    TArgs & {
      [key in TOption]: WithOptional<
        unknown extends TCoerce
          ? ResolveProperties<TProps> & AdditionalPropertiesType<TAdditionalProps>
          : TCoerce,
        ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>
      >;
    },
    TChildren
  >;
  // String option overload
  positional<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Number option overload
  positional<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Boolean option overload
  positional<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Array option overload
  positional<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    },
    TChildren
  >;
  // Generic fallback overload
  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any, any>
  >(
    name: TOption,
    config: TOptionConfig
  ): CLI<
    TArgs & {
      [key in TOption]: OptionConfigToType<TOptionConfig>;
    },
    TChildren
  >;

  /**
   * Adds support for reading CLI options from environment variables.
   * @param prefix The prefix to use when looking up environment variables. Defaults to the command name.
   */
  env(prefix?: string): CLI<TArgs, TChildren>;

  env(options: EnvOptionConfig): CLI<TArgs, TChildren>;

  /**
   * Sets a group of options as mutually exclusive. If more than one option is provided, there will be a validation error.
   * @param options The options that should be mutually exclusive.
   */
  conflicts(...options: [string, string, ...string[]]): CLI<TArgs, TChildren>;

  /**
   * Sets a group of options as mutually inclusive. If one option is provided, all other options must also be provided.
   * @param option The option that implies the other options.
   * @param impliedOptions The options which become required when the option is provided.
   */
  implies(option: string, ...impliedOptions: string[]): CLI<TArgs, TChildren>;

  /**
   * Requires a command to be provided when executing the CLI. Useful if your parent command
   * cannot be executed on its own.
   * @returns Updated CLI instance.
   */
  demandCommand(): CLI<TArgs, TChildren>;

  /**
   * Sets the usage text for the CLI. This text will be displayed in place of the default usage text
   * @param usageText Text displayed in place of the default usage text for `--help` and in generated docs.
   */
  usage(usageText: string): CLI<TArgs, TChildren>;

  /**
   * Sets the description for the CLI. This text will be displayed in the help text and generated docs.
   * @param examples Examples to display in the help text and generated docs.
   */
  examples(...examples: string[]): CLI<TArgs, TChildren>;

  /**
   * Allows overriding the version displayed when passing `--version`. Defaults to crawling
   * the file system to get the package.json of the currently executing command.
   * @param override
   */
  version(override?: string): CLI<TArgs, TChildren>;

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
  }): CLI<TArgs, TChildren>;
  group(label: string, keys: (keyof TArgs)[]): CLI<TArgs, TChildren>;

  middleware<TArgs2>(
    callback: MiddlewareFunction<TArgs, TArgs2>
  ): CLI<TArgs2 extends void ? TArgs : TArgs & TArgs2, TChildren>;

  /**
   * Returns the builder function for this command, if defined.
   * Useful for composing commands programmatically.
   */
  getBuilder(): ((parser: CLI<any>) => CLI<TArgs>) | undefined;

  /**
   * Returns a handler function with context already bound.
   * Only requires args to be passed - context is baked in.
   * Returns undefined if no handler is defined.
   *
   * TReturn is the return type of the handler (can be any value).
   */
  getHandler<TReturn = void>(): ((args: TArgs) => TReturn | Promise<TReturn>) | undefined;

  /**
   * Returns child commands with full type inference.
   */
  getChildCommands(): ChildCommandsRegistry<TChildren>;

  /**
   * Returns the parent command's CLI instance.
   * Throws an error if called on a root command (no parent).
   */
  getParentCommand(): CLI<ParsedArgs>;

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge(args?: string[]): Promise<TArgs>;
}

/**
 * Context passed to the builder function.
 * TParentArgs: The argument type of the parent command
 * TSiblings: Record mapping sibling command names to their argument types
 */
export interface CLIBuilderContext<
  TParentArgs extends ParsedArgs = ParsedArgs,
  TSiblings extends Record<string, ParsedArgs> = {}
> {
  /**
   * Returns the parent command's CLI instance with fully typed children.
   * Call getChildCommands() on the parent to access siblings.
   */
  getParentCommand(): CLI<TParentArgs, TSiblings>;
}

/**
 * Enhanced handler context with parent/sibling access.
 * TArgs: The current command's argument type
 * TParentArgs: The parent command's argument type
 * TSiblings: Record mapping sibling command names to their argument types
 */
export interface CLIHandlerContext<
  TArgs extends ParsedArgs = ParsedArgs,
  TParentArgs extends ParsedArgs = ParsedArgs,
  TSiblings extends Record<string, ParsedArgs> = {}
> {
  /** Reference to the current command's CLI instance */
  command: CLI<TArgs>;

  /**
   * Returns the parent command's CLI instance with fully typed children.
   * Call getChildCommands() on the parent to access siblings.
   */
  getParentCommand(): CLI<TParentArgs, TSiblings>;
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
  TArgs extends TInitial = TInitial,
  /**
   * The type of the parent command's arguments.
   */
  TParentArgs extends ParsedArgs = ParsedArgs,
  /**
   * Record mapping sibling command names to their argument types.
   */
  TSiblings extends Record<string, ParsedArgs> = {}
> {
  /**
   * If set the command will be registered under the provided name and any aliases.
   *
   * This can be useful if a command should be executed under more than one name, e.g. `npx my-cli` and `npx my-cli hello`.
   */
  alias?: string[];

  /**
   * The command description. This will be displayed in the help text and generated docs.
   */
  description?: string;

  /**
   * The command builder. This function is called before the command is executed, and is used to register options and positional parameters.
   * @param parser The parser instance to register options and positionals with.
   * @param context Context for the builder. Contains parent command access.
   */
  builder?: (parser: CLI<TInitial>, context: CLIBuilderContext<TParentArgs, TSiblings>) => CLI<TArgs>;

  /**
   * The command handler. This function is called when the command is executed.
   * @param args The parsed arguments.
   * @param context Context for the handler. Contains the command instance and parent access.
   */
  handler?: (args: TArgs, context: CLIHandlerContext<TArgs, TParentArgs, TSiblings>) => void | Promise<void> | any;

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
    } & CLICommandOptions<TInitial, TArgs, any, any>)
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

export type MiddlewareFunction<TArgs extends ParsedArgs, TArgs2> = (
  args: TArgs
) => TArgs2 | Promise<TArgs2>;

/**
 * Constructs a CLI instance. See {@link CLI} for more information.
 * @param name Name for the top level CLI
 * @param rootCommandConfiguration Configuration used when running the bare CLI. e.g. npx my-cli, rather than npx my-cli [cmd]
 * @returns A {@link CLI} instance.
 */
export function cli<TArgs extends ParsedArgs>(
  name: string,
  rootCommandConfiguration?: CLICommandOptions<ParsedArgs, TArgs, ParsedArgs, {}>
) {
  return new InternalCLI(name, rootCommandConfiguration as any) as any as CLI<TArgs>;
}

export default cli;
