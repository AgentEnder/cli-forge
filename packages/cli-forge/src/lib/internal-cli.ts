 
import {
  ArgvParser,
  calculateSuggestedString,
  EnvOptionConfig,
  LocalizationDictionary,
  LocalizationFunction,
  OptionConfig,
  ParsedArgs,
  UnknownArgumentError,
  UnknownOptionError,
  ValidationFailedError,
  fromCamelOrDashedCaseToConstCase,
  hideBin,
  type ConfigurationFiles,
} from '@cli-forge/parser';
import { readOptionGroupsForCLI } from './cli-option-groups';
import { contextStorage, ForgeContextData } from './async-context';
import { getCommandContext } from './context';
import type { CommandContext, ProvidersFromChain } from './context';
import { formatHelp } from './format-help';
// Lazy-imported to avoid pulling Node-only modules (readline, child_process)
// into the module graph when bundled for the browser.
type InteractiveShellModule = typeof import('./interactive-shell.js');
let _shellModule: InteractiveShellModule | null = null;
async function getInteractiveShellModule(): Promise<InteractiveShellModule> {
  if (!_shellModule) {
    _shellModule = await import('./interactive-shell.js');
  }
  return _shellModule;
}
import {
  AnyCLI,
  CLI,
  CLICommandOptions,
  CLIHandlerContext,
  Command,
  ErrorHandler,
  SDKCommand,
} from './public-api';
import type {
  CompletionCallback,
  OptionCompletionCallback,
} from './completion-types';
import type { PromptProvider, PromptOptionConfig } from './prompt-types';
import { resolvePrompts } from './resolve-prompts';
import { getCallingFile, getParentPackageJson } from './utils';

/** Type alias for an InternalCLI instance with any type parameters. */
export type AnyInternalCLI = InternalCLI<any, any, any, any, any>;

type ProviderRegistration =
  | { type: 'eager'; value: unknown }
  | { type: 'factory'; factory: Function; lifetime: 'global' | 'executionScope' };

/**
 * Monotonic counter used to stamp every `InternalCLI` instance with a
 * process-unique `commandId` at construction time. Used by
 * {@link getCommandContext} to verify at runtime that a CLI instance passed
 * as a type witness actually belongs to the currently-executing command
 * chain — which catches the class of bug where the user passes the wrong
 * CLI (a sibling, an unrelated app) as the type witness and silently gets
 * incorrect `inject()` types.
 */
let _internalCliIdCounter = 0;

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
/**
 * Cross-realm brand symbol used to identify InternalCLI instances across
 * different copies of the cli-forge package (e.g. when pnpm resolves
 * multiple copies due to differing peer dependencies). `Symbol.for()`
 * returns the same symbol globally, so the brand check works even when
 * `instanceof` would fail.
 */
const CLI_FORGE_BRAND = Symbol.for('cli-forge:InternalCLI');

export class InternalCLI<
  TArgs extends ParsedArgs = ParsedArgs,
  THandlerReturn = void,

  TChildren = {},
  TParent = undefined,
  TProviders = {}
