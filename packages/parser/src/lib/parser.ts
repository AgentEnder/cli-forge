export type CommonOptionConfig<T> = {
  positional?: boolean;
  alias?: string[];
  default?: T;
  description?: string;
};

export type StringOptionConfig = {
  type: 'string';
} & CommonOptionConfig<string>;

export type NumberOptionConfig = {
  type: 'number';
} & CommonOptionConfig<number>;

export type BooleanOptionConfig = {
  type: 'boolean';
} & CommonOptionConfig<boolean>;

export type ArrayOptionConfig<T extends string | number = string | number> = {
  type: 'array';
  items: T extends string ? 'string' : 'number';
} & CommonOptionConfig<T[]>;

export type OptionConfig =
  | StringOptionConfig
  | NumberOptionConfig
  | ArrayOptionConfig<string | number>
  | BooleanOptionConfig;

type InternalOptionConfig = OptionConfig & {
  key: string;
  position?: number;
};

export type ParsedArgs = {
  unmatched: string[];
};

export type WithOptionType<
  TInitial,
  TKey extends string,
  TOptionConfig extends OptionConfig
> = TInitial & {
  [key in TKey]: {
    string: string;
    number: number;
    boolean: boolean;
    array: (TOptionConfig extends ArrayOptionConfig
      ? TOptionConfig['items'] extends 'string'
        ? string
        : number
      : never)[];
  }[TOptionConfig['type']];
};

export type ParserOptions = {
  extraParsers?: Record<string, Parser<any>>;
  /**
   * @returns true if the argument was handled, false if it was not
   */
  unmatchedParser?: (
    arg: string,
    tokens: string[],
    parser: ArgvParser
  ) => boolean;
};

export class ArgvParser<
  TArgs extends ParsedArgs = {
    unmatched: string[];
  }
> {
  configuredOptions: { [key in keyof TArgs]: InternalOptionConfig };
  configuredPositionals: InternalOptionConfig[];
  options: Required<ParserOptions>;
  parserMap: Record<string, Parser<any>>;

  constructor(options?: ParserOptions) {
    this.configuredOptions = {} as Record<keyof TArgs, InternalOptionConfig>;
    this.configuredPositionals = [];
    this.options = {
      extraParsers: {},
      unmatchedParser: () => false,
      ...options,
    };
    this.parserMap = {
      ...parserMap,
      ...this.options.extraParsers,
    };
  }

  option<TOption extends string, TOptionConfig extends OptionConfig>(
    name: TOption,
    config: TOptionConfig
  ) {
    const thisAsNewType = this as any as ArgvParser<
      TArgs & { [key in TOption]: OptionConfig }
    >;

    if (config.positional) {
      thisAsNewType.configuredPositionals.push({
        key: name,
        ...config,
      });
    } else {
      thisAsNewType.configuredOptions[name] = {
        key: name,
        ...config,
      } as InternalOptionConfig;
    }

    return this as any as ArgvParser<
      TArgs & {
        [key in TOption]: {
          string: string;
          number: number;
          boolean: boolean;
          array: (TOptionConfig extends ArrayOptionConfig
            ? TOptionConfig['items'] extends 'string'
              ? string
              : number
            : never)[];
        }[TOptionConfig['type']];
      }
    >;
  }

  positional<TOption extends string>(name: TOption, config: OptionConfig) {
    return this.option(name, {
      ...config,
      positional: true,
    });
  }

  parse(argv: string[]) {
    const argvClone = [...argv];
    const result: any = {
      unmatched: [],
    };
    let arg = argvClone.shift();
    let matchedPositionals = 0;
    while (arg) {
      // Found a flag + value
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        if (isConfiguredOption<TArgs>(key, this.configuredOptions)) {
          const configuration = this.configuredOptions[key];
          const value = tryParseValue(
            this.parserMap[configuration.type],
            configuration,
            argvClone
          );
          result[configuration.key] = value;
          arg = argvClone.shift();
        } else {
          // The configured unmatched parser handled the argument
          if (this.options.unmatchedParser(arg, argvClone, this)) {
            arg = argvClone.shift();
            continue;
          }
          // Unmatched flag
          result.unmatched.push(arg);
          let next = argvClone.shift();
          // Collect all the values until the next flag
          while (next && !isNextFlag(next)) {
            result.unmatched.push(next);
            next = argvClone.shift();
          }
          arg = next;
        }
        // Found a positional argument
      } else {
        const configuration = this.configuredPositionals[matchedPositionals];
        if (configuration && configuration.positional === true) {
          const value = tryParseValue(
            this.parserMap[configuration.type],
            configuration,
            [arg]
          );
          result[configuration.key] = value;
          matchedPositionals++;
        } else {
          if (this.options.unmatchedParser(arg, argvClone, this)) {
            arg = argvClone.shift();
            continue;
          }
          result.unmatched.push(arg);
        }
        arg = argvClone.shift();
      }
    }
    return result as TArgs;
  }

  augment<TAugment extends ParsedArgs>(
    parser: ArgvParser<TAugment>
  ): ArgvParser<TArgs & TAugment> {
    const thisAsNewType = this as any as ArgvParser<TArgs & TAugment>;
    thisAsNewType.configuredOptions = {
      ...this.configuredOptions,
      ...parser.configuredOptions,
    };
    thisAsNewType.configuredPositionals = [
      ...this.configuredPositionals,
      ...parser.configuredPositionals,
    ];
    return thisAsNewType;
  }
}

