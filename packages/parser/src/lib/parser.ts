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

export type ArrayOptionConfig<T extends string | number> = {
  type: 'array';
  items: T extends string ? 'string' : 'number';
} & CommonOptionConfig<T[]>;

type OptionConfig =
  | StringOptionConfig
  | NumberOptionConfig
  | ArrayOptionConfig<string | number>
  | BooleanOptionConfig;

type InternalOptionConfig = OptionConfig & {
  key: string;
  position?: number;
};

type ParsedArgs = {
  [key: string]: string | number | boolean | string[] | number[];
  unmatached: string[];
};

class ArgvParser<
  TArgs extends ParsedArgs = {
    unmatached: string[];
  }
> {
  configuredOptions: { [key in keyof TArgs]: InternalOptionConfig };
  configuredPositionals: InternalOptionConfig[];

  constructor() {
    this.configuredOptions = {} as Record<keyof TArgs, InternalOptionConfig>;
    this.configuredPositionals = [];
  }

  option<TOption extends string>(name: TOption, config: OptionConfig) {
    const thisAsNewType = this as ArgvParser<
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

    return this as ArgvParser<TArgs & { [key in typeof name]: any }>;
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
            parserMap[configuration.type],
            configuration,
            argvClone
          );
          result[configuration.key] = value;
          arg = argvClone.shift();
        } else {
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
        console.log('configuration', configuration);
        if (configuration && configuration.positional === true) {
          const value = tryParseValue(
            parserMap[configuration.type],
            configuration,
            [arg]
          );
          result[configuration.key] = value;
          matchedPositionals++;
        } else {
          result.unmatched.push(arg);
        }
        arg = argvClone.shift();
      }
    }
    return result;
  }
}

export function parser() {
  return new ArgvParser();
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

class NoValueError extends Error {
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
