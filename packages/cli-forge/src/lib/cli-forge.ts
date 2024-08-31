import {
  ArgvParser,
  InternalOptionConfig,
  OptionConfig,
  ParsedArgs,
  ValidationFailedError,
  fromCamelOrDashedCaseToConstCase,
  hideBin,
} from '@cli-forge/parser';
import { getCallingFile, getParentPackageJson } from './utils';
import { INTERACTIVE_SHELL, InteractiveShell } from './interactive-shell';
import { CLI, CLICommandOptions, Command, ErrorHandler } from './public-api';

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

  /**
   * A list of option groups that have been registered with the CLI. Grouped Options are displayed together in the help text.
   *
   * For internal use only. Stick to properties available on {@link CLI}.
   */
  private registeredOptionGroups: Array<{
    label: string;
    sortOrder: number;
    keys: Array<keyof TArgs>;
  }> = [];

  getGroupedOptions() {
    function registerGroupsFromCLI(cli: InternalCLI) {
      for (const { label, keys, sortOrder } of cli.registeredOptionGroups) {
        groups[label] ??= {
          keys: new Set(),
          sortOrder: Number.MAX_SAFE_INTEGER,
        };
        if (sortOrder) {
          groups[label].sortOrder = sortOrder;
        }
        for (const key of keys) {
          groups[label].keys.add(key);
        }
      }
    }

    const groups: Record<string, { keys: Set<string>; sortOrder: number }> = {};
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let command: InternalCLI<any> = this;
    registerGroupsFromCLI(command);
    for (const subcommand of this.commandChain) {
      command = command?.registeredCommands[subcommand];
      registerGroupsFromCLI(command);
    }
    const parserOptions: Record<string, InternalOptionConfig> =
      this.parser.configuredOptions;

    for (const key in parserOptions) {
      const option = parserOptions[key];
      if (option.group) {
        groups[option.group] ??= {
          keys: new Set(),
          sortOrder: Number.MAX_SAFE_INTEGER,
        };
        groups[option.group].keys.add(key);
      }
    }

    const groupedOptions: Array<{
      label: string;
      sortOrder: number;
      keys: Array<InternalOptionConfig>;
    }> = [];

    for (const label in groups) {
      const entry = {
        sortOrder: groups[label].sortOrder,
        keys: [] as InternalOptionConfig[],
        label,
      };
      for (const key of groups[label].keys) {
        const option = parserOptions[key];
        entry.keys.push(option);
        delete parserOptions[key];
      }
      groupedOptions.push(entry);
    }
    groupedOptions.sort((a, b) => {
      if (a.sortOrder === b.sortOrder) {
        return a.label.localeCompare(b.label);
      } else {
        return a.sortOrder - b.sortOrder;
      }
    });
    return groupedOptions;
  }

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
    let epilogue = this.configuration?.epilogue;
    for (const key of this.commandChain) {
      command = command.registeredCommands[key] as typeof this;

      // Properties that are ineherited from the parent command should be copied over
      if (command.configuration?.epilogue) {
        epilogue = command.configuration.epilogue;
      }
    }
    help.push(
      `Usage: ${
        command.configuration?.usage
          ? command.configuration.usage
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
    const groupedOptions = this.getGroupedOptions();
    const nonpositionalOptions = Object.values(
      command.parser.configuredOptions
    ).filter((c) => !c.positional);

    help.push(...getOptionBlock('Options', nonpositionalOptions));

    for (const { label, keys } of groupedOptions) {
      help.push(...getOptionBlock(label, keys));
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

    if (epilogue) {
      help.push('');
      help.push(epilogue);
    }

    return help.join('\n');

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

    function getOptionBlock(label: string, options: InternalOptionConfig[]) {
      const lines: string[] = [];

      if (options.length > 0) {
        lines.push('');
        lines.push(label + ':');
      }

      const allParts: Array<[key: string, ...parts: string[]]> = [];
      for (const option of options) {
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
        lines.push(
          `  --${key.padEnd(paddingValues[0])}${
            parts.length ? ' - ' : ''
          }${parts
            .map((part, i) => part.padEnd(paddingValues[i + 1]))
            .join(' ')}`
        );
      }
      return lines;
    }
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

  errorHandler(handler: ErrorHandler) {
    this.registeredErrorHandlers.unshift(handler);
    return this;
  }

  group(configObject: {
    label: string;
    keys: (keyof TArgs)[];
    sortOrder: number;
  }): CLI<TArgs>;

  group(label: string, keys: (keyof TArgs)[]): CLI<TArgs>;

  group(
    labelOrConfigObject:
      | string
      | { label: string; keys: (keyof TArgs)[]; sortOrder: number },
    keys?: (keyof TArgs)[]
  ): CLI<TArgs> {
    const config =
      typeof labelOrConfigObject === 'object'
        ? labelOrConfigObject
        : {
            label: labelOrConfigObject,
            keys: keys as (keyof TArgs)[],
            sortOrder: Object.keys(this.registeredOptionGroups).length,
          };

    if (!config.keys) {
      throw new Error('keys must be provided when calling `group`.');
    }

    this.registeredOptionGroups.push(config);
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
      let currentCommand: InternalCLI<any> = this;
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
