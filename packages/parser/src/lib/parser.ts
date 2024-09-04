import { hideBin } from './helpers';
import { fromDashedToCamelCase, getEnvKey } from './utils';

type Flatten<T> = T extends Array<infer U> ? U : T;

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
   * Provide an array of choices for the option. Values not in the array will throw an error.
   */
  choices?: Flatten<T>[] | (() => Flatten<T>[]);

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

  /**
   * If set, the option will be populated from the environment variable `${env}_${optionName}`.
   * If set to true, the environment variable will be `${optionName}`.
   * If explicitly set to false, environment variable population will be disabled for this option.
   */
  env?:
    | string
    | boolean
    | {
        /**
         * What key should the value be read from in process.env
         */
        key: string;

        /**
         * If set to false, ignore prefix provided by .env() call.
         */
        prefix?: boolean;
      };

  /**
   * If set, the option will be marked as deprecated, with the provided message. This will not effect runtime behavior,
   * but will be displayed in help output and generated docs.
   */
  deprecated?: string;

  /**
   * If true, the option will not be displayed in help output or generated docs.
   */
  hidden?: boolean;

  /**
   * Can be set to group options in help output and generated docs.
   */
  group?: string;
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

export interface ObjectOptionConfig<
  TCoerce = Record<string, string>,
  TProperties extends {
    [key: string]: Readonly<OptionConfig>;
  } = Record<string, any>
> extends CommonOptionConfig<Record<string, string>, TCoerce> {
  type: 'object';
  /** */
  properties: TProperties;
  additionalProperties?: false | 'string' | 'number' | 'boolean';
}

/**
 * Configuration for array options. Arrays are parsed from
 * comma separated, space separated, or multiple values.
 *
 * e.g. `--foo a b c`, `--foo a,b,c`, or `--foo a --foo b --foo c`
 */
export type ArrayOptionConfig<TCoerce = string | number> =
  | StringArrayOptionConfig<TCoerce>
  | NumberArrayOptionConfig<TCoerce>;

/**
 * Configures an option for the parser. See subtypes for more information.
 * - {@link StringOptionConfig}
 * - {@link NumberOptionConfig}
 * - {@link ArrayOptionConfig}
 * - {@link BooleanOptionConfig}
 *
 * @typeParam TCoerce The return type of the `coerce` function if provided.
 */
export type OptionConfig<
  TCoerce = any,
  TObjectProps extends Record<string, OptionConfig> = Record<string, any>
> =
  | StringOptionConfig<TCoerce>
  | NumberOptionConfig<TCoerce>
  | ArrayOptionConfig<TCoerce>
  | BooleanOptionConfig<TCoerce>
  | ObjectOptionConfig<TCoerce, TObjectProps>;

export type InternalOptionConfig = OptionConfig & {
  key: string;
  position?: number;
};

export type Internal<T extends OptionConfig> = T & InternalOptionConfig;

/**
 * Base type for parsed arguments.
 */
export type ParsedArgs<T = never> = [T] extends [never]
  ? {
      /**
       * Contains any unmatched arguments as originally passed to the parser.
       */
      unmatched: string[];

      /**
       * Contains any arguments passed after `--`, which halts parsing of flags.
       */
      '--'?: string[];
    }
  : {
      /**
       * Contains any unmatched arguments as originally passed to the parser.
       */
      unmatched: string[];

      /**
       * Contains any arguments passed after `--`, which halts parsing of flags.
       */
      '--'?: string[];
    } & T;

/**
 * Extra options for the parser
 */
export type ParserOptions = {
  /**
   * Can be used to implement custom parser types.
   */
  extraParsers?: Record<string, Parser<any>>;

  /**
   * Can be used to implement custom handling for unmatched arguments.
   * @returns true if the argument was handled, false if it was not
   */
  unmatchedParser?: (
    arg: string,
    tokens: string[],
    parser: ArgvParser
  ) => boolean;
};

