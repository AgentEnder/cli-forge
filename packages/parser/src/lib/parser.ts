export type CommonOptionConfig<T, TCoerce = T> = {
  /**
   * If set to true, the option will be treated as a positional argument.
   */
  positional?: boolean;

  /**
   * Provide an array of aliases for the option.
   */
  alias?: string[];

  /**
   * Provide a default value for the option.
   */
  default?: T;

  /**
   * Provide a description for the option.
   */
  description?: string;

  /**
   * Provide a function to coerce the value of the option.
   * @param value Value of the option
   * @returns Coerced value of the option
   */
  coerce?: (value: T) => TCoerce;

  /**
   * Provide a function to validate the value of the option.
   * @param value Coerced value of the option
   * @returns If the value is valid, return true. If the value is invalid, return false or a string with an error message.
   */
  validate?: (value: TCoerce) => boolean | string;

  /**
   * If true, the option is required.
   */
  required?: boolean;
};

export type StringOptionConfig<TCoerce = string> = {
  type: 'string';
} & CommonOptionConfig<string, TCoerce>;

export type NumberOptionConfig<TCoerce = number> = {
  type: 'number';
} & CommonOptionConfig<number, TCoerce>;

export type BooleanOptionConfig<TCoerce = boolean> = {
  type: 'boolean';
} & CommonOptionConfig<boolean, TCoerce>;

export type StringArrayOptionConfig<TCoerce = string> = {
  type: 'array';
  items: 'string';
} & CommonOptionConfig<string[], TCoerce>;

export type NumberArrayOptionConfig<TCoerce = number> = {
  type: 'array';
  items: 'number';
} & CommonOptionConfig<number[], TCoerce>;

export type ArrayOptionConfig<TCoerce = string | number> =
  | StringArrayOptionConfig<TCoerce>
  | NumberArrayOptionConfig<TCoerce>;

export type OptionConfig<TCoerce = any> =
  | StringOptionConfig<TCoerce>
  | NumberOptionConfig<TCoerce>
  | ArrayOptionConfig<TCoerce>
  | BooleanOptionConfig<TCoerce>;

type InternalOptionConfig = OptionConfig & {
  key: string;
  position?: number;
};

export type ParsedArgs = {
  unmatched: string[];
  '--'?: string[];
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
        [key in TOption]: TOptionConfig['coerce'] extends (s: any) => any
          ? ReturnType<TOptionConfig['coerce']>
          : {
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
      if (arg === '--') {
        result['--'] = argvClone;
        break;
      }
      // Found a flag + value
      if (isFlag(arg)) {
        const keys = readArgKeys(arg);
        const configuredKeys = keys.map((key) =>
          getConfiguredOptionKey<TArgs>(key, this.configuredOptions)
        );
        // Handles unmatched flags
        if (configuredKeys.some((key) => key === undefined)) {
          if (this.options.unmatchedParser(arg, argvClone, this)) {
            arg = argvClone.shift();
            continue;
          }
          result.unmatched.push(arg);
          let next = argvClone.shift();
          // Collect all the values until the next flag
          while (next && !isNextFlag(next)) {
            result.unmatched.push(next);
            next = argvClone.shift();
          }
          arg = next;
          continue;
        }
        for (const configuredKey of configuredKeys) {
          if (configuredKey) {
            const configuration = this.configuredOptions[configuredKey];
            const value = tryParseValue(
              this.parserMap[configuration.type],
              configuration,
              argvClone
            );
            result[configuration.key] = value;
            arg = argvClone.shift();
          }
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
    for (const configurationKey in this.configuredOptions) {
      const configuration = this.configuredOptions[configurationKey];
      if (configuration.default !== undefined) {
        result[configuration.key] ??= configuration.default;
      }
      validateOption(configuration, result[configuration.key]);
    }
    for (const configuration of this.configuredPositionals) {
      if (configuration.default !== undefined) {
        result[configuration.key] ??= configuration.default;
      }
      validateOption(configuration, result[configuration.key]);
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

function validateOption<T>(optionConfig: InternalOptionConfig, value: T) {
  if (optionConfig.validate) {
    const result = optionConfig.validate(value);
    if (typeof result === 'string') {
      throw new Error(result);
    }
    if (!result) {
      throw new Error(
        `Invalid value for${
          optionConfig.positional ? ' positional' : ''
        } option ${optionConfig.key}`
      );
    }
  }
  if (optionConfig.required && value === undefined) {
    throw new Error(
      `Missing required${optionConfig.positional ? ' positional' : ''} option ${
        optionConfig.key
      }`
    );
  }
}

function getConfiguredOptionKey<T extends ParsedArgs>(
  key: string,
  configuredOptions: Partial<Record<keyof T, OptionConfig>>
): keyof T | undefined {
  if (key in configuredOptions) {
    return key as keyof T;
  }
  for (const configuredKey in configuredOptions) {
    const config = configuredOptions[configuredKey];
    if (config?.alias?.includes(key)) {
      return configuredKey as keyof T;
    }
  }
  return undefined;
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
    const val = parser(config, tokens);
    return (config.coerce as (s: any) => any)?.(val) ?? val;
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

function isFlag(str: string): str is `-${string}` {
  return str.startsWith('-');
}

function readArgKeys(str: `-${string}`): string[] {
  // Long flags (e.g. --foo)
  if (str.startsWith('--')) {
    return [str.slice(2)];
    // Short flag combinations (e.g. -xvf)
  } else if (str.startsWith('-')) {
    return str.slice(1).split('');
  }
  throw new Error(`Invalid flag ${str}`);
}
