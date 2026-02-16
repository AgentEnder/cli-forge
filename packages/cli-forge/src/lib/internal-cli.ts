/* eslint-disable @typescript-eslint/ban-types */
import {
  ArgvParser,
  EnvOptionConfig,
  LocalizationDictionary,
  LocalizationFunction,
  OptionConfig,
  ParsedArgs,
  ValidationFailedError,
  fromCamelOrDashedCaseToConstCase,
  hideBin,
  type ConfigurationFiles,
} from '@cli-forge/parser';
import { readOptionGroupsForCLI } from './cli-option-groups';
import { formatHelp } from './format-help';
import { INTERACTIVE_SHELL, InteractiveShell } from './interactive-shell';
import {
  CLI,
  CLICommandOptions,
  CLIHandlerContext,
  Command,
  ErrorHandler,
  SDKCommand,
} from './public-api';
import { getCallingFile, getParentPackageJson } from './utils';

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
export class InternalCLI<
  TArgs extends ParsedArgs = ParsedArgs,
  THandlerReturn = void,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TChildren = {},
  TParent = undefined
> implements CLI<TArgs, THandlerReturn, TChildren, TParent>
{
  /**
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  registeredCommands: Record<string, InternalCLI<any, any, any, any>> = {};

  /**
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  commandChain: string[] = [];

  /**
   * Reference to the parent CLI instance, if this command was registered as a subcommand.
   * For internal use only. Use `getParent()` instead.
   */
  private _parent?: InternalCLI<any, any, any, any>;

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

  private registeredMiddleware = new Set<
    (args: TArgs) => void | unknown | Promise<void> | Promise<unknown>
  >();

  private registeredInitHooks: Array<
    (cli: any, args: TArgs) => Promise<void> | void
  > = [];

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
      let currentCommand: InternalCLI<any, any, any, any> = this;
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
    if (rootCommandConfiguration) {
      this.withRootCommandConfiguration(rootCommandConfiguration as any);
    } else {
      this.requiresCommand = 'IMPLICIT';
    }
  }

  withRootCommandConfiguration<TRootCommandArgs extends TArgs>(
    configuration: CLICommandOptions<TArgs, TRootCommandArgs>
  ): InternalCLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.configuration = configuration;
    this.requiresCommand = configuration.handler ? false : 'IMPLICIT';
    return this;
  }

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
  command<
    TCommandArgs extends TArgs,
    TChildHandlerReturn = void,
    TCommandName extends string = string
  >(
    key: TCommandName,
    options: CLICommandOptions<TArgs, TCommandArgs, TChildHandlerReturn>
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren & {
      [key in TCommandName]: CLI<
        TCommandArgs,
        TChildHandlerReturn,
        {},
        CLI<TArgs, THandlerReturn, TChildren, TParent>
      >;
    },
    TParent
  >;
  command<
    TCommandArgs extends TArgs,
    TChildHandlerReturn = void,
    TCommandName extends string = string
  >(
    keyOrCommand: TCommandName | Command<TArgs, TCommandArgs>,
    options?: CLICommandOptions<TArgs, TCommandArgs, TChildHandlerReturn>
  ): CLI<
    TArgs,
    THandlerReturn,
    TChildren &
      (typeof keyOrCommand extends string
        ? {
            [key in typeof keyOrCommand]: CLI<
              TCommandArgs,
              TChildHandlerReturn,
              {},
              CLI<TArgs, THandlerReturn, TChildren, TParent>
            >;
          }
        : typeof keyOrCommand extends Command<
            TArgs,
            infer TCmdArgs,
            infer TCmdName
          >
        ? {
            [key in TCmdName]: CLI<
              TCmdArgs,
              void,
              {},
              CLI<TArgs, THandlerReturn, TChildren, TParent>
            >;
          }
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {}),
    TParent
  > {
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
    } else if (keyOrCommand instanceof InternalCLI) {
      const cmd = keyOrCommand;
      if (cmd.name === '$0') {
        this.withRootCommandConfiguration(cmd.configuration as any);
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
  >(name: TOption, config: TOptionConfig) {
    this.parser.option(name, config);
    // Interface modifies the return type to reflect new params, cast is necessay.... I think 🤔
    return this as any;
  }

  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(name: TOption, config: TOptionConfig) {
    this.parser.positional(name, config);
    // Interface modifies the return type to reflect new params, cast is necessay.... I think 🤔
    return this as any;
  }

  conflicts(
    ...args: [string, string, ...string[]]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.parser.conflicts(...args);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  implies(
    option: string,
    ...impliedOptions: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.parser.implies(option, ...impliedOptions);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  env(
    a0: string | EnvOptionConfig | undefined = fromCamelOrDashedCaseToConstCase(
      this.name
    )
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    if (typeof a0 === 'string') {
      this.parser.env(a0);
    } else {
      a0.prefix ??= fromCamelOrDashedCaseToConstCase(this.name);
      this.parser.env(a0);
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  localize(
    dictionaryOrFn: LocalizationDictionary | LocalizationFunction,
    locale?: string
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    if (typeof dictionaryOrFn === 'function') {
      this.parser.localize(dictionaryOrFn);
    } else {
      this.parser.localize(dictionaryOrFn, locale);
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  /**
   * Gets the localized display name for a command key.
   * @param key The command key
   * @returns The localized command name, or the original key if not localized
   */
  getLocalizedCommandName(key: string): string {
    return this.parser.getDisplayKey(key);
  }

  demandCommand(): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.requiresCommand = 'EXPLICIT';
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  strict(enable = true): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.parser.options.strict = enable;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  usage(usageText: string): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.configuration ??= {};
    this.configuration.usage = usageText;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  examples(
    ...examples: string[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.configuration ??= {};
    this.configuration.examples ??= [];
    this.configuration.examples.push(...examples);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  version(version?: string): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this._versionOverride = version;
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
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
    TParent
  > {
    this.registeredMiddleware.add(callback);
    // If middleware returns void, TArgs doesn't change...
    // If it returns something, we need to merge it into TArgs...
    // that's not here though, its where we apply the middleware results.
    return this as any;
  }

  init(
    callback: (
      cli: CLI<TArgs, THandlerReturn, TChildren, TParent>,
      args: TArgs
    ) => Promise<void> | void
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.registeredInitHooks.push(callback);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
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
    let cmd: InternalCLI<any, any, any, any> = this;
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
        await cmd.configuration.handler(args, {
          command: cmd as any,
        });
        return args;
      } else {
        // We can treat a command as a subshell if it has subcommands
        if (Object.keys(cmd.registeredCommands).length > 0) {
          if (!process.stdout.isTTY) {
            // If we're not in a TTY, we can't run an interactive shell...
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
          } else if (!INTERACTIVE_SHELL) {
            const tui = new InteractiveShell(
              this as unknown as InternalCLI<any>,
              {
                prependArgs: originalArgV,
              }
            );
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
    return args;
  }

  getChildren(): TChildren {
    // Return a copy of registered commands, excluding aliases (same command registered under different keys)
    const children: Record<string, InternalCLI<any, any, any, any>> = {};
    const seen = new Set<InternalCLI<any, any, any, any>>();
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
    | undefined {
    const builder = this.configuration?.builder;
    if (!builder) return undefined;
    // Return a composable builder that preserves input types
    return ((parser: CLI<any, any, any, any>) => builder(parser)) as any;
  }

  getHandler():
    | ((args: Omit<TArgs, keyof ParsedArgs>) => THandlerReturn)
    | undefined {
    const context: CLIHandlerContext<TChildren, TParent> = {
      command: this as unknown as CLI<any, any, TChildren, TParent>,
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

  private buildSDKProxy(targetCmd: InternalCLI<any, any, any, any>): unknown {
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

      // Execute handler
      const context: CLIHandlerContext<any, any> = {
        command: cmd as unknown as CLI<any, any, any, any>,
      };
      const result = await handler(parsedArgs, context);

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
    cmd: InternalCLI<any, any, any, any>
  ): Array<(args: any) => unknown | Promise<unknown>> {
    const chain: InternalCLI<any, any, any, any>[] = [];
    let current: InternalCLI<any, any, any, any> | undefined = cmd;
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

  enableInteractiveShell(): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    if (this.requiresCommand === 'EXPLICIT') {
      throw new Error(
        'Interactive shell is not supported for commands that require a command.'
      );
    } else if (process.stdout.isTTY) {
      this.requiresCommand = false;
    }
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
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
      throw e;
    }
  }

  errorHandler(
    handler: ErrorHandler
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.registeredErrorHandlers.unshift(handler);
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  group(
    labelOrConfigObject:
      | string
      | { label: string; keys: (keyof TArgs)[]; sortOrder?: number },
    keys?: (keyof TArgs)[]
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
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
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
  }

  config(
    provider: ConfigurationFiles.ConfigurationProvider<TArgs>
  ): CLI<TArgs, THandlerReturn, TChildren, TParent> {
    this.parser.config(
      provider as ConfigurationFiles.ConfigurationProvider<any>
    );
    return this as unknown as CLI<TArgs, THandlerReturn, TChildren, TParent>;
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
  forge = (args: string[] = hideBin(process.argv)) =>
    this.withErrorHandlers(async () => {
      let argv: TArgs & { help?: boolean; version?: boolean };
      let validationFailedError: ValidationFailedError<TArgs> | undefined;

      // Run root builder (may register options, init hooks, commands)
      const originalBuilder = this.configuration?.builder;
      this.configuration?.builder?.(this as any);

      // If a $0 alias was registered during the builder, the configuration's
      // builder was replaced with the $0 subcommand's builder. We need to
      // run it so that the subcommand's options (e.g. positionals) get
      // registered on the parser before parsing begins.
      if (this.configuration?.builder && this.configuration.builder !== originalBuilder) {
        this.configuration.builder(this as any);
      }

      // Merge helper: accumulate defined values without overwriting
      const mergeNew = (target: any, source: any) => {
        for (const [key, value] of Object.entries(source)) {
          if (key !== 'unmatched' && value !== undefined && target[key] === undefined) {
            target[key] = value;
          }
        }
      };

      // Iterative command discovery with init hooks.
      // Each level: non-strict parse filtered args → run middleware
      // → run init hooks → find next command in unmatched tokens
      // → filter down. Builders stay lazy.
      let currentArgs = [...args];
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentCmd: InternalCLI<any, any, any, any> = this;
      const mergedArgs: any = {};
      const executedMiddleware = new Set<(args: any) => void>();

      // eslint-disable-next-line no-constant-condition
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
        let nextCmd: InternalCLI<any, any, any, any> | null = null;
        if (discoveredCommand) {
          const cmd = currentCmd.registeredCommands[discoveredCommand];
          cmd.parser = this.parser;
          cmd.configuration!.builder?.(cmd as any);
          this.commandChain.push(discoveredCommand);
          nextCmd = cmd;
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
                continue;
              }
            }
            remainingArgs.push(token);
          }
        }

        if (!nextCmd) {
          currentArgs = unmatched;
          break;
        }
        // If command found during parse, all unmatched are remaining args.
        // If command found in post-init scan, use filtered remaining args.
        currentArgs = discoveredCommand ? unmatched : remainingArgs;
        currentCmd = nextCmd;
      }

      // All builders and init hooks have run. The parser now has
      // all options registered. Parse the remaining unmatched tokens
      // seeded with the accumulated values from the discovery loop.
      // The alreadyParsed values ensure proper required-option
      // validation and prevent positional re-consumption.
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

      const finalArgV = await this.runCommand(argv, args, executedMiddleware);
      return finalArgV as TArgs;
    });

  getParser() {
    return this.parser.asReadonly();
  }

  getSubcommands() {
    return this.registeredCommands as Readonly<Record<string, InternalCLI>>;
  }

  clone() {
    const clone = new InternalCLI<TArgs, THandlerReturn, TChildren, TParent>(
      this.name
    );
    clone.parser = this.parser.clone(clone.parser.options) as any;
    if (this.configuration) {
      clone.withRootCommandConfiguration(this.configuration);
    }
    clone.registeredCommands = {};
    for (const command in this.registeredCommands ?? {}) {
      clone.command(this.registeredCommands[command].clone() as any);
    }
    clone.commandChain = [...this.commandChain];
    clone.requiresCommand = this.requiresCommand;
    return clone;
  }
}