export interface ReadonlyArgvParser<TArgs extends ParsedArgs> {
  configuredOptions: Readonly<{ [key in keyof TArgs]: InternalOptionConfig }>;
  configuredPositionals: readonly Readonly<InternalOptionConfig>[];
  options: Readonly<Required<ParserOptions>>;
}

/**
 * The main parser class. This class is used to configure and parse arguments.
 *
 * {@link parser} is a small helper function to create a new parser instance.
 */
export class ArgvParser<
  TArgs extends ParsedArgs = {
    unmatched: string[];
  }
> implements ReadonlyArgvParser<TArgs>
{
  /**
   * The configured options for the parser.
   */
  configuredOptions: { [key in keyof TArgs]: InternalOptionConfig };

  /**
   * The configured positional arguments for the parser
   */
  configuredPositionals: InternalOptionConfig[];

  /**
   * The configured conflicts for the parser. If an option is set, and a conflicting option is also set, an error will be thrown.
   */
  configuredConflicts: Record<string, Set<string>> = {};

  /**
   * The configured implies for the parser. If an option is set, the implied option must also be set.
   */
  configuredImplies: Record<string, Set<string>> = {};

  /**
   * The configuration for the parser itself
   */
  options: Required<ParserOptions>;

  /**
   * The parsers used to parse individual option types.
   */
  parserMap: Record<string, Parser<any>>;

  /**
   * If set, options can be populated from environment variables of the form `${envPrefix}_${optionName}`.
   */
  private envPrefix?: string;
  private shouldReadFromEnv?: boolean;

  /**
   * Creates a new parser. Normally using {@link parser} is preferred.
   * @param options
   */
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

  /**
   * Registers a new option with the parser.
   * @param name The name of the option
   * @param config The configuration for the option. See {@link OptionConfig}
   * @returns Updated parser instance with the new option registered.
   */
  option<TOption extends string, const TOptionConfig extends OptionConfig<any>>(
    name: TOption,
    config: TOptionConfig
  ) {
    const thisAsNewType = this as any as ArgvParser<
      TArgs & { [key in TOption]: OptionConfig }
    >;

    if (name.includes('-')) {
      config.alias ??= [];
      config.alias.push(fromDashedToCamelCase(name));
    }

    const entry = {
      key: name,
      ...config,
    } as InternalOptionConfig;

    thisAsNewType.configuredOptions[name] = entry;
    if (entry.positional) {
      thisAsNewType.configuredPositionals.push(entry);
    }

    return this as any as ArgvParser<
      TArgs & {
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }
    >;
  }

  /**
   * Registers a new positional argument with the parser.
   * @param name The name of the positional argument
   * @param config The configuration for the positional argument. See {@link OptionConfig}
   * @returns Updated parser instance with the new positional argument registered.
   */
  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any>
  >(name: TOption, config: TOptionConfig) {
    return this.option(name, {
      ...config,
      positional: true,
    });
  }

  /**
   * Enables environment variable population for options.
   * @param envPrefix Prefix for environment variables. The full environment variable name will be `${envPrefix}_${optionName}`.
   */
  env(envPrefix?: string) {
    this.envPrefix = envPrefix;
    this.shouldReadFromEnv = true;
    return this;
  }

  /**
   * Parses an array of arguments into a structured object.
   * @param argv The array of arguments to parse
   * @returns The parsed arguments
   */
  parse(argv: string[] = hideBin(process.argv)) {
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
        const [maybeArg, maybeValue] = arg.split('=');
        const keys = readArgKeys(maybeArg as `-${string}`);
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
        if (maybeValue) {
          argvClone.unshift(maybeValue);
        }
        for (const configuredKey of configuredKeys) {
          if (configuredKey) {
            const configuration = this.configuredOptions[configuredKey];
            const value = tryParseValue(this.parserMap[configuration.type], {
              config: configuration,
              tokens: argvClone,
              current: result[configuration.key],
              providedFlag: maybeArg,
            });
            result[configuration.key] = value;
            arg = argvClone.shift();
          }
        }
        // Found a positional argument
      } else {
        let configuration = this.configuredPositionals[matchedPositionals];
        // Handles if a positional argument was already set by a flag.
        while (configuration && result[configuration.key] !== undefined) {
          matchedPositionals++;
          configuration = this.configuredPositionals[matchedPositionals];
        }
        if (configuration && configuration.positional === true) {
          argvClone.unshift(arg);
          const value = tryParseValue(this.parserMap[configuration.type], {
            config: configuration,
            tokens: argvClone,
            current: result[configuration.key],
          });
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

    return this.validateAndNormalizeResults(result) as TArgs;
  }

  private normalizeOptions(result: any) {
    const normalized = { ...result };
    for (const key in this.configuredOptions) {
      const configuration = this.configuredOptions[key];
      if (normalized[key] === undefined) {
        if (
          (configuration.env !== false && this.shouldReadFromEnv) ||
          configuration.env
        ) {
          const envValue = this.readFromEnv(configuration);
          if (envValue) {
            normalized[configuration.key] = envValue;
          }
        }
        if (configuration.default !== undefined) {
          normalized[configuration.key] ??= configuration.default;
        }
      }
    }
    return normalized;
  }

  private validateAndNormalizeResults(result: any) {
    const errors: Error[] = [];
    const normalized = this.normalizeOptions(result);
    const partial = { ...normalized };

    const validateConflicts = (configuration: InternalOptionConfig) => {
      if (this.configuredConflicts[configuration.key]) {
        for (const conflict of this.configuredConflicts[configuration.key]) {
          if (normalized[conflict] !== undefined) {
            const error = new Error(
              `Provided option ${configuration.key} conflicts with ${conflict}`
            );
            delete partial[configuration.key];
            delete partial[conflict];
            delete error.stack;
            errors.push(error);
          }
        }
      }
    };

    const validateImplications = (configuration: InternalOptionConfig) => {
      if (this.configuredImplies[configuration.key]) {
        for (const imply of this.configuredImplies[configuration.key]) {
          if (normalized[imply] === undefined) {
            const error = new Error(
              `If ${configuration.key} is set, ${imply} is required.`
            );
            delete partial[configuration.key];
            delete error.stack;
            errors.push(error);
          }
        }
      }
    };

    for (const configurationKey in this.configuredOptions) {
      const configuration = this.configuredOptions[configurationKey];
      try {
        validateOption(configuration, normalized[configuration.key]);
        if (normalized[configuration.key] !== undefined) {
          validateConflicts(configuration);
          validateImplications(configuration);
        }
      } catch (e: any) {
        delete partial[configuration.key];
        errors.push(e);
      }
    }

    if (errors.length) {
      const error = new ValidationFailedError<TArgs>(
        errors.map((error) =>
          error instanceof Error ? error : new Error(error)
        ),
        `Validation failed for one or more options`,
        partial
      );
      if (
        process.env[
          this.envPrefix
            ? `${this.envPrefix}_VERBOSE_LOGGING`
            : 'CLI_VERBOSE_LOGGING'
        ] !== 'true'
      ) {
        error.stack = undefined;
      }
      throw error;
    }
    return normalized;
  }

  private readFromEnv(configuration: InternalOptionConfig) {
    const { envKey: configuredKey, prefix } =
      typeof configuration.env === 'string'
        ? { envKey: configuration.env, prefix: this.envPrefix }
        : typeof configuration.env === 'boolean'
        ? { envKey: configuration.key, prefix: this.envPrefix }
        : {
            envKey: configuration.env?.key ?? configuration.key,
            prefix:
              configuration.env?.prefix === false ? undefined : this.envPrefix,
          };
    const envKey = getEnvKey(prefix, configuredKey);
    const envValue = process.env[envKey];
    if (envValue) {
      return tryParseValue(this.parserMap[configuration.type], {
        config: configuration,
        tokens: [envValue],
      });
    }
  }

  /**
   * Registers that a set of options cannot be provided at the same time.
   * @param options The options that cannot be provided together.
   */
  conflicts(...options: [string, string, ...string[]]) {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      this.configuredConflicts[option] ??= new Set();
      for (let j = 0; j < options.length; j++) {
        if (i !== j) {
          this.configuredConflicts[option].add(options[j]);
        }
      }
    }
    return this;
  }

  /**
   * Registers that the presence of one option implies the presence of one or more other options.
   * @param options The options that imply the other option.
   */
  implies(option: string, ...options: string[]) {
    this.configuredImplies[option] ??= new Set();
    for (const opt of options) {
      this.configuredImplies[option].add(opt);
    }
    return this;
  }

  /**
   * Used to combine two parsers into a single parser. Mutates `this`, but returns with updated typings
   * @param parser The parser to augment the current parser with.
   * @returns The updated parser instance.
   */
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

  clone(parserOptions: ParserOptions = this.options) {
    const clone = new ArgvParser(parserOptions);

    clone.configuredOptions = { ...this.configuredOptions };
    clone.configuredPositionals = [...this.configuredPositionals];
    clone.configuredConflicts = { ...this.configuredConflicts };
    clone.configuredImplies = { ...this.configuredImplies };

    return clone;
  }

  asReadonly(): ReadonlyArgvParser<TArgs> {
    return this;
  }
}

