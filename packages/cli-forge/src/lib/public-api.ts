 
import {
  ArrayOptionConfig,
  BooleanOptionConfig,
  type ConfigurationFiles,
  EnvOptionConfig,
  LocalizationDictionary,
  LocalizationFunction,
  Expand,
  MakeUndefinedPropertiesOptional,
  NumberOptionConfig,
  ObjectOptionConfig,
  OneOfOptionConfig,
  OptionConfig,
  OptionConfigToType,
  ParsedArgs,
  ResolveProperties,
  StringOptionConfig,
  WithOptional,
} from '@cli-forge/parser';

import { InternalCLI } from './internal-cli';
import type { CompletionCallback, OptionCompletionCallback } from './completion-types';
import type { PromptOptionConfig, PromptProvider } from './prompt-types';
import type { CommandContext, ProvidersFromChain } from './context';

export interface ProviderConfig<T, TArgs = any> {
  factory: (args: TArgs) => T;
  lifetime?: 'executionScope';
}

export interface GlobalProviderConfig<T> {
  factory: () => T;
  lifetime: 'global';
}

/**
 * Extracts the command name from a Command type.
 * Works with both CLI instances and command config objects.
 */
export type ExtractCommandName<T> = T extends CLI<any, any, any, any, any>
  ? T extends InternalCLI<any, any, any, any, any>
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
export type ExtractCommandArgs<T> = T extends CLI<infer A, any, any, any, any>
  ? A
  : T extends CLICommandOptions<any, infer A, any, any>
  ? A
  : ParsedArgs;

/**
 * Extracts the handler return type from a Command.
 */
export type ExtractCommandHandlerReturn<T> = T extends CLI<any, infer R, any, any, any>
  ? R
  : T extends CLICommandOptions<any, any, infer R, any>
  ? R
  : void;

/**
 * Extracts the registered providers from a Command.
 * Works with both CLI instances (uses the 5th generic directly) and command
 * config objects (infers the builder's return type's provider map).
 */
export type ExtractCommandProviders<T> = T extends CLI<any, any, any, any, infer P>
  ? P
  : T extends CLICommandOptions<any, any, any, any, any, any, infer P>
  ? P
  : {};

/**
 * Converts a Command to its child CLI entry for TChildren tracking.
 * TParentCLI is the parent CLI type that will be set as the child's TParent.
 */