export function parser(opts?: ParserOptions) {
  return new ArgvParser(opts);
}

function isConfiguredOption<T extends ParsedArgs>(
  key: string | number | symbol,
  configuredOptions: Partial<Record<keyof T, OptionConfig>>
): key is keyof T {
  return key in configuredOptions;
}

function isNextFlag(str: string) {
  return str.startsWith('--' || str.startsWith('-'));
}

const booleanParser: Parser<BooleanOptionConfig> = (_, tokens: string[]) => {
  const val = tokens.shift();
  if (val === undefined) {
    return true;
  }
  if (isNextFlag(val)) {
    tokens.unshift(val);
    return true;
  }
  if (val === 'false') {
    return false;
  }
  return true;
};

export class NoValueError extends Error {
  constructor() {
    super('Expected a value');
  }
}

const stringParser: Parser<StringOptionConfig> = (cfg, tokens: string[]) => {
  const val = tokens.shift();
  if (val === undefined) {
    throw new NoValueError();
  }
  if (isNextFlag(val)) {
    tokens.unshift(val);
    throw new NoValueError();
  }
  return val;
};

const numberParser: Parser<NumberOptionConfig> = (_, tokens: string[]) => {
  const val = tokens.shift();
  if (val === undefined) {
    throw new NoValueError();
  }
  if (isNextFlag(val)) {
    tokens.unshift(val);
    throw new NoValueError();
  }
  return Number(val);
};

const quotePairs = {
  '"': '"',
  "'": "'",
  '`': '`',
} as const;

const csvParser = (str: string) => {
  let collected = [];
  let val = '';
  let inQuote: keyof typeof quotePairs | false = false;
  for (const char of str) {
    if (inQuote) {
      if (char === quotePairs[inQuote]) {
        inQuote = false;
      } else {
        val += char;
      }
    } else {
      if (char in quotePairs) {
        inQuote = char as keyof typeof quotePairs;
      } else if (char === ',') {
        collected.push(val);
        val = '';
      } else {
        val += char;
      }
    }
  }
  collected.push(val);
  return collected;
};

const arrayParser: Parser<ArrayOptionConfig<string | number>> = <
  T extends string | number
>(
  config: ArrayOptionConfig<T>,
  tokens: string[]
) => {
  const coerce =
    config.items === 'string'
      ? (s: string) => s as T
      : (s: string) => Number(s) as T;
  let val = tokens.shift();
  if (val && val.includes(',')) {
    return csvParser(val).map(coerce);
  }
  const collected: string[] = [];
  while (val) {
    if (isNextFlag(val)) {
      tokens.unshift(val);
      break;
    }
    collected.push(val);
    val = tokens.shift();
  }
  return collected.map(coerce);
};

type Parser<TConfig extends OptionConfig, T = unknown> = (
  config: TConfig,
  tokens: string[]
) => T;

function tryParseValue(
  parser: Parser<OptionConfig>,
  config: InternalOptionConfig,
  tokens: string[]
) {
  if (!parser) {
    throw new Error(
      `No parser found for option ${config.key} with type ${config.type}`
    );
  }
  try {
    return parser(config, tokens);
  } catch (e) {
    if (e instanceof NoValueError) {
      if (config.default !== undefined) {
        return config.default;
      }
      throw new Error(`Expected a value for ${config.key}`);
    }
    throw e;
  }
}

const parserMap: Record<string, Parser<any>> = {
  string: stringParser,
  number: numberParser,
  boolean: booleanParser,
  array: arrayParser,
};