/**
 * Small helper function to create a new parser instance.
 * @param opts see {@link ParserOptions}
 * @returns new parser, see {@link ArgvParser}
 */
export function parser(opts?: ParserOptions) {
  return new ArgvParser(opts);
}

function validateOption<T>(optionConfig: InternalOptionConfig, value: T) {
  if (optionConfig.choices) {
    const choices = [
      ...new Set<T>(
        [
          typeof optionConfig.choices === 'function'
            ? optionConfig.choices()
            : optionConfig.choices,
        ].flat() as T[]
      ),
    ];
    optionConfig.validate ??= () => true;
    optionConfig.validate = (val) => {
      if (
        !(Array.isArray(val)
          ? // If option config is an array, check if all values are in choices
            val.every((v) => choices.includes(v))
          : // If option config is not an array, check if value is in choices
            choices.includes(val))
      ) {
        return `Invalid value "${val}" for${
          optionConfig.positional ? ' positional' : ''
        } option ${optionConfig.key}. Valid values are: ${choices.join(', ')}`;
      }
      return true;
    };
  }
  if (optionConfig.validate && value !== undefined) {
    let result: ReturnType<Required<CommonOptionConfig<any>>['validate']>;
    try {
      result = optionConfig.validate(value);
    } catch (e) {
      throw new Error(
        `Validation failed for${
          optionConfig.positional ? ' positional' : ''
        } option ${optionConfig.key}`,
        { cause: e }
      );
    }
    if (typeof result === 'string') {
      const e = new Error(result);
      delete e.stack;
      throw e;
    }
    if (result === false) {
      const e = new Error(
        `Invalid value "${value}" for${
          optionConfig.positional ? ' positional' : ''
        } option ${optionConfig.key}`
      );
      delete e.stack;
      throw e;
    }
  }
  if (optionConfig.required && value === undefined) {
    const e = new Error(
      `Missing required${optionConfig.positional ? ' positional' : ''} option ${
        optionConfig.key
      }`
    );
    delete e.stack;
    throw e;
  }
}