> implements CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>
{
  /**
   * Cross-realm brand for identifying InternalCLI instances across
   * different package copies. See {@link CLI_FORGE_BRAND}.
   */
  readonly [CLI_FORGE_BRAND] = true;

  /**
   * Check whether `obj` is an InternalCLI instance, even when it was
   * created by a different copy of the cli-forge package.
   */
  static isInternalCLI(
    obj: unknown
  ): obj is AnyInternalCLI {
    return (
      obj != null &&
      typeof obj === 'object' &&
      CLI_FORGE_BRAND in obj
    );
  }

  /**
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  registeredCommands: Record<string, AnyInternalCLI> = {};

  /**
   * Process-unique identifier stamped at construction time. Used to
   * validate at runtime that a CLI instance passed to `getCommandContext`
   * actually belongs to the active command chain. Never mutated once set —
   * builders, handlers, and middleware see the same value for the lifetime
   * of the instance, even across clones.
   *
   * For internal use only.
   */
  readonly commandId: string;

  /**
   * Registered DI providers keyed by name.
   * For internal use only.
   */
  registeredProviders: Map<string, ProviderRegistration> = new Map();

  /**
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  commandChain: string[] = [];

  /**
   * Reference to the parent CLI instance, if this command was registered as a subcommand.
   * For internal use only. Use `getParent()` instead.
   */
  private _parent?: AnyInternalCLI;

  private requiresCommand: 'IMPLICIT' | 'EXPLICIT' | false = 'IMPLICIT';

  private _configuration?: CLICommandOptions<any, any>;

  private _versionOverride?: string;

  private registeredErrorHandlers: Array<ErrorHandler> = [
    (e: unknown, actions) => {
      if (e instanceof ValidationFailedError) {
        this.printHelp();
        console.log();
        console.log(e.message);

        let currentCommand: InternalCLI<any, any, any, any> = this;
        for (const cmd of this.commandChain) {
          const next = currentCommand.registeredCommands[cmd];
          if (!next) break;
          currentCommand = next;
        }
        const subcommandNames = Object.keys(
          currentCommand.registeredCommands
        ).filter((name) => name !== '$0');

        for (const err of e.errors) {
          console.log(`  - ${err.message}`);
          if (err instanceof UnknownOptionError) {
            const suggestion = err.suggestedOptions[0];
            if (suggestion) {
              console.log(`    (did you mean '${suggestion}'?)`);
            }
            continue;
          }
          if (
            err instanceof UnknownArgumentError &&
            subcommandNames.length > 0 &&
            !err.input.startsWith('-')
          ) {
            const suggestion = calculateSuggestedString(
              err.input,
              subcommandNames
            );
            if (suggestion) {
              console.log(`    (did you mean '${suggestion}'?)`);
            }
          }
        }
        actions.exit(1);
      }
    },
  ];

  private registeredMiddleware = new Set<
    (args: TArgs) => void | unknown | Promise<void> | Promise<unknown>
  >();

  private registeredInitHooks: Array<
    (cli: any, args: TArgs) => Promise<void> | void
  > = [];

  registeredPromptProviders: PromptProvider[] = [];

  /**
   * Stores prompt config for each option, keyed by option name.
   * Set when .option() is called with a `prompt` property.
   */
  promptConfigs: Map<string, PromptOptionConfig<any>> = new Map();

  /**
   * Custom completion callback for this command level.
   * Set when .completion() is called with a callback argument.
   */
  completionCallback?: CompletionCallback<any>;

  /**
   * Per-option completion callbacks, keyed by option name.
   * Set when .option() is called with a `completion` property.
   */
  completionConfigs: Map<string, OptionCompletionCallback<any>> = new Map();

  /**
   * Whether .completion() has been called on this CLI instance.
   */
  private _completionEnabled = false;

  /**
   * Set when a `$0` alias replaces the root builder via `.command()`.
   * The $0 builder should only run if no explicit subcommand is given,
   * so `forge()` defers it until the discovery loop confirms no match.
   */
  private builderIsFrom$0Alias = false;

  /**
   * A list of option groups that have been registered with the CLI. Grouped Options are displayed together in the help text.
   *
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  registeredOptionGroups: Array<{
    label: string;
    sortOrder: number;
    keys: Array<keyof TArgs>;
  }> = [];

  getGroupedOptions() {
    return readOptionGroupsForCLI(this);
  }

  get configuration() {
    return this._configuration;
  }

  private set configuration(value: CLICommandOptions<any, any> | undefined) {
    this._configuration = value;
  }

  /**
   * The parser used to parse the arguments for the current command.
   *
   * Meant for internal use only. Stick to properties available on {@link CLI}.
   *
   * If you need this kind of info, please open an issue on the GitHub repo with
   * your use case.
   */
  parser = new ArgvParser<TArgs>({
    unmatchedParser: (arg) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCommand: AnyInternalCLI = this;
      for (const command of this.commandChain) {
        currentCommand = currentCommand.registeredCommands[command];
      }
      const command = currentCommand.registeredCommands[arg];
      if (command && command.configuration) {
        command.parser = this.parser;
        command.configuration.builder?.(command as any);
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
    rootCommandConfiguration?: CLICommandOptions<
      TArgs,
      any,
      THandlerReturn,
      TChildren
    >
  ) {
    // Stamp a stable, immutable identifier so `getCommandContext(cli)` can
    // verify at runtime that this instance is part of the active command
    // chain. The format is `${name}#${counter}` for debuggability — the
    // counter guarantees uniqueness even when two commands share a name.
    this.commandId = `${name}#${++_internalCliIdCounter}`;
    if (rootCommandConfiguration) {
      this.withRootCommandConfiguration(rootCommandConfiguration as any);
    } else {
      this.requiresCommand = 'IMPLICIT';
    }
  }

  withRootCommandConfiguration<TRootCommandArgs extends TArgs>(
    configuration: CLICommandOptions<TArgs, TRootCommandArgs>
  ): InternalCLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.configuration = configuration;
    this.requiresCommand = configuration.handler ? false : 'IMPLICIT';
    return this;
  }

  command<
    TCommand extends Command<TArgs, any, any, any>
  >(
    cmd: TCommand
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren & import('./public-api').CommandToChildEntry<
      TCommand,
      CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>
    >,
    TParent,
    TProviders
  >;
  command<
    TCommandArgs extends TArgs,
    TChildHandlerReturn = void,
    TCommandName extends string = string,
    TChildChildren = {},
    TChildProviders = {}
  >(
    key: TCommandName,
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
      [key in TCommandName]: CLI<
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
  command(
    keyOrCommand: string | Command<any, any, any, any>,
    options?: CLICommandOptions<any, any, any, any, any, any, any>
  ): any {
    if (typeof keyOrCommand === 'string') {
      const key = keyOrCommand;
      if (!options) {
        throw new Error(
          'options must be provided when calling `command` with a string'
        );
      }
      if (key === '$0' || options.alias?.includes('$0')) {
        this.withRootCommandConfiguration({
          ...this._configuration,
          builder: options.builder as any,
          handler: options.handler as any,
          description: options.description,
        });
        // Only defer the builder when it came from an alias (e.g.,
        // command('search', { alias: ['$0'] })). When key === '$0',
        // the command IS the root and its builder should run normally.
        if (key !== '$0' && options.alias?.includes('$0')) {
          this.builderIsFrom$0Alias = true;
        }
      }
      const cmd = new InternalCLI<TArgs, TChildHandlerReturn>(
        key
      ).withRootCommandConfiguration(options as any);
      cmd._parent = this;

      // Get localized command name
      const localizedKey = this.getLocalizedCommandName(key);

      // Register under the default key
      this.registeredCommands[key] = cmd;

      // If localized name is different, also register under localized name as an alias
      if (localizedKey !== key) {
        this.registeredCommands[localizedKey] = cmd;
      }

      if (options.alias) {
        for (const alias of options.alias) {
          this.registeredCommands[alias] = cmd;
        }
      }
    } else if (InternalCLI.isInternalCLI(keyOrCommand)) {
      const cmd = keyOrCommand as AnyInternalCLI;
      if (cmd.name === '$0') {
        this.withRootCommandConfiguration(cmd.configuration as any);
        // Copy any commands registered on the $0 instance (e.g. subcommands
        // added via `.commands()` after the $0 CLI was created).
        for (const [key, subcmd] of Object.entries(cmd.registeredCommands)) {
          subcmd._parent = this;
          this.registeredCommands[key] = subcmd;
        }
        return this as any;
      }
      cmd._parent = this;
      this.registeredCommands[cmd.name] = cmd;
      if (cmd.configuration?.alias) {
        for (const alias of cmd.configuration.alias) {
          this.registeredCommands[alias] = cmd;
        }
      }
    } else {
      const { name, ...configuration } = keyOrCommand as {
        name: string;
      } & CLICommandOptions<TArgs, TCommandArgs>;
      this.command<TCommandArgs>(name, configuration);
    }
    return this as any;
  }

  commands(...a0: Command[] | Command[][]): any {
    const commands = a0.flat();
    for (const val of commands) {
      this.command(val);
    }
    return this;
  }

  option<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig & {
      prompt?: PromptOptionConfig<TArgs>;
      completion?: OptionCompletionCallback<TArgs>;
    }
  ) {
    const { prompt, completion: completionCb, ...parserConfig } = config;
    if (prompt !== undefined) {
      this.promptConfigs.set(name, prompt);
    }
    if (completionCb !== undefined) {
      this.completionConfigs.set(name, completionCb);
    }
    this.parser.option(name, parserConfig as TOptionConfig);
    // Interface modifies the return type to reflect new params, cast is necessay.... I think 🤔
    return this as any;
  }

  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig & {
      prompt?: PromptOptionConfig<TArgs>;
      completion?: OptionCompletionCallback<TArgs>;
    }
  ) {
    const { prompt, completion: completionCb, ...parserConfig } = config;
    if (prompt !== undefined) {
      this.promptConfigs.set(name, prompt);
    }
    if (completionCb !== undefined) {
      this.completionConfigs.set(name, completionCb);
    }
    this.parser.positional(name, parserConfig as TOptionConfig);
    // Interface modifies the return type to reflect new params, cast is necessay.... I think 🤔
    return this as any;
  }

  conflicts(
    ...args: [string, string, ...string[]]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.parser.conflicts(...args);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  implies(
    option: string,
    ...impliedOptions: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.parser.implies(option, ...impliedOptions);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  env(
    a0: string | EnvOptionConfig | undefined = fromCamelOrDashedCaseToConstCase(
      this.name
    )
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    if (typeof a0 === 'string') {
      this.parser.env(a0);
    } else {
      a0.prefix ??= fromCamelOrDashedCaseToConstCase(this.name);
      this.parser.env(a0);
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  localize(
    dictionaryOrFn: LocalizationDictionary | LocalizationFunction,
    locale?: string
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    if (typeof dictionaryOrFn === 'function') {
      this.parser.localize(dictionaryOrFn);
    } else {
      this.parser.localize(dictionaryOrFn, locale);
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  /**
   * Gets the localized display name for a command key.
   * @param key The command key
   * @returns The localized command name, or the original key if not localized
   */
  getLocalizedCommandName(key: string): string {
    return this.parser.getDisplayKey(key);
  }

  demandCommand(): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.requiresCommand = 'EXPLICIT';
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  strict(enable = true): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.parser.options.strict = enable;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  usage(usageText: string): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.configuration ??= {};
    this.configuration.usage = usageText;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  hidden(hidden = true): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.configuration ??= {};
    this.configuration.hidden = hidden;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  examples(
    ...examples: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.configuration ??= {};
    this.configuration.examples ??= [];
    this.configuration.examples.push(...examples);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  version(version?: string): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this._versionOverride = version;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  /**
   * Gets help text for the current command as a string.
   * @returns Help text for the current command.
   */
  formatHelp() {
    return formatHelp(this);
  }

  /**
   * Prints help text for the current command to the console.
   */
  printHelp() {
    console.log(this.formatHelp());
  }

  middleware<TArgs2>(
    callback: (args: TArgs) => TArgs2 | Promise<TArgs2> | void | Promise<void>
  ): CLI<
    TArgs2 extends void ? TArgs : TArgs & TArgs2,
    THandlerReturn,
    TChildren,
    TParent,
    TProviders
  > {
    this.registeredMiddleware.add(callback);
    // If middleware returns void, TArgs doesn't change...
    // If it returns something, we need to merge it into TArgs...
    // that's not here though, its where we apply the middleware results.
    return this as any;
  }

  handler<R>(
    fn: (args: TArgs, context: any) => R
  ): CLI<TArgs, R, TChildren, TParent, TProviders> {
    if (!this._configuration) {
      this._configuration = {};
    }
    this._configuration.handler = fn as any;
    this.requiresCommand = false;
    return this as any;
  }

  provide(key: string, valueOrConfig: unknown): any {
    if (this.registeredProviders.has(key)) {
      throw new Error(`Provider '${key}' is already registered on this command.`);
    }
    if (
      valueOrConfig !== null &&
      typeof valueOrConfig === 'object' &&
      'factory' in valueOrConfig &&
      typeof (valueOrConfig as any).factory === 'function'
    ) {
      const config = valueOrConfig as { factory: Function; lifetime?: string };
      this.registeredProviders.set(key, {
        type: 'factory',
        factory: config.factory,
        lifetime: (config.lifetime as 'global' | 'executionScope') ?? 'executionScope',
      });
    } else {
      this.registeredProviders.set(key, { type: 'eager', value: valueOrConfig });
    }
    return this;
  }

  init(
    callback: (
      cli: CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>,
      args: TArgs
    ) => Promise<void> | void
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.registeredInitHooks.push(callback);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  completion(
    callback?: CompletionCallback<any>
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this._completionEnabled = true;
    if (callback) {
      this.completionCallback = callback;
    }

    // Only register completion infrastructure at root level (no parent)
    if (!this._parent) {
      this.parser.option('getCompletions', {
        type: 'boolean',
        hidden: true,
        description: 'Output shell completion suggestions',
      } as any);

      this.command('completion', {
        description: 'Install shell completion scripts',
        handler: async () => {
          const { installCompletionScripts } = await import(
            './completion-scripts.js'
          );
          await installCompletionScripts(this.name);
        },
      });
    }

    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  /**
   * Runs the current command.
   * @param cmd The command to run.
   * @param args The arguments to pass to the command.
   */
  async runCommand<T extends ParsedArgs>(
    args: T,
    originalArgV: string[],
    executedMiddleware?: Set<(args: any) => void>
  ): Promise<T> {
    const middlewares = new Set<(args: any) => void>(this.registeredMiddleware);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cmd: AnyInternalCLI = this;
    for (const command of this.commandChain) {
      cmd = cmd.registeredCommands[command];
      for (const mw of cmd.registeredMiddleware) {
        middlewares.add(mw);
      }
    }
    try {
      if (cmd.requiresCommand) {
        throw new Error(
          `${[this.name, ...this.commandChain].join(' ')} requires a command`
        );
      }
      if (cmd.configuration?.handler) {
        for (const middleware of middlewares) {
          if (executedMiddleware?.has(middleware)) continue;
          const middlewareResult = await middleware(args as any);
          if (
            middlewareResult !== void 0 &&
            typeof middlewareResult === 'object'
          ) {
            args = middlewareResult as T;
          }
        }
        // Keep ALS context args in sync after middleware transformations
        const store = contextStorage.getStore();
        if (store) {
          store.args = args as Record<string, unknown>;
        }
        await cmd.configuration.handler(args, {
          command: cmd as any,
        });
        return args;
      } else {
        // We can treat a command as a subshell if it has subcommands
        if (Object.keys(cmd.registeredCommands).length > 0) {
          if (typeof process === 'undefined' || !process.stdout?.isTTY) {
            // If we're not in a TTY (or in a browser), we can't run an interactive shell...
            // Maybe we should warn here?
          } else if (args.unmatched.length > 0) {
            // If there are unmatched args, we don't run an interactive shell...
            // this could represent a user misspelling a subcommand so it gets rather confusing.
            console.warn(
              `Warning: Unrecognized command or arguments: ${args.unmatched.join(
                ' '
              )}`
            );
            cmd.printHelp();
          } else {
            const shellMod = await getInteractiveShellModule();
            if (!shellMod.INTERACTIVE_SHELL) {
              const tui = new shellMod.InteractiveShell(
                this as unknown as AnyInternalCLI,
                {
                  prependArgs: originalArgV,
                }
              );
              await new Promise<void>((res) => {
                ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((s) =>
                  process?.on(s, () => {
                    tui.close();
                    res();
                  })
                );
              });
            }
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
      if (typeof process !== 'undefined') process.exitCode = 1;
      console.error(e);
      this.printHelp();
    }
    return args;
  }

  getChildren(): TChildren {
    // Return a copy of registered commands, excluding aliases (same command registered under different keys)
    const children: Record<string, AnyInternalCLI> = {};
    const seen = new Set<AnyInternalCLI>();
    for (const [key, cmd] of Object.entries(this.registeredCommands)) {
      if (!seen.has(cmd)) {
        seen.add(cmd);
        children[key] = cmd;
      }
    }
    return children as TChildren;
  }

  getParent(): TParent {
    return this._parent as TParent;
  }

  getContext(): CommandContext<
    TArgs,
    ProvidersFromChain<TProviders, TParent>,
    TChildren
  > {
    // Delegate to getCommandContext(this) so the runtime chain validation
    // and error messaging stay in a single place.
    return getCommandContext(
      this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>
    ) as CommandContext<
      TArgs,
      ProvidersFromChain<TProviders, TParent>,
      TChildren
    >;
  }

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
    | undefined {
    const builder = this.configuration?.builder;
    if (!builder) return undefined;
    // Return a composable builder that preserves input types
    return ((parser: AnyCLI) => builder(parser)) as any;
  }

  getHandler():
    | ((args: Omit<TArgs, keyof ParsedArgs>) => THandlerReturn)
    | undefined {
    const context: CLIHandlerContext<TChildren, TParent> = {
      command: this as unknown as CLI<any, any, TChildren, TParent, any>,
    };
    const handler = this._configuration?.handler;
    if (!handler) {
      return undefined;
    }
    return (args: Omit<TArgs, keyof ParsedArgs>) =>
      handler(
        args as TArgs,
        context as CLIHandlerContext<any, any>
      ) as THandlerReturn;
  }

  sdk(): SDKCommand<TArgs, THandlerReturn, TChildren> {
    return this.buildSDKProxy(this) as SDKCommand<
      TArgs,
      THandlerReturn,
      TChildren
    >;
  }

  private buildSDKProxy(targetCmd: AnyInternalCLI): unknown {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const invoke = async (
      argsOrArgv?: Record<string, unknown> | string[]
    ): Promise<THandlerReturn & { $args?: TArgs }> => {
      // Clone the target command to avoid mutating the original
      const cmd = targetCmd.clone();

      const handler = cmd._configuration?.handler;
      if (!handler) {
        throw new Error(`Command '${cmd.name}' has no handler`);
      }

      let parsedArgs: any;

      if (Array.isArray(argsOrArgv)) {
        // String array: full pipeline (parse → validate → middleware)
        // Run the builder first if present
        if (cmd._configuration?.builder) {
          cmd._configuration.builder(cmd as any);
        }
        parsedArgs = cmd.parser.parse(argsOrArgv);
      } else {
        // Object args: skip validation, apply defaults, run middleware
        // Run the builder first to register options and get defaults
        if (cmd._configuration?.builder) {
          cmd._configuration.builder(cmd as any);
        }
        // Build defaults from configured options
        const defaults: Record<string, unknown> = {};
        for (const [key, config] of Object.entries(
          cmd.parser.configuredOptions
        )) {
          if (config.default !== undefined) {
            defaults[key] = config.default;
          }
        }
        parsedArgs = {
          ...defaults,
          ...argsOrArgv,
          unmatched: [],
        };
      }

      // Collect and run middleware from the command chain
      const middlewares = self.collectMiddlewareChain(targetCmd);
      for (const mw of middlewares) {
        const middlewareResult = await mw(parsedArgs);
        if (
          middlewareResult !== void 0 &&
          typeof middlewareResult === 'object'
        ) {
          parsedArgs = middlewareResult;
        }
      }

      // Build context data for ALS — collect providers from root down to cmd.
      // Use targetCmd (not the clone) because clone() does not copy _parent.
      const providerChain: AnyInternalCLI[] = [];
      let providerWalk: AnyInternalCLI | undefined = targetCmd;
      while (providerWalk) {
        providerChain.unshift(providerWalk);
        providerWalk = providerWalk._parent;
      }
      const sdkContextData: ForgeContextData = {
        args: parsedArgs as Record<string, unknown>,
        commandChain: [],
        // providerChain walks root -> ...ancestors -> targetCmd already,
        // so we reuse it for the id chain that getCommandContext validates.
        commandIdChain: providerChain.map((c) => c.commandId),
        providers: new Map(),
        providerFactories: new Map(),
        handlerPhase: true,
        resolving: new Set(),
      };
      for (const providerNode of providerChain) {
        for (const [key, reg] of providerNode.registeredProviders) {
          if (reg.type === 'eager') {
            sdkContextData.providers.set(key, reg.value);
          } else {
            sdkContextData.providerFactories.set(key, {
              factory: reg.factory,
              lifetime: reg.lifetime,
            });
          }
        }
      }

      // Execute handler inside ALS context
      const context: CLIHandlerContext<any, any> = {
        command: cmd as unknown as AnyCLI,
      };
      const result = await contextStorage.run(sdkContextData, async () => {
        return handler(parsedArgs, context);
      });

      // Try to attach $args to the result (fails silently for primitives)
      if (result !== null && typeof result === 'object') {
        try {
          (result as any).$args = parsedArgs;
        } catch {
          // Cannot attach to frozen objects or primitives, return as-is
        }
      }

      return result as any as THandlerReturn & { $args?: TArgs };
    };

    // Ensure builder has run to register all subcommands
    if (targetCmd._configuration?.builder) {
      targetCmd._configuration.builder(targetCmd as any);
    }

    // Create proxy that is both callable and has child properties
    return new Proxy(invoke, {
      get(_, prop: string) {
        // Handle special properties
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          // Don't intercept Promise methods - this prevents issues with await
          return undefined;
        }

        const child = targetCmd.registeredCommands[prop];
        if (child) {
          return self.buildSDKProxy(child);
        }
        return undefined;
      },
    });
  }

  private collectMiddlewareChain(
    cmd: AnyInternalCLI
  ): Array<(args: any) => unknown | Promise<unknown>> {
    const chain: AnyInternalCLI[] = [];
    let current: AnyInternalCLI | undefined = cmd;
    while (current) {
      chain.unshift(current);
      current = current._parent;
    }
    const seen = new Set<(args: any) => unknown | Promise<unknown>>();
    for (const c of chain) {
      for (const mw of c.registeredMiddleware) {
        seen.add(mw);
      }
    }
    return [...seen];
  }

  enableInteractiveShell(): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    if (this.requiresCommand === 'EXPLICIT') {
      throw new Error(
        'Interactive shell is not supported for commands that require a command.'
      );
    } else if (typeof process !== 'undefined' && process.stdout?.isTTY) {
      this.requiresCommand = false;
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  private versionHandler() {
    if (this._versionOverride) {
      console.log(this._versionOverride);
      return;
    }
    let mainFile = typeof require !== 'undefined' ? require?.main?.filename : undefined;
    mainFile ??= getCallingFile();
    if (!mainFile) {
      console.log('unknown');
      return;
    }
    try {
      const packageJson = getParentPackageJson(mainFile);
      console.log(packageJson.version ?? 'unknown');
    } catch {
      console.log('unknown');
    }
  }

  private async withErrorHandlers<T>(cb: () => T): Promise<Awaited<T>> {
    try {
      return await cb();
    } catch (e) {
      for (const handler of this.registeredErrorHandlers) {
        try {
          handler(e, {
            exit: (c) => {
              if (typeof process !== 'undefined') process.exit(c);
            },
          });
          // Error was handled, no need to continue
          break;
        } catch {
          // Error was not handled, continue to the next handler
        }
      }
      throw e;
    }
  }

  errorHandler(
    handler: ErrorHandler
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    this.registeredErrorHandlers.unshift(handler);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  withPromptProvider(
    provider: PromptProvider
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    if (!provider.prompt && !provider.promptBatch) {
      throw new Error(
        "Prompt provider must implement at least one of 'prompt' or 'promptBatch'"
      );
    }
    this.registeredPromptProviders.push(provider);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  group(
    labelOrConfigObject:
      | string
      | { label: string; keys: (keyof TArgs)[]; sortOrder?: number },
    keys?: (keyof TArgs)[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    const config =
      typeof labelOrConfigObject === 'object'
        ? labelOrConfigObject
        : {
            label: labelOrConfigObject,
            keys: keys as (keyof TArgs)[],
          };

    if (!config.keys) {
      throw new Error('keys must be provided when calling `group`.');
    }

    this.registeredOptionGroups.push({
      ...config,
      sortOrder:
        config.sortOrder ?? Object.keys(this.registeredOptionGroups).length,
    });
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }

  config(
    provider: ConfigurationFiles.AnyConfigProvider<TArgs>
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  config<
    C extends new (
      opts: any
    ) => ConfigurationFiles.ConfigurationProvider<TArgs, any>,
  >(
    ctor: C,
    options: ConstructorParameters<C>[0] & {
      default?: ConfigurationFiles.DefaultConfig<
        ConfigurationFiles.ExtractLocation<InstanceType<C>>
      >;
    }
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  config<
    C extends new (
      opts: any
    ) => ConfigurationFiles.ConfigurationProvider<TArgs, any>,
  >(
    providerOrCtor: ConfigurationFiles.AnyConfigProvider<TArgs> | C,
    options?: ConstructorParameters<C>[0] & {
      default?: ConfigurationFiles.DefaultConfig<
        ConfigurationFiles.ExtractLocation<InstanceType<C>>
      >;
    }
  ): CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders> {
    if (options !== undefined) {
      this.parser.config(providerOrCtor as any, options);
    } else {
      this.parser.config(
        providerOrCtor as ConfigurationFiles.AnyConfigProvider<any>
      );
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>;
  }
  }

  async updateConfig(values: Partial<TArgs>): Promise<void>;
  async updateConfig(
    updater: ConfigurationFiles.ConfigUpdater<TArgs>
  ): Promise<void>;
  async updateConfig(
    valuesOrUpdater:
      | Partial<TArgs>
      | ConfigurationFiles.ConfigUpdater<TArgs>
  ): Promise<void> {
    return this.parser.updateConfig(valuesOrUpdater as any);
  }

  /**
   * Parses argv and executes the CLI.
   *
   * Execution proceeds in two phases:
   *
   * **Discovery loop** (per command level): builder → parse (non-strict,
   * no validation) → merge → middleware → init hooks → find next
   * subcommand in unmatched tokens → repeat.
   *
   * **Final parse + execution**: parse (with validation, seeded with
   * accumulated args) → help/version check → handler. Middleware that
   * already ran during discovery is skipped.
   *
   * @param args argv. Defaults to process.argv.slice(2)
   * @returns Promise that resolves when the handler completes.
   */
  forge = (args: string[] = typeof process !== 'undefined' ? hideBin(process.argv) : []) =>
    this.withErrorHandlers(async () => {
      let argv: TArgs & { help?: boolean; version?: boolean };
      let validationFailedError: ValidationFailedError<TArgs> | undefined;

      // Run root builder (may register options, init hooks, commands).
      // If the builder came from a $0 alias, skip it here — we defer
      // running it until the discovery loop confirms no explicit
      // subcommand was given, so it doesn't double-run when the
      // command is invoked by name.
      if (!this.builderIsFrom$0Alias) {
        this.configuration?.builder?.(this as any);
      }

      // Merge helper: accumulate defined values without overwriting
      const mergeNew = (target: any, source: any) => {
        for (const [key, value] of Object.entries(source)) {
          if (
            key !== 'unmatched' &&
            value !== undefined &&
            target[key] === undefined
          ) {
            target[key] = value;
          }
        }
      };

      // Check if this is a completion request — enable lenient parsing
      // so incomplete argv (e.g. `--env ""`) doesn't throw.
      const isCompletionRequest =
        this._completionEnabled &&
        args.some(
          (a) => a === '--get-completions' || a === '--getCompletions'
        );

      // Iterative command discovery with init hooks.
      // Each level: non-strict parse filtered args → run middleware
      // → run init hooks → find next command in unmatched tokens
      // → filter down. Builders stay lazy.
      let currentArgs = [...args];
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCmd: AnyInternalCLI = this;
      const mergedArgs: any = {};
      const executedMiddleware = new Set<(args: any) => void>();

       
      while (true) {
        // Non-strict parse to get current arg values for init hooks.
        // Seeded with mergedArgs so required options parsed at earlier
        // levels satisfy validation.
        // The unmatchedParser intercepts subcommand tokens before
        // positional matching can greedily consume them.
        let discoveredCommand: string | null = null;
        const parsed = this.parser
          .clone({
            ...this.parser.options,
            unmatchedParser: (arg) => {
              if (!discoveredCommand && !arg.startsWith('-')) {
                const cmd = currentCmd.registeredCommands[arg];
                if (cmd && cmd.configuration) {
                  discoveredCommand = arg;
                  return true;
                }
              }
              return false;
            },
            strict: false,
            validate: false,
            lenient: isCompletionRequest,
          })
          .parse(currentArgs, mergedArgs) as any;

        mergeNew(mergedArgs, parsed);

        // Run middleware for this command level before init hooks,
        // so init hooks can see middleware-transformed args.
        for (const mw of currentCmd.registeredMiddleware) {
          if (!executedMiddleware.has(mw)) {
            executedMiddleware.add(mw);
            const result = await mw(mergedArgs);
            if (result !== void 0 && typeof result === 'object') {
              Object.assign(mergedArgs, result);
            }
          }
        }

        // Run init hooks with the full accumulated args
        for (const hook of currentCmd.registeredInitHooks) {
          await hook(currentCmd as any, mergedArgs);
        }

        // Build the next command if one was discovered during parsing
        // (i.e., subcommand token intercepted before positional matching)
        let nextCmd: AnyInternalCLI | null = null;
        if (discoveredCommand) {
          const cmd = currentCmd.registeredCommands[discoveredCommand];
          cmd.parser = this.parser;
          cmd.configuration?.builder?.(cmd as any);
          this.commandChain.push(discoveredCommand);
          nextCmd = cmd;
          // An explicit subcommand was found — the $0 default path
          // won't be taken, so clear the deferred builder flag.
          this.builderIsFrom$0Alias = false;
        }

        // Scan unmatched tokens for commands that may have been registered
        // dynamically by init hooks (these weren't in registeredCommands
        // during parse, so the unmatchedParser couldn't intercept them).
        const unmatched: string[] = parsed.unmatched ?? [];
        const remainingArgs: string[] = [];

        if (!nextCmd) {
          for (const token of unmatched) {
            if (!nextCmd && !token.startsWith('-')) {
              const cmd = currentCmd.registeredCommands[token];
              if (cmd && cmd.configuration) {
                cmd.parser = this.parser;
                cmd.configuration.builder?.(cmd as any);
                this.commandChain.push(token);
                nextCmd = cmd;
                this.builderIsFrom$0Alias = false;
                continue;
              }
            }
            remainingArgs.push(token);
          }
        }

        if (!nextCmd) {
          // No explicit subcommand was found. If a $0 alias replaced
          // the root builder, run it now so its options (e.g. positionals)
          // get registered before the final parse.
          if (this.builderIsFrom$0Alias) {
            this.builderIsFrom$0Alias = false; // only run once
            this.configuration?.builder?.(this as any);
            // Re-run the loop iteration so the newly registered options
            // participate in parsing.
            currentArgs = unmatched;
            continue;
          }
          currentArgs = unmatched;
          break;
        }
        // If command found during parse, all unmatched are remaining args.
        // If command found in post-init scan, use filtered remaining args.
        currentArgs = discoveredCommand ? unmatched : remainingArgs;
        currentCmd = nextCmd;
      }

      // All builders and init hooks have run. The parser now has
      // all options registered.

      // If this is a completion request, resolve completions now
      // (after discovery so subcommand builders have run) but before
      // the strict final parse.
      if (isCompletionRequest) {
        const completionArgv = args.filter(
          (a) => a !== '--get-completions' && a !== '--getCompletions'
        );
        const { resolveCompletions } = await import(
          './resolve-completions.js'
        );
        const completions = await resolveCompletions({
          rootCLI: this,
          argv: completionArgv,
        });
        for (const c of completions) {
          console.log(c);
        }
        return mergedArgs as TArgs;
      }

      // Parse the remaining unmatched tokens
      // seeded with the accumulated values from the discovery loop.
      // The alreadyParsed values ensure proper required-option
      // validation and prevent positional re-consumption.

      // Prompt for missing option values before final validation.
      // Collect prompt providers from the full command chain.
      const allPromptProviders: PromptProvider[] = [
        ...this.registeredPromptProviders,
      ];
      const allPromptConfigs = new Map(this.promptConfigs);
      {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let walkCmd: AnyInternalCLI = this;
        for (const command of this.commandChain) {
          walkCmd = walkCmd.registeredCommands[command];
          for (const p of walkCmd.registeredPromptProviders) {
            allPromptProviders.push(p);
          }
          for (const [k, v] of walkCmd.promptConfigs) {
            allPromptConfigs.set(k, v);
          }
        }
      }

      if (allPromptProviders.length > 0 || allPromptConfigs.size > 0) {
        const promptedValues = await resolvePrompts({
          configuredOptions: this.parser.configuredOptions as Record<
            string,
            any
          >,
          configuredImplies: this.parser.configuredImplies,
          promptConfigs: allPromptConfigs,
          providers: allPromptProviders,
          currentArgs: mergedArgs,
        });

        // Inject prompted values into accumulated args
        for (const [key, value] of Object.entries(promptedValues)) {
          if (value !== undefined) {
            mergedArgs[key] = value;
          }
        }
      }

      try {
        argv = this.parser
          .clone({
            ...this.parser.options,
            unmatchedParser: () => false,
          })
          .parse(currentArgs, mergedArgs) as any;
      } catch (e) {
        if (e instanceof ValidationFailedError) {
          argv = e.partialArgV as any;
          validationFailedError = e;
        } else {
          throw e;
        }
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

      // Collect all providers from the command chain (root → subcommands)
      const allProviders = this.collectProviders();
      const contextData: ForgeContextData = {
        args: argv as Record<string, unknown>,
        commandChain: [...this.commandChain],
        commandIdChain: this.collectCommandIdChain(),
        providers: new Map(),
        providerFactories: new Map(),
        handlerPhase: false,
        resolving: new Set(),
      };

      // Register providers into context
      for (const [key, reg] of allProviders) {
        if (reg.type === 'eager') {
          contextData.providers.set(key, reg.value);
        } else {
          contextData.providerFactories.set(key, {
            factory: reg.factory,
            lifetime: reg.lifetime,
          });
        }
      }

      const finalArgV = await contextStorage.run(contextData, async () => {
        contextData.handlerPhase = true;
        return this.runCommand(argv, args, executedMiddleware);
      });
      return finalArgV as TArgs;
    });

  getParser() {
    return this.parser.asReadonly();
  }

  getSubcommands() {
    return this.registeredCommands as Readonly<Record<string, AnyInternalCLI>>;
  }

  private collectProviders(): Map<string, ProviderRegistration> {
    const result = new Map<string, ProviderRegistration>();
    // Start from root (this) and walk down the command chain
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cmd: AnyInternalCLI = this;
    for (const [key, reg] of cmd.registeredProviders) {
      result.set(key, reg);
    }
    for (const name of this.commandChain) {
      cmd = cmd.registeredCommands[name];
      if (cmd) {
        for (const [key, reg] of cmd.registeredProviders) {
          result.set(key, reg); // child overrides parent
        }
      }
    }
    return result;
  }

  /**
   * Walks the command chain from root (this) down to the running command
   * and collects each instance's `commandId`. Populates
   * `ForgeContextData.commandIdChain` so `getCommandContext(cli)` can
   * validate at runtime that the CLI passed as a type witness is any
   * command on the active chain.
   */
  private collectCommandIdChain(): string[] {
    const ids: string[] = [this.commandId];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cmd: AnyInternalCLI = this;
    for (const name of this.commandChain) {
      const next = cmd.registeredCommands[name];
      if (!next) break;
      cmd = next;
      ids.push(cmd.commandId);
    }
    return ids;
  }

  clone() {
    const clone = new InternalCLI<TArgs, THandlerReturn, TChildren, TParent, TProviders>(
      this.name
    );
    // Propagate the commandId so the clone still validates against any
    // original CLI reference the user passes to `getCommandContext()`.
    // A clone conceptually represents the same command — just a private
    // mutable copy — so it keeps the original's identity.
    (clone as { commandId: string }).commandId = this.commandId;
    clone.parser = this.parser.clone(clone.parser.options) as any;
    if (this.configuration) {
      clone.withRootCommandConfiguration(this.configuration);
    }
    clone.registeredCommands = {};
    for (const command in this.registeredCommands ?? {}) {
      clone.command(this.registeredCommands[command].clone() as any);
    }
    clone.registeredProviders = new Map(this.registeredProviders);
    clone.commandChain = [...this.commandChain];
    clone.requiresCommand = this.requiresCommand;
    clone.registeredPromptProviders = [...this.registeredPromptProviders];
    clone.promptConfigs = new Map(this.promptConfigs);
    clone.completionCallback = this.completionCallback;
    clone.completionConfigs = new Map(this.completionConfigs);
    clone._completionEnabled = this._completionEnabled;
    return clone;
  }
}
