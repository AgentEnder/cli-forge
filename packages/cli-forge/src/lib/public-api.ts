/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
  ArrayOptionConfig,
  BooleanOptionConfig,
  type ConfigurationFiles,
  EnvOptionConfig,
  LocalizationDictionary,
  LocalizationFunction,
  MakeUndefinedPropertiesOptional,
  NumberOptionConfig,
  ObjectOptionConfig,
  OptionConfig,
  OptionConfigToType,
  ParsedArgs,
  ResolveProperties,
  StringOptionConfig,
  WithOptional,
} from '@cli-forge/parser';

import { InternalCLI } from './internal-cli';
import type { PromptOptionConfig, PromptProvider } from './prompt-types';

/**
 * Extracts the command name from a Command type.
 * Works with both CLI instances and command config objects.
 */
export type ExtractCommandName<T> = T extends CLI<any, any, any>
  ? T extends InternalCLI<any, any, any>
    ? string
    : string
  : T extends { name: infer N }
  ? N extends string
    ? N
    : string
  : string;

/**
 * Extracts the args type from a Command.
 * Works with both CLI instances and command config objects.
 */
export type ExtractCommandArgs<T> = T extends CLI<infer A, any, any>
  ? A
  : T extends CLICommandOptions<any, infer A, any, any>
  ? A
  : ParsedArgs;

/**
 * Extracts the handler return type from a Command.
 */
export type ExtractCommandHandlerReturn<T> = T extends CLI<any, infer R, any>
  ? R
  : T extends CLICommandOptions<any, any, infer R, any>
  ? R
  : void;

/**
 * Converts a Command to its child CLI entry for TChildren tracking.
 * TParentCLI is the parent CLI type that will be set as the child's TParent.
 */