function getConfiguredOptionKey<T extends ParsedArgs>(
  key: string,
  configuredOptions: Partial<Record<keyof T, OptionConfig>>
): keyof T | undefined {
  if (key in configuredOptions) {
    return key as keyof T;
  }

  function normalizeNegatedBooleanKey(key: string) {
    if (
      key.startsWith('no') &&
      key.length > 2 &&
      key[2] === key[2].toUpperCase()
    ) {
      const stripped = key.slice(2);
      return [stripped[0].toLowerCase(), stripped.slice(1)].join('');
    }
    return key;
  }

  function normalizeObjectOptionKey(key: string) {
    if (key.includes('.')) {
      return key.split('.')[0];
    }
    return key;
  }

  // Handles booleans passed as `--no-foo`
  const normalizedKey = normalizeObjectOptionKey(
    normalizeNegatedBooleanKey(key)
  );

  if (normalizedKey in configuredOptions) {
    return normalizedKey as keyof T;
  }

  for (const configuredKey in configuredOptions) {
    const config = configuredOptions[configuredKey];
    if (config?.alias?.includes(key)) {
      return configuredKey as keyof T;
    }
    // Handles negated booleans that are aliased
    if (config?.type === 'boolean' && config.alias?.includes(normalizedKey)) {
      return configuredKey as keyof T;
    }
  }
  return undefined;
}

