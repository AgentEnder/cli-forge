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
  private parser: ArgvParser<T> = new ArgvParser({
    unmatchedParser: (arg, tokens, parser) => {
      let currentCommand: CLI<any> = this;
      for (const command of this.commandChain) {
        currentCommand = currentCommand.commands[command];
      }
      const command = currentCommand.commands[arg];
      if (command && command.configuration) {
        command.configuration.builder?.(this);
        this.commandChain.push(arg);
        return true;
      }
      return false;
    },
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
    return this;
  }

  option<TOption extends string, TOptionConfig extends OptionConfig>(
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

  runCommand(command: string, args: any) {
    const cmd = this.commands[command];
    if (cmd && cmd.configuration?.handler) {
      cmd.configuration.handler(args);
    }
  }

  forge(args: string[] = process.argv.slice(2)) {
    const argv = this.parser.parse(args);
    let currentCommand: CLI<any> = this;
    for (const command of this.commandChain) {
      currentCommand = currentCommand.commands[command];
    }
    if (currentCommand === this && this.configuration?.handler) {
      const parser = this.configuration.builder?.(this).parser ?? this.parser;
      this.configuration.handler(parser.parse(args));
    } else {
      currentCommand.configuration?.handler(argv);
    }
  }
}

export function cli(name: string) {
  return new CLI(name);
}

export default cli;