export type CommandToChildEntry<T, TParentCLI = undefined> = {
  [K in ExtractCommandName<T>]: CLI<
    ExtractCommandArgs<T>,
    ExtractCommandHandlerReturn<T>,
    {},
    TParentCLI,
    ExtractCommandProviders<T>
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

  TChildren = {},
  TParent = undefined,
  TProviders = {}
> {
  command<
    TCommand extends Command<TArgs, any, any, any>,
    TCommandArgs extends TArgs = ExtractCommandArgs<TCommand> extends TArgs
      ? ExtractCommandArgs<TCommand>
      : TArgs,
    TCmdName extends string = ExtractCommandName<TCommand>,
    TChildHandlerReturn = ExtractCommandHandlerReturn<TCommand>
  >(
    cmd: TCommand
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren & {
      [key in TCmdName]: CLI<
        TCommandArgs,
        TChildHandlerReturn,
        {},
        CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>,
        ExtractCommandProviders<TCommand>
      >;
    },
    TParent,
    TProviders
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

    TChildChildren = {},
    TChildProviders = {}
  >(
    key: TKey,
    options: CLICommandOptions<
      TArgs,
      TCommandArgs,
      TChildHandlerReturn,
      TChildren,
      CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>,
      TChildChildren,
      TChildProviders
    >
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren & {
      [key in TKey]: CLI<
        TCommandArgs,
        TChildHandlerReturn,
        TChildChildren,
        CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>,
        TChildProviders
      >;
    },
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
  >;
  commands<C1 extends Command, C2 extends Command>(
    c1: C1,
    c2: C2
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
  >;
  commands<C1 extends Command, C2 extends Command, C3 extends Command>(
    c1: C1,
    c2: C2,
    c3: C3
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C8, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C8, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C9, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
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
      CommandToChildEntry<C1, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C2, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C3, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C4, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C5, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C6, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C7, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C8, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C9, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>> &
      CommandToChildEntry<C10, CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>>,
    TParent,
    TProviders
  >;
  // Fallback for arrays or more than 10 commands (loses individual type tracking)
  commands(commands: Command[]): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  commands(
    ...commands: Command[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Registers a configuration provider for the CLI. See {@link ConfigurationProviders} for built-in providers.
   *
   * @param provider Provider to register.
   */
  config(
    provider: ConfigurationFiles.ConfigProviderRegistration<TArgs>
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Registers a pre-built configuration provider with framework-level
   * metadata such as `default`. Useful with convenience factories like
   * {@link ConfigurationProviders.JsonFile} that already return a
   * fully-constructed provider but still need to carry a `default` path
   * so `updateConfig` can create a config file when none exists.
   *
   * @example
   * ```ts
   * cli('my-tool')
   *   .option('theme', { type: 'string' })
   *   .config(ConfigurationProviders.JsonFile('my-tool.config.json'), {
   *     default: () => join(process.cwd(), 'my-tool.config.json'),
   *   });
   * ```
   *
   * @param provider The configuration provider to register.
   * @param options Framework-level options (e.g. `default`).
   */
  config(
    provider: ConfigurationFiles.ConfigProviderRegistration<TArgs>,
    options: { default?: ConfigurationFiles.DefaultConfig<string | URL> }
  ): CLI<TArgs, THandlerReturn, TChildren, TParent>;

  /**
   * Registers a configuration provider by class and options.
   * Framework options like `default` are extracted and stored as metadata.
   *
   * @param ctor The provider class constructor.
   * @param options Constructor options merged with framework options (e.g., `default`).
   */
  config<
    C extends new (
      opts: any
    ) => ConfigurationFiles.ConfigProviderRegistration<TArgs>,
  >(
    ctor: C,
    options: ConstructorParameters<C>[0] & {
      default?: ConfigurationFiles.DefaultConfig<
        InstanceType<C> extends readonly (infer P)[]
          ? ConfigurationFiles.ExtractLocation<P>
          : ConfigurationFiles.ExtractLocation<InstanceType<C>>
      >;
    }
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

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
  enableInteractiveShell(): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

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
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Registers a prompt provider for interactive option fulfillment.
   * Multiple providers can be registered. Filtered providers are checked first
   * (in registration order), then fallback providers (no filter).
   *
   * @param provider The prompt provider to register.
   */
  withPromptProvider(
    provider: PromptProvider
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

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
    config: ObjectOptionConfig<TCoerce, TProps> & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          unknown extends TCoerce ? ResolveProperties<TProps> : TCoerce,
          ObjectOptionConfig<TCoerce, TProps>
        >;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // String option overload
  option<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Number option overload
  option<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Boolean option overload
  option<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Array option overload
  option<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // OneOf option overload
  option<
    TOption extends string,
    const TConfig extends OneOfOptionConfig<any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Generic fallback overload
  option<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
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
    config: ObjectOptionConfig<TCoerce, TProps> & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          unknown extends TCoerce ? ResolveProperties<TProps> : TCoerce,
          ObjectOptionConfig<TCoerce, TProps>
        >;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // String option overload
  positional<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Number option overload
  positional<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Boolean option overload
  positional<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Array option overload
  positional<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;
  // Generic fallback overload
  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    Expand<TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }>>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;

  /**
   * Adds support for reading CLI options from environment variables.
   * @param prefix The prefix to use when looking up environment variables. Defaults to the command name.
   */
  env(prefix?: string): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  env(options: EnvOptionConfig): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

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
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
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
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Sets a group of options as mutually exclusive. If more than one option is provided, there will be a validation error.
   * @param options The options that should be mutually exclusive.
   */
  conflicts(
    ...options: [string, string, ...string[]]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Sets a group of options as mutually inclusive. If one option is provided, all other options must also be provided.
   * @param option The option that implies the other options.
   * @param impliedOptions The options which become required when the option is provided.
   */
  implies(
    option: string,
    ...impliedOptions: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Requires a command to be provided when executing the CLI. Useful if your parent command
   * cannot be executed on its own.
   * @returns Updated CLI instance.
   */
  demandCommand(): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Enables or disables strict mode. When strict mode is enabled, the parser throws a validation error
   * when unmatched arguments are encountered. Unmatched arguments are those that don't match any
   * configured option or positional argument.
   * @param enable Whether to enable strict mode. Defaults to true.
   * @returns Updated CLI instance.
   */
  strict(enable?: boolean): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Sets the usage text for the CLI. This text will be displayed in place of the default usage text
   * @param usageText Text displayed in place of the default usage text for `--help` and in generated docs.
   */
  usage(usageText: string): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Marks this command as hidden so it is omitted from help output, generated documentation,
   * and shell completion suggestions. Useful when composing reusable builders that need to
   * register internal or experimental commands without exposing them to end users.
   * @param hidden Whether the command should be hidden. Defaults to `true`.
   */
  hidden(hidden?: boolean): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Sets the description for the CLI. This text will be displayed in the help text and generated docs.
   * @param examples Examples to display in the help text and generated docs.
   */
  examples(
    ...examples: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Allows overriding the version displayed when passing `--version`. Defaults to crawling
   * the file system to get the package.json of the currently executing command.
   * @param override
   */
  version(override?: string): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

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
  }): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  group(
    label: string,
    keys: (keyof TArgs)[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  middleware<TArgs2>(
    callback: MiddlewareFunction<TArgs, TArgs2>
  ): CLI<
    TArgs2 extends void ? TArgs : Expand<TArgs & TArgs2>,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  >;

  /**
   * Registers a handler for this command. Fluent alternative to passing
   * `handler` in the command configuration object.
   *
   * @param fn Handler function receiving parsed args and command context.
   * @returns Updated CLI instance with the handler return type updated.
   *
   * @example
   * ```ts
   * cli('serve')
   *   .option('port', { type: 'number', default: 3000 })
   *   .handler((args) => {
   *     console.log(`Listening on port ${args.port}`);
   *   })
   *   .forge();
   * ```
   */
  handler<R>(
    fn: (
      args: TArgs,
      context: CLIHandlerContext<TChildren, TParent>
    ) => R
  ): CLI<TArgs, R, TChildren, TParent, TProviders>;

  /**
   * Registers a dependency injection provider under a unique key.
   * The value (or factory result) is accessible via `inject()` within command handlers.
   *
   * Three forms are supported:
   * - **Eager value**: `provide('key', value)` — stored as-is.
   * - **ExecutionScope factory**: `provide('key', { factory: (args) => value })` — called per invocation with parsed args.
   * - **Global factory**: `provide('key', { factory: () => value, lifetime: 'global' })` — called once and cached.
   *
   * Duplicate keys on the same command instance throw an error.
   */
  // Global factory (no args, must specify lifetime: 'global')
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    config: GlobalProviderConfig<T>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // ExecutionScope factory (receives args)
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    config: ProviderConfig<T, TArgs>,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

  // Eager value
  provide<TName extends string, T>(
    key: TName & (TName extends keyof TProviders ? never : TName),
    value: T,
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders & { [K in TName]: T }>;

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
      cli: CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>,
      args: TArgs
    ) => Promise<void> | void
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Enables shell completion for this CLI.
   * When called at the root level (no parent), also registers:
   *   - A hidden `--get-completions` flag for runtime completion
   *   - A `completion` subcommand for installing shell scripts
   *
   * At any level, stores the optional callback for custom completion suggestions.
   *
   * @param callback Optional custom completion callback for this command level.
   */
  completion(
    callback?: CompletionCallback<TArgs>
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;

  /**
   * Parses argv and executes the CLI
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge(args?: string[]): Promise<TArgs>;

  /**
   * Returns the typed children commands registered with this CLI.
   * The return type depends on the commands registered via `command()` or `commands()`.
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
   * Returns the {@link CommandContext} for the currently executing command,
   * inferred from this CLI instance.
   *
   * This is a shorthand for `getCommandContext(this)` — it avoids the
   * separate `import { getCommandContext } from 'cli-forge'` when you
   * already have a reference to the CLI. Both forms are equivalent in
   * type inference and runtime safety: the CLI instance is validated
   * against the active command chain, so passing a CLI that isn't
   * running (a sibling, an unrelated app) throws.
   *
   * Must be called from within a command handler — not during builders
   * or middleware.
   *
   * @example
   * ```ts
   * const app = cli('app')
   *   .provide('db', { factory: () => connectDb() })
   *   .command('migrate', {
   *     handler: () => {
   *       const db = app.getContext().inject('db');
   *       return db.runMigrations();
   *     },
   *   });
   * ```
   */
  // Uses `ProvidersFromChain<TProviders, TParent>` rather than
  // `ProvidersOf<CLI<TArgs, ..., TParent, TProviders>>` so this signature
  // doesn't re-wrap `CLI`'s own type parameters in a `CLI<...>` while
  // the `CLI` interface is still being constructed. The chain-walk
  // recursion then stays in conditional-type space, where TypeScript
  // evaluates it lazily at call sites — no self-reference to trip.
  getContext(): CommandContext<
    TArgs,
    ProvidersFromChain<TProviders, TParent>,
    TChildren
  >;

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
        TInitParent,
        TInitProviders
      >(
        parser: CLI<TInit, TInitHandlerReturn, TInitChildren, TInitParent, TInitProviders>
      ) => CLI<
        TInit & TArgs,
        TInitHandlerReturn,
        TInitChildren & TChildren,
        TInitParent,
        TInitProviders
      >)
    | undefined;
  getHandler():
    | ((args: Omit<TArgs, keyof ParsedArgs>) => THandlerReturn)
    | undefined;
}

export interface CLIHandlerContext<TChildren = {}, TParent = any> {
  command: CLI<any, any, TChildren, TParent, any>;
}

/**
 * Extracts the TChildren type parameter from a CLI type.
 */
export type ExtractCLIChildren<T> = T extends CLI<any, any, infer C, any, any>
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

  TInitialChildren = {},
  TParent = any,
  /**
   * The children commands after the builder runs (includes TInitialChildren plus any added by builder).
   */

  TChildren = {},
  /**
   * The providers registered inside the builder via `.provide()`. Inferred
   * from the builder's return type so that child-overrides-parent semantics
   * are visible in `getCommandContext(child).inject()`.
   */
  TChildProviders = {}
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
    parser: CLI<TInitial, any, TInitialChildren, TParent, {}>
  ) => CLI<TArgs, any, TChildren, any, TChildProviders>;

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

/** Type alias for a CLI instance with any type parameters. Use in value positions where you need to accept any CLI. */
export type AnyCLI = CLI<any, any, any, any, any>;

/**
 * Error thrown when a command handler (or middleware running as part of the
 * same execution phase) throws during `forge()`. The original error is
 * preserved on the {@link cause} property so custom error handlers can
 * inspect it, while still being able to distinguish framework-reported
 * handler failures from other errors via `instanceof HandlerExecutionError`.
 *
 * @example
 * ```ts
 * cli('app', {
 *   handler: async () => {
 *     throw new Error('bad thing');
 *   },
 * })
 *   .errorHandler((e) => {
 *     if (e instanceof HandlerExecutionError) {
 *       console.error('command:', e.command);
 *       console.error('cause:', e.cause);
 *     }
 *   })
 *   .forge();
 * ```
 */
export class HandlerExecutionError extends Error {
  override name = 'HandlerExecutionError';
  /** The command path (e.g. `"my-tool build release"`) whose handler threw. */
  readonly command: string;

  constructor(command: string, options: { cause: unknown }) {
    const causeMessage =
      options.cause instanceof Error
        ? options.cause.message
        : String(options.cause);
    super(
      `Error executing handler for "${command}": ${causeMessage}`,
      options as ErrorOptions
    );
    this.command = command;
  }
}

/**
 * Base CLI constraint for generic functions. Uses `ParsedArgs` instead of `any`
 * for `TArgs` so that method return types (like `.option()`) compute correctly
 * through `chain()`. Use this as the bound in `<T extends UnknownCLI>`.
 *
 * @example
 * ```ts
 * function withVerbose<T extends UnknownCLI>(cli: T) {
 *   return cli.option('verbose', { type: 'boolean' });
 * }
 * ```
 */
export type UnknownCLI = CLI<ParsedArgs, any, any, any, any>;

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

    infer _P,
    infer _Providers
  >
    ? SDKCommand<A, R, C>
    : never;
};

/**
 * A single SDK command - callable if it has a handler, with nested children as properties.
 * Container commands (no handler) are not callable but still provide access to children.
 */
export type SDKCommand<TArgs, THandlerReturn, TChildren> =
   
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
    TChildren,
    undefined,
    {}
  >;
}

export default cli;