function isNextFlag(str: string) {
  return str.startsWith('--') || str.startsWith('-');
}

const booleanParser: Parser<Internal<BooleanOptionConfig>> = ({
  tokens,
  providedFlag,
}) => {
  const negated = providedFlag?.startsWith('--no-');
  const val = tokens.shift();
  const parsed = (() => {
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
  })();
  return negated ? !parsed : parsed;
};

export class NoValueError extends Error {
  constructor() {
    super('Expected a value');
  }
}

const stringParser: Parser<Internal<StringOptionConfig>> = ({ tokens }) => {
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

const numberParser: Parser<Internal<NumberOptionConfig>> = ({ tokens }) => {
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
  const collected = [];
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

const arrayParser: Parser<Internal<ArrayOptionConfig>> = <
  T extends string | number
>({
  config,
  tokens,
  current,
}: ParserContext<Internal<ArrayOptionConfig>>) => {
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
  const coerced = collected.map(coerce);
  return current ? current.concat(coerced) : coerced;
};

const objectParser: Parser<Internal<ObjectOptionConfig>> = ({
  tokens,
  config,
  providedFlag,
  current,
}) => {
  current ??= {};
  // `providedFlag` is the flag that was used on the cli.
  // it will look like `env.foo.bar`, or `env.foo`. for dot notation
  //
  // We don't care about the first part, as the base parser has already matched the flag.
  const parts = providedFlag?.split('.').slice(1);
  if (!parts?.length) {
    throw new Error(
      `${config.key} is configured as an object, but no properties were provided. Pass properties like so: --${config.key}.foo bar --${config.key}.baz qux`
    );
  }
  const { config: propConfig, readValue, setValue } = parsePath(parts);
  const currentValue = readValue();
  const parsedValue = tryParseValue(parserMap[propConfig.type], {
    config: {
      ...propConfig,
      key: `${config.key}.${parts.join('.')}`,
    },
    tokens,
    current: currentValue,
    providedFlag: providedFlag,
  });
  setValue(parsedValue);

  return current;

  function parsePath(parts: string[]): {
    readValue(): any;
    setValue(v: any): void;
    config: OptionConfig;
  } {
    const propParts = [...parts];
    let currentObject = current;
    let currentKey = propParts.shift();
    let currentValue: any;
    let currentConfig: OptionConfig = config;
    let last: string;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!currentKey) {
        return {
          readValue() {
            return currentValue;
          },
          setValue(v) {
            currentObject[last] = v;
          },
          config: currentConfig,
        };
      }
      const nextKey = propParts.shift();
      currentValue = currentObject[currentKey];
      if (nextKey) {
        if (currentValue && typeof currentValue !== 'object') {
          throw new Error(
            `Expected ${currentKey} to be an object, but found ${typeof currentValue}`
          );
        } else {
          currentObject[currentKey] ??= {};
        }
      }
      last = currentKey;
      currentKey = nextKey;
      if (nextKey) {
        currentObject = currentObject[last];
      }
      const c = (currentConfig as ObjectOptionConfig).properties[last];
      if (!c) {
        if (
          'additionalProperties' in currentConfig &&
          currentConfig.additionalProperties
        ) {
          currentConfig = {
            type: currentConfig.additionalProperties,
          };
        } else {
          throw new Error(
            `No configuration found for ${last} in ${config.key}`
          );
        }
      } else {
        currentConfig = c;
      }
    }
  }

  // function readValue(propParts: string[]) {
  //   const pathParts = [...propParts];
  //   let currentValue = current;
  //   let currentKey = pathParts.shift();
  //   while (currentKey) {
  //     if (typeof currentValue !== 'object' && currentValue !== undefined) {
  //       throw new Error(
  //         `Expected ${currentKey} to be an object, but found ${typeof currentValue}`
  //       );
  //     } else if (!(currentKey in currentValue)) {
  //       return undefined;
  //     } else {
  //       currentValue = currentValue[currentKey];
  //       currentKey = pathParts.shift();
  //     }
  //   }
  // }

  // function readOptionConfig(propParts: string[]): InternalOptionConfig {
  //   const pathParts = [...propParts];
  //   let currentConfig = config;
  //   let currentKey = pathParts.shift();
  //   while (currentKey) {
  //     if (!(currentKey in currentConfig.properties)) {
  //       if (!currentConfig.additionalProperties) {
  //         throw new Error(
  //           `No configuration found for ${currentKey} in ${config.key}`
  //         );
  //       } else {
  //         return {
  //           type: currentConfig.additionalProperties,
  //           key: 'additionalProperties',
  //         };
  //       }
  //     }
  //     currentConfig = currentConfig.properties[currentKey];
  //     currentKey = pathParts.shift();
  //   }
  //   return currentConfig;
  // }

  // function setValue(propParts: string[]) {}
};