export type CommandToChildEntry<T, TParentCLI = undefined> = {
  [K in ExtractCommandName<T>]: CLI<
    ExtractCommandArgs<T>,
    ExtractCommandHandlerReturn<T>,
    {},
    TParentCLI
  >;
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
  THandlerReturn = void,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TChildren = {},
  TParent = undefined
> {
  command<
    TCommandArgs extends TArgs,
    TCmdName extends string,
    TChildHandlerReturn = void
  >(
    cmd: Command<TArgs, TCommandArgs, TCmdName, TChildHandlerReturn>
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren & {
      [key in TCmdName]: CLI<
        TCommandArgs,
        TChildHandlerReturn,
        {},
        CLI<TArgs, THandlerReturn, TChildren, TParent>
      >;
    },
    TParent
  >;

  /**
   * Registers a new command with the CLI.
   * @param key What should the new command be called?
   * @param options Settings for the new command. See {@link CLICommandOptions}.
   * @returns Updated CLI instance with the new command registered.
   */
  command<
    TCommandArgs extends TArgs,
    TChildHandlerReturn,
    TKey extends string,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    TChildChildren = {}
  >(
    key: TKey,
    options: CLICommandOptions<
      TArgs,
      TCommandArgs,
      TChildHandlerReturn,
      TChildren,
      CLI<TArgs, THandlerReturn, TChildren, TParent>,
      TChildChildren
    >
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren & {
      [key in TKey]: CLI<
        TCommandArgs,
        TChildHandlerReturn,
        TChildChildren,
        CLI<TArgs, THandlerReturn, TChildren, TParent>
      >;
    },
    TParent
  >;

  /**
   * Registers multiple subcommands with the CLI.
   * @param commands Several commands to register. Can be the result of a call to {@link cli} or a configuration object.
   * @returns Updated CLI instance with the commands registered and their types tracked in TChildren.
   */
  // Typed overloads for 1-10 commands to preserve individual command types
  // Each child command gets this CLI as its TParent
  commands<C1 extends Command>(
    c1: C1
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<C1 extends Command, C2 extends Command>(
    c1: C1,
    c2: C2
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<C1 extends Command, C2 extends Command, C3 extends Command>(
    c1: C1,
    c2: C2,
    c3: C3
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command,
    C5 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command,
    C5 extends Command,
    C6 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5,
    c6: C6
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command,
    C5 extends Command,
    C6 extends Command,
    C7 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5,
    c6: C6,
    c7: C7
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command,
    C5 extends Command,
    C6 extends Command,
    C7 extends Command,
    C8 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5,
    c6: C6,
    c7: C7,
    c8: C8
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C8, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command,
    C5 extends Command,
    C6 extends Command,
    C7 extends Command,
    C8 extends Command,
    C9 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5,
    c6: C6,
    c7: C7,
    c8: C8,
    c9: C9
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C8, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C9, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  commands<
    C1 extends Command,
    C2 extends Command,
    C3 extends Command,
    C4 extends Command,
    C5 extends Command,
    C6 extends Command,
    C7 extends Command,
    C8 extends Command,
    C9 extends Command,
    C10 extends Command
  >(
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5,
    c6: C6,
    c7: C7,
    c8: C8,
    c9: C9,
    c10: C10
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C8, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C9, CLI<TArgs, THandlerReturn, TChildren, TParent>> &
      CommandToChildEntry<C10, CLI<TArgs, THandlerReturn, TChildren, TParent>>,
    TParent
  >;
  // Fallback for arrays or more than 10 commands (loses individual type tracking)
  commands(commands: Command[]): CLI<TArgs, THandlerReturn, TChildren, TParent>;
  commands(
    ...commands: Command[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Register's a configuration provider for the CLI. See {@link ConfigurationProviders} for built-in providers.
   *
   * @param provider Provider to register.
   */
  config(
    provider: ConfigurationFiles.AnyConfigProvider<TArgs>
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Updates configuration by routing each key to its owning provider.
   *
   * @param values Partial configuration to write.
   */
  updateConfig(values: Partial<TArgs>): Promise<void>;
  /**
   * Updates configuration via an updater function. The current merged
   * configuration is passed via a proxy that tracks which properties are set.
   * Only properties set during the callback are written back.
   *
   * @param updater Function that receives the current config and mutates it.
   */
  updateConfig(
    updater: ConfigurationFiles.ConfigUpdater<TArgs>
  ): Promise<void>;

  /**
   * Enables the ability to run CLI commands that contain subcommands as an interactive shell.
   * This presents as a small shell that only knows the current command and its subcommands.
   * Any flags already consumed by the command will be passed to every subcommand invocation.
   */
  enableInteractiveShell(): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Registers a custom global error handler for the CLI. This handler will be called when an error is thrown
   * during the execution of the CLI and not otherwise handled. Error handlers should re-throw the error if they
   * cannot handle it, s.t. the next error handler can attempt to handle it.
   *
   * @param handler Typically called with an Error object, but you should be prepared to handle any type of error.
   * @param actions Actions that can be taken by the error handler. Prefer using these over process.exit for better support of interactive shells.
   */
  errorHandler(
    handler: ErrorHandler
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

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
    const TProps extends Record<string, { type: string }>
  >(
    name: TOption,
    config: ObjectOptionConfig<TCoerce, TProps> & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          unknown extends TCoerce ? ResolveProperties<TProps> : TCoerce,
          ObjectOptionConfig<TCoerce, TProps>
        >;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // String option overload
  option<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Number option overload
  option<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Boolean option overload
  option<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Array option overload
  option<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Generic fallback overload
  option<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
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
    const TProps extends Record<string, { type: string }>
  >(
    name: TOption,
    config: ObjectOptionConfig<TCoerce, TProps> & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          unknown extends TCoerce ? ResolveProperties<TProps> : TCoerce,
          ObjectOptionConfig<TCoerce, TProps>
        >;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // String option overload
  positional<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Number option overload
  positional<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Boolean option overload
  positional<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Array option overload
  positional<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
  // Generic fallback overload
  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig & { prompt?: PromptOptionConfig<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;

  /**
   * Adds support for reading CLI options from environment variables.
   * @param prefix The prefix to use when looking up environment variables. Defaults to the command name.
   */
  env(prefix?: string): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  env(options: EnvOptionConfig): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Sets up localization for option keys and other text.
   * When localization is enabled, option keys will be displayed in the specified locale in help text and documentation,
   * and both the default and localized keys will be accepted when parsing arguments.
   *
   * @param dictionary The localization dictionary mapping keys to their translations
   * @param locale The target locale (defaults to system locale if not provided)
   * @returns Updated CLI instance for chaining
   *
   * @example
   * ```ts
   * cli('myapp')
   *   .localize({
   *     name: { default: 'name', 'es-ES': 'nombre' },
   *     port: { default: 'port', 'es-ES': 'puerto' }
   *   }, 'es-ES')
   *   .option('name', { type: 'string' })
   *   .option('port', { type: 'number' });
   * ```
   */
  localize(
    dictionary: LocalizationDictionary,
    locale?: string
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;
  /**
   * Sets up localization using a custom function for translating keys.
   * This allows integration with existing localization libraries like i18next.
   *
   * @param fn A function that takes a key and returns its localized value
   * @returns Updated CLI instance for chaining
   *
   * @example
   * ```ts
   * import i18next from 'i18next';
   *
   * cli('myapp')
   *   .localize((key) => i18next.t(key))
   *   .option('name', { type: 'string' })
   *   .option('port', { type: 'number' });
   * ```
   */
  localize(
    fn: LocalizationFunction
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Sets a group of options as mutually exclusive. If more than one option is provided, there will be a validation error.
   * @param options The options that should be mutually exclusive.
   */
  conflicts(
    ...options: [string, string, ...string[]]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Sets a group of options as mutually inclusive. If one option is provided, all other options must also be provided.
   * @param option The option that implies the other options.
   * @param impliedOptions The options which become required when the option is provided.
   */
  implies(
    option: string,
    ...impliedOptions: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Requires a command to be provided when executing the CLI. Useful if your parent command
   * cannot be executed on its own.
   * @returns Updated CLI instance.
   */
  demandCommand(): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Enables or disables strict mode. When strict mode is enabled, the parser throws a validation error
   * when unmatched arguments are encountered. Unmatched arguments are those that don't match any
   * configured option or positional argument.
   * @param enable Whether to enable strict mode. Defaults to true.
   * @returns Updated CLI instance.
   */
  strict(enable?: boolean): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Sets the usage text for the CLI. This text will be displayed in place of the default usage text
   * @param usageText Text displayed in place of the default usage text for `--help` and in generated docs.
   */
  usage(usageText: string): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Sets the description for the CLI. This text will be displayed in the help text and generated docs.
   * @param examples Examples to display in the help text and generated docs.
   */
  examples(
    ...examples: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Allows overriding the version displayed when passing `--version`. Defaults to crawling
   * the file system to get the package.json of the currently executing command.
   * @param override
   */
  version(override?: string): CLI<TArgs, THandlerReturn, TChildren, TParent>;

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
    sortOrder?: number;
  }): CLI<TArgs, THandlerReturn, TChildren, TParent>;
  group(
    label: string,
    keys: (keyof TArgs)[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  middleware<TArgs2>(
    callback: MiddlewareFunction<TArgs, TArgs2>
  ): CLI<
    TArgs2 extends void ? TArgs : TArgs & TArgs2,
    THandlerReturn,
    TChildren,
    TParent
  >;

  /**
   * Registers an init hook that runs before command resolution.
   * Init hooks receive partially-parsed args (from currently-registered options)
   * and can modify the CLI (register commands, options, middleware) before the
   * full parse runs. This enables plugin loading from config files.
   *
   * @param callback Async function receiving (args, cli). Mutate cli to add commands/options.
   */
  init(
    callback: (
      cli: CLI<TArgs, THandlerReturn, TChildren, TParent>,
      args: TArgs
    ) => Promise<void> | void
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge(args?: string[]): Promise<TArgs>;

  /**
   * Returns the typed children commands registered with this CLI.
   * The return type is determined by the commands registered via `command()` or `commands()`.
   *
   * @example
   * ```ts
   * const app = cli('app')
   *   .command('init', { ... })
   *   .command('build', { ... });
   *
   * const children = app.getChildren();
   * // children.init and children.build are typed CLI instances
   * const initHandler = children.init.getHandler();
   * ```
   */
  getChildren(): TChildren;

  /**
   * Returns the parent CLI instance, if this command was registered as a subcommand.
   * Returns undefined for root-level CLI instances.
   *
   * @example
   * ```ts
   * const build = cli('build', {
   *   handler: (args, ctx) => {
   *     const parent = ctx.command.getParent();
   *     const siblings = parent?.getChildren();
   *     // Access sibling commands
   *   }
   * });
   * ```
   */
  getParent(): TParent;

  /**
   * Returns a programmatic SDK for invoking this CLI and its subcommands.
   * The SDK provides typed function calls instead of argv parsing.
   *
   * @example
   * ```ts
   * const myCLI = cli('my-app')
   *   .option('verbose', { type: 'boolean' })
   *   .command('build', {
   *     builder: (cmd) => cmd.option('watch', { type: 'boolean' }),
   *     handler: (args) => ({ success: true, files: ['a.js'] })
   *   });
   *
   * const sdk = myCLI.sdk();
   *
   * // Invoke root command (if it has a handler)
   * await sdk({ verbose: true });
   *
   * // Invoke subcommand with typed args
   * const result = await sdk.build({ watch: true });
   * console.log(result.files);       // ['a.js']
   * console.log(result.$args.watch); // true
   *
   * // Use CLI-style args for -- support
   * await sdk.build(['--watch', '--', 'extra-arg']);
   * ```
   *
   * @returns An SDK object that is callable (if this command has a handler)
   *          and has properties for each subcommand.
   */
  sdk(): SDKCommand<TArgs, THandlerReturn, TChildren>;

  /**
   * Returns the builder function for this command as a composable builder.
   * The returned function can be used with `chain` to compose multiple builders.
   *
   * @example
   * ```ts
   * const siblings = args.getParent().getChildren();
   * const withBuildArgs = siblings.build.getBuilder()!;
   * const withServeArgs = siblings.serve.getBuilder()!;
   * return chain(args, withBuildArgs, withServeArgs);
   * ```
   */
  getBuilder():
    | (<
        TInit extends ParsedArgs,
        TInitHandlerReturn,
        TInitChildren,
        TInitParent
      >(
        parser: CLI<TInit, TInitHandlerReturn, TInitChildren, TInitParent>
      ) => CLI<
        TInit & TArgs,
        TInitHandlerReturn,
        TInitChildren & TChildren,
        TInitParent
      >)
    | undefined;
  getHandler():
    | ((args: Omit<TArgs, keyof ParsedArgs>) => THandlerReturn)
    | undefined;
}

export interface CLIHandlerContext<TChildren = {}, TParent = any> {
  command: CLI<any, any, TChildren, TParent>;
}

/**
 * Extracts the TChildren type parameter from a CLI type.
 */
export type ExtractCLIChildren<T> = T extends CLI<any, any, infer C, any>
  ? C
  : {};

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
  THandlerReturn = void | Promise<void>,
  /**
   * The children commands that exist before the builder runs.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TInitialChildren = {},
  TParent = any,
  /**
   * The children commands after the builder runs (includes TInitialChildren plus any added by builder).
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TChildren = {}
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
   */
  // Note: Builder uses 'any' for THandlerReturn to avoid inference conflicts with the handler.
  // The handler's return type is inferred independently from the handler function itself.
  builder?: (
    parser: CLI<TInitial, any, TInitialChildren, TParent>
  ) => CLI<TArgs, any, TChildren, any>;

  /**
   * The command handler. This function is called when the command is executed.
   * @param args The parsed arguments.
   * @param context Context for the handler. Contains the command instance.
   */
  handler?: (
    args: NoInfer<TArgs>,
    context: CLIHandlerContext<NoInfer<TChildren>, TParent>
  ) => THandlerReturn;

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
  TArgs extends TInitial = TInitial,
  TCommandName extends string = string,
  THandlerReturn = void
> =
  | ({
      name: TCommandName;
    } & CLICommandOptions<TInitial, TArgs, THandlerReturn>)
  | CLI<TArgs, THandlerReturn>;

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

export type UnknownCLI = CLI<ParsedArgs, any, any, any>;

export type MiddlewareFunction<TArgs extends ParsedArgs, TArgs2> = (
  args: TArgs
) => TArgs2 | Promise<TArgs2>;

// ============================================================================
// SDK Types
// ============================================================================

/**
 * Result type that conditionally includes $args.
 * Only attaches $args when result is an object type.
 * Uses `Awaited<T>` to handle async handlers that return `Promise<U>`.
 */
export type SDKResult<TArgs, THandlerReturn> =
  Awaited<THandlerReturn> extends object
    ? Awaited<THandlerReturn> & { $args: TArgs }
    : Awaited<THandlerReturn>;

/**
 * The callable signature for a command with a handler.
 * Supports both object-style args (typed, skips validation) and
 * string array args (CLI-style, full validation pipeline).
 */
export type SDKInvokable<TArgs, THandlerReturn> = {
  /**
   * Invoke the command with typed object args.
   * Skips validation (TypeScript handles it), applies defaults, runs middleware.
   */
  (args?: Partial<Omit<TArgs, 'unmatched' | '--'>>): Promise<
    SDKResult<TArgs, THandlerReturn>
  >;
  /**
   * Invoke the command with CLI-style string args.
   * Runs full pipeline: parse → validate → middleware → handler.
   * Use this when you need to pass `--` extra args.
   */
  (args: string[]): Promise<SDKResult<TArgs, THandlerReturn>>;
};

/**
 * Recursively builds SDK type from TChildren.
 * Each child command becomes a property on the SDK object.
 */
export type SDKChildren<TChildren> = {
  [K in keyof TChildren]: TChildren[K] extends CLI<
    infer A,
    infer R,
    infer C,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _P
  >
    ? SDKCommand<A, R, C>
    : never;
};

/**
 * A single SDK command - callable if it has a handler, with nested children as properties.
 * Container commands (no handler) are not callable but still provide access to children.
 */
export type SDKCommand<TArgs, THandlerReturn, TChildren> =
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  // THandlerReturn extends void | undefined
  // ? SDKChildren<TChildren> // No handler = just children (not callable)
  SDKInvokable<TArgs, THandlerReturn> & SDKChildren<TChildren>;

/**
 * Constructs a CLI instance. See {@link CLI} for more information.
 * @param name Name for the top level CLI
 * @param rootCommandConfiguration Configuration used when running the bare CLI. e.g. npx my-cli, rather than npx my-cli [cmd]
 * @returns A {@link CLI} instance.
 */
export function cli<
  TArgs extends ParsedArgs,
  THandlerReturn = void,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TChildren = {},
  TName extends string = string
>(
  name: TName,
  rootCommandConfiguration?: CLICommandOptions<
    ParsedArgs,
    TArgs,
    THandlerReturn,
    {},
    any,
    TChildren
  >
) {
  return new InternalCLI(name, rootCommandConfiguration as any) as any as CLI<
    TArgs,
    THandlerReturn,
    TChildren
  >;
}

export default cli;
