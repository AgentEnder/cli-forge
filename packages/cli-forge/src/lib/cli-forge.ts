import {
  ArgvParser,
  ArrayOptionConfig,
  OptionConfig,
  ParsedArgs,
} from '@cli-forge/parser';

type CLICommandOptions<TInitial extends ParsedArgs, TArgs extends TInitial> = {
  description?: string;
  builder?: (parser: CLI<TInitial>) => CLI<TArgs>;
  handler: (args: TArgs) => void;
};

export class CLI<T extends ParsedArgs> {
  private commands: Record<string, CLI<any>> = {};
  private commandChain: string[] = [];
  private requiresCommand: boolean = false;
  private parser = new ArgvParser<T>({
    unmatchedParser: (arg, tokens, parser) => {
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

  constructor(
    public name: string,
    protected configuration?: CLICommandOptions<T, T>
  ) {}

  command<TArgs extends T>(key: string, options: CLICommandOptions<T, TArgs>) {
    if (key === '$0') {
      this.configuration = {
        ...this.configuration,
        builder: options.builder as any,
        handler: options.handler as any,
        description: options.description,
      };
    }
    this.commands[key] = new CLI<TArgs>(key, options);
    this.commands[key].parser = this.parser;
    return this;
  }

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

  positional<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    this.parser.option(name, config);
    return this as any as CLI<
      T & {
        [key in TOption]: {
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

  demandCommand() {
    this.requiresCommand = true;
    return this;
  }

  formatHelp() {
    const help: string[] = [];
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

  printHelp() {
    console.log(this.formatHelp());
  }

  async runCommand<T extends ParsedArgs>(cmd: CLI<T>, args: T) {
    try {
      if (cmd.requiresCommand) {
        throw new Error(
          `${[this.name, ...this.commandChain].join(' ')} requires a command`
        );
      }
      await cmd.configuration!.handler(args);
    } catch {
      process.exitCode = 1;
      this.printHelp();
    }
  }

  async forge(args: string[] = process.argv.slice(2)) {
    // Parsing the args does two things:
    // - builds argv to pass to handler
    // - fills the command chain + registers commands
    const argv = this.parser.parse(args);
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
        ? (this.configuration?.builder?.(this).parser ?? this.parser).parse(
            args
          )
        : argv;

    await this.runCommand(currentCommand, finalArgV);
  }
}

export function cli(name: string) {
  return new CLI(name);
}

export default cli;