type ParserContext<TConfig extends OptionConfig> = {
  config: TConfig;
  tokens: string[];
  current?: any;
  providedFlag?: string;
};

type Parser<TConfig extends OptionConfig, T = any> = (
  input: ParserContext<TConfig>
) => T;

function tryParseValue(
  parser: Parser<InternalOptionConfig>,
  input: ParserContext<InternalOptionConfig>
) {
  if (!parser) {
    throw new Error(
      `No parser found for option ${input.config.key} with type ${input.config.type}`
    );
  }
  try {
    const val = parser(input);
    return (input.config.coerce as (s: any) => any)?.(val) ?? val;
  } catch (e) {
    if (e instanceof NoValueError) {
      if (input.config.default !== undefined) {
        return input.config.default;
      }
      throw new Error(`Expected a value for ${input.config.key}`);
    }
    throw e;
  }
}

const parserMap: Record<string, Parser<any>> = {
  string: stringParser,
  number: numberParser,
  boolean: booleanParser,
  array: arrayParser,
  object: objectParser,
};

function isFlag(str: string): str is `-${string}` {
  return str.startsWith('-');
}

function readArgKeys(str: `-${string}`): string[] {
  // Long flags (e.g. --foo)
  if (str.startsWith('--')) {
    const key = str.slice(2);
    if (key.includes('-')) {
      return [fromDashedToCamelCase(key)];
    }
    return [str.slice(2)];
    // Short flag combinations (e.g. -xvf)
  } else if (str.startsWith('-')) {
    return str.slice(1).split('');
  }
  throw new Error(`Invalid flag ${str}`);
}

export class ValidationFailedError<T> extends AggregateError {
  constructor(
    errors: Error[],
    message: string,
    public partialArgV: Partial<T>
  ) {
    super(errors, message);
  }
}

export type OptionConfigToType<TOptionConfig extends OptionConfig> =
  TOptionConfig['coerce'] extends (s: any) => any
    ? ReturnType<TOptionConfig['coerce']>
    : {
        string: string;
        number: number;
        boolean: boolean;
        array: (TOptionConfig extends ArrayOptionConfig<string | number>
          ? TOptionConfig['items'] extends 'string'
            ? string
            : number
          : never)[];
        object: TOptionConfig extends ObjectOptionConfig
          ? ResolveTProperties<TOptionConfig['properties']> &
              (TOptionConfig['additionalProperties'] extends 'string'
                ? Record<string, string>
                : TOptionConfig['additionalProperties'] extends 'number'
                ? Record<string, number>
                : TOptionConfig['additionalProperties'] extends 'boolean'
                ? Record<string, boolean>
                : Record<string, never>)
          : never;
      }[TOptionConfig['type']];

type ResolveTProperties<TProperties extends Record<string, OptionConfig>> = {
  [key in keyof TProperties]: OptionConfigToType<TProperties[key]>;
};
