import { CommonOptionConfig } from './option-types/common';
import { hideBin } from './helpers';
import { OptionConfigToType } from './option-types/option-config-to-type';
import { fromDashedToCamelCase, getEnvKey } from './utils/case-transformations';
import { InternalOptionConfig, OptionConfig } from './option-types';
import { parserMap } from './parsers/parser-map';
import { NoValueError, Parser, ParserContext } from './parsers/typings';
import { getConfiguredOptionKey } from './utils/get-configured-key';
import { isFlag, isNextFlag, readArgKeys } from './utils/flags';
import { readDefaultValue } from './utils/read-default-value';
import {
  ConfigurationProvider,
  resolveConfiguration,
} from './config-files/configuration-loader';

/**
 * Defines the option configuration passed to {@link ArgvParser.env}.
 */
export type EnvOptionConfig = {
  prefix?: string;
  reflect?: boolean;
  populate?: boolean;
};

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
export type ParserOptions<T extends ParsedArgs = ParsedArgs> = {
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
    parser: ArgvParser<T>
  ) => boolean;
};

export interface ReadonlyArgvParser<TArgs extends ParsedArgs> {
  configuredOptions: Readonly<{ [key in keyof TArgs]: InternalOptionConfig }>;
  configuredPositionals: readonly Readonly<InternalOptionConfig>[];
  options: Readonly<Required<ParserOptions<TArgs>>>;
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
  options: Required<ParserOptions<TArgs>>;

  /**
   * The parsers used to parse individual option types.
   */
  parserMap: Record<string, Parser<any>>;

  private configuredConfigurationProviders: Array<
    ConfigurationProvider<TArgs>
  > = [];

  /**
   * If set, options can be populated from environment variables of the form `${envPrefix}_${optionName}`.
   */
  private envPrefix?: string;
  private shouldReadFromEnv?: boolean;
  private shouldReflectEnv?: boolean;

  /**
   * Creates a new parser. Normally using {@link parser} is preferred.
   * @param options
   */
  constructor(options?: ParserOptions<TArgs>) {
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
  env(envPrefix?: string): typeof this;

  env(options: EnvOptionConfig): typeof this;

  env(a1: EnvOptionConfig | string | undefined) {
    if (typeof a1 === 'object') {
      this.envPrefix = a1.prefix;
      this.shouldReadFromEnv = a1.populate ?? true;
      this.shouldReflectEnv = a1.reflect ?? true;
      return this;
    }
    this.envPrefix = a1;
    this.shouldReadFromEnv = true;
    this.shouldReflectEnv = true;
    return this;
  }

  /**
   * Registers a configuration provider to read configuration from.
   * @param provider The configuration provider to register.
   */
  config(provider: ConfigurationProvider<TArgs>) {
    this.configuredConfigurationProviders.push(provider);
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
          // If env not disabled for this option, and env is enabled for parser
          (configuration.env !== false &&
            !(
              typeof configuration.env === 'object' &&
              configuration.env.populate === false
            ) &&
            this.shouldReadFromEnv) ||
          // OR the env is explicitly enabled for this option, and populate is not disabled
          (configuration.env &&
            !(
              typeof configuration.env === 'object' &&
              configuration.env.populate === false
            ))
        ) {
          const envValue = this.readFromEnv(configuration);
          if (envValue) {
            normalized[configuration.key] = envValue;
          }
        }
        if (normalized[configuration.key] === undefined) {
          const configValue = this.readFromConfig(configuration);
          if (configValue !== undefined) {
            normalized[configuration.key] = configValue;
          }
        }
        if (configuration.default !== undefined) {
          normalized[configuration.key] ??= readDefaultValue(configuration)[0];
        }
      }
      this.reflectEnv(configuration, normalized[configuration.key]);
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
    const envKey = this.getEnvKey(configuration);
    const envValue = process.env[envKey];
    if (envValue) {
      return tryParseValue(this.parserMap[configuration.type], {
        config: configuration,
        tokens: [envValue],
      });
    }
  }

  private reflectEnv(configuration: InternalOptionConfig, value: any) {
    // Skip reflection if:
    if (
      // - Global reflect is disabled, and local reflect is not enabled
      (this.shouldReflectEnv !== true && configuration.env !== true) ||
      // - Local reflect is explicitly disabled
      configuration.env === false ||
      (typeof configuration.env === 'object' &&
        configuration.env.reflect === false)
    ) {
      return;
    }

    const envKey = this.getEnvKey(configuration);
    if (value !== undefined) {
      process.env[envKey] = value;
    }
  }

  private cachedConfigKey: number | undefined;
  private cachedConfig: Partial<TArgs> | null | undefined;

  private getEnvKey(configuration: InternalOptionConfig) {
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
    return envKey;
  }

  private readFromConfig(configuration: InternalOptionConfig) {
    if (
      this.cachedConfig === undefined ||
      this.cachedConfigKey !== this.configuredConfigurationProviders.length
    ) {
      this.cachedConfig = resolveConfiguration(
        process.cwd(),
        this.configuredConfigurationProviders
      );
      this.cachedConfigKey = this.configuredConfigurationProviders.length;
    }
    return this.cachedConfig?.[configuration.key as keyof TArgs];
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

  clone(parserOptions: ParserOptions<TArgs> = this.options) {
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
  if ('choices' in optionConfig && optionConfig.choices) {
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

export function tryParseValue(
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
        return readDefaultValue(input.config)[0];
      }
      throw new Error(`Expected a value for ${input.config.key}`);
    }
    throw e;
  }
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
