import {
  ConfigurationDocSection,
  ConfigurationProvider,
} from './config-files/configuration-loader';
import {
  AggregateConfigProvider,
  AnyConfigProvider,
  ConfigUpdater,
  isAggregateConfigProvider,
} from './config-files/aggregate-config-provider';
import { hideBin } from './helpers';
import {
  LocalizationDictionary,
  LocalizationFunction,
  detectLocale,
  resolveLocalizedText,
} from './localization';
import {
  ArrayOptionConfig,
  BooleanOptionConfig,
  Internal,
  InternalOptionConfig,
  NumberOptionConfig,
  ObjectOptionConfig,
  OptionConfig,
  StringOptionConfig,
  UnknownOptionConfig,
} from './option-types';
import { CommonOptionConfig } from './option-types/common';
import {
  OptionConfigToType,
  ResolveProperties,
} from './option-types/option-config-to-type';
import {
  MakeUndefinedPropertiesOptional,
  WithOptional,
} from './option-types/type-resolution';
import { parserMap } from './parsers/parser-map';
import { NoValueError, Parser, ParserContext } from './parsers/typings';
import {
  fromCamelCaseToDashed,
  fromDashedToCamelCase,
  getEnvKey,
} from './utils/case-transformations';
import { isFlag, isNextFlag, readArgKeys } from './utils/flags';
import { getConfiguredOptionKey } from './utils/get-configured-key';
import { readDefaultValue } from './utils/read-default-value';

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
   * This runs before positional arguments would be matched, allowing it to intercept
   * values that would otherwise be consumed as positionals (e.g. for subcommand parsing).
   * @returns true if the argument was handled, false if it was not
   */
  unmatchedParser?: (
    arg: string,
    tokens: string[],
    parser: ArgvParser<T>
  ) => boolean;

  /**
   * When set to true, throws a validation error if any unmatched arguments are encountered.
   * Unmatched arguments are those that don't match any configured option or positional argument.
   */
  strict?: boolean;

  /**
   * When set to false, skips validation (required checks, choices, conflicts, etc.)
   * while still normalizing options (defaults, env vars, coercion). Useful for
   * best-effort discovery parsing. Defaults to true.
   */
  validate?: boolean;

  /**
   * When set to true (default), automatically allows options to be used with both camelCase and dashed formats.
   * For example, an option named "someFlag" will accept both --someFlag and --some-flag.
   * Set to false to disable this automatic aliasing behavior.
   */
  stripDashed?: boolean;
};

export interface ReadonlyArgvParser<TArgs extends ParsedArgs> {
  configuredOptions: Readonly<{ [key in keyof TArgs]: InternalOptionConfig }>;
  configuredPositionals: readonly Readonly<InternalOptionConfig>[];
  options: Readonly<Required<ParserOptions<TArgs>>>;
  /**
   * Gets the display key for an option, which may be localized.
   * @param key The storage key
   * @returns The localized display key, or the original key if not localized
   */
  getDisplayKey(key: string): string;
  /**
   * Gets the localization dictionary if configured.
   * @returns The localization dictionary, or undefined if not configured
   */
  getLocalizationDictionary(): LocalizationDictionary | undefined;
  /**
   * Gets documentation sections for all configured configuration providers.
   * @returns An array of documentation sections, one per provider that implements describeConfig.
   */
  getConfigurationDocs(): ConfigurationDocSection[];
  updateConfig(valuesOrUpdater: Partial<TArgs> | ConfigUpdater<TArgs>): Promise<void>;
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

  private configuredConfigurationProviders: AnyConfigProvider<TArgs>[] = [];

  /**
   * If set, options can be populated from environment variables of the form `${envPrefix}_${optionName}`.
   */
  private envPrefix?: string;
  private shouldReadFromEnv?: boolean;
  private shouldReflectEnv?: boolean;

  /**
   * Localization dictionary for translating option keys and other text.
   */
  private localizationDictionary?: LocalizationDictionary;
  private localizationLocale?: string;
  private localizationFunction?: LocalizationFunction;

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
      strict: false,
      stripDashed: true,
      validate: true,
      ...options,
    } as Required<ParserOptions<TArgs>>;
    this.parserMap = {
      ...parserMap,
      ...this.options.extraParsers,
    };
  }

  /**
   * Registers a new option with the parser.
   * @param name The name of the option
   * @param config The configuration for the option. See {@link UnknownOptionConfig}
   * @returns Updated parser instance with the new option registered.
   */
  // Object option overload - must come first for proper contextual typing
  // Uses direct ObjectOptionConfig type (not `extends`) to ensure TypeScript
  // infers TProps from `properties` BEFORE evaluating the coerce callback type
  //
  // The return type uses a conditional to check if TCoerce is unknown (no coerce
  // function provided) or a specific type (coerce function provided). This avoids
  // relying on InferCoerce which has issues with optional coerce properties.
  option<
    TOption extends string,
    TCoerce,
    const TProps extends Record<string, { type: string }>
  >(
    name: TOption,
    config: ObjectOptionConfig<TCoerce, TProps>
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          unknown extends TCoerce ? ResolveProperties<TProps> : TCoerce,
          ObjectOptionConfig<TCoerce, TProps>
        >;
      }>
  >;
  // String option overload
  option<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Number option overload
  option<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Boolean option overload
  option<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs & {
      [key in TOption]: OptionConfigToType<TConfig>;
    }
  >;
  // Array option overload
  option<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Generic fallback overload
  option<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }>
  >;
  // Implementation
  option(name: string, config: UnknownOptionConfig): ArgvParser<any> {
    const thisAsNewType = this as any as ArgvParser<any>;

    // Support strip-dashed: add camelCase alias for dashed names
    if (this.options.stripDashed && name.includes('-')) {
      config.alias ??= [];
      const camelCaseName = fromDashedToCamelCase(name);
      if (!config.alias.includes(camelCaseName)) {
        config.alias.push(camelCaseName);
      }
    }

    // Support strip-dashed: add dashed alias for camelCase names
    // Check if the name has uppercase letters (camelCase)
    if (this.options.stripDashed && /[A-Z]/.test(name)) {
      config.alias ??= [];
      const dashedName = fromCamelCaseToDashed(name);
      if (!config.alias.includes(dashedName)) {
        config.alias.push(dashedName);
      }
    }

    // If localization is configured and the key has a localized version,
    // add it as an alias so both the default and localized names work
    const localizedName = this.localizedText(name);
    if (localizedName !== name) {
      config.alias ??= [];
      if (!config.alias.includes(localizedName)) {
        config.alias.push(localizedName);
      }
    }

    const entry = {
      key: name,
      ...config,
    } as InternalOptionConfig;

    thisAsNewType.configuredOptions[name] = entry;
    if (entry.positional) {
      thisAsNewType.configuredPositionals.push(entry);
    }

    return this as any;
  }

  /**
   * Registers a new positional argument with the parser.
   * @param name The name of the positional argument
   * @param config The configuration for the positional argument. See {@link UnknownOptionConfig}
   * @returns Updated parser instance with the new positional argument registered.
   */
  // Object option overload - must come first for proper contextual typing
  // Uses direct ObjectOptionConfig type (not `extends`) to ensure TypeScript
  // infers TProps from `properties` BEFORE evaluating the coerce callback type
  positional<
    TOption extends string,
    TCoerce,
    const TProps extends Record<string, { type: string }>
  >(
    name: TOption,
    config: ObjectOptionConfig<TCoerce, TProps>
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          unknown extends TCoerce ? ResolveProperties<TProps> : TCoerce,
          ObjectOptionConfig<TCoerce, TProps>
        >;
      }>
  >;
  // String option overload
  positional<
    TOption extends string,
    const TConfig extends StringOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Number option overload
  positional<
    TOption extends string,
    const TConfig extends NumberOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Boolean option overload
  positional<
    TOption extends string,
    const TConfig extends BooleanOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Array option overload
  positional<
    TOption extends string,
    const TConfig extends ArrayOptionConfig<any, any>
  >(
    name: TOption,
    config: TConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TConfig>;
      }>
  >;
  // Generic fallback overload
  positional<
    TOption extends string,
    const TOptionConfig extends OptionConfig<any, any, any>
  >(
    name: TOption,
    config: TOptionConfig
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: OptionConfigToType<TOptionConfig>;
      }>
  >;
  // Implementation
  positional(name: string, config: UnknownOptionConfig): ArgvParser<any> {
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
  config(provider: AnyConfigProvider<TArgs>) {
    this.configuredConfigurationProviders.push(provider);
    return this;
  }

  /**
   * Updates configuration values by routing each key to the provider that owns it.
   * Requires that at least one configuration provider has been registered via {@link config}.
   *
   * @param valuesOrUpdater Partial configuration to write, or an updater function
   *   that receives the current merged config and mutates it in place.
   */
  async updateConfig(
    valuesOrUpdater: Partial<TArgs> | ConfigUpdater<TArgs>
  ): Promise<void> {
    if (!this.cachedAggregate) {
      this.cachedAggregate = new AggregateConfigProvider(
        this.configuredConfigurationProviders
      );
      this.cachedAggregate.load(process.cwd());
    }
    return this.cachedAggregate.updateConfig(valuesOrUpdater);
  }

  /**
   * Sets up localization for option keys and other text.
   * When localization is enabled, option keys will be displayed in the specified locale,
   * but the default (non-localized) keys will still be accepted as aliases.
   *
   * @param dictionary The localization dictionary mapping keys to their translations
   * @param locale The target locale (defaults to system locale if not provided)
   * @returns The parser instance for chaining
   *
   * @example
   * ```ts
   * parser()
   *   .localize({
   *     name: { default: 'name', 'es-ES': 'nombre' },
   *     port: { default: 'port', 'es-ES': 'puerto' }
   *   }, 'es-ES')
   *   .option('name', { type: 'string' })
   *   .option('port', { type: 'number' });
   * ```
   */
  localize(dictionary: LocalizationDictionary, locale?: string): this;
  /**
   * Sets up localization using a custom function for translating keys.
   * This allows integration with existing localization libraries like i18next.
   *
   * @param fn A function that takes a key and returns its localized value
   * @returns The parser instance for chaining
   *
   * @example
   * ```ts
   * import i18next from 'i18next';
   *
   * parser()
   *   .localize((key) => i18next.t(key))
   *   .option('name', { type: 'string' })
   *   .option('port', { type: 'number' });
   * ```
   */
  localize(fn: LocalizationFunction): this;
  localize(
    dictionaryOrFn: LocalizationDictionary | LocalizationFunction,
    locale?: string
  ): this {
    if (typeof dictionaryOrFn === 'function') {
      this.localizationFunction = dictionaryOrFn;
      this.localizationDictionary = undefined;
      this.localizationLocale = undefined;
    } else {
      this.localizationDictionary = dictionaryOrFn;
      this.localizationLocale = locale ?? detectLocale();
      this.localizationFunction = undefined;
    }
    return this;
  }

  /**
   * Resolves a key to its localized text value.
   * If no localization is configured, returns the key as-is.
   * @param key The key to localize
   * @returns The localized text, or the original key if not found
   */
  private localizedText(key: string): string {
    if (this.localizationFunction) {
      return this.localizationFunction(key);
    }
    return resolveLocalizedText(
      key,
      this.localizationDictionary,
      this.localizationLocale
    );
  }

  /**
   * Parses an array of arguments into a structured object.
   * @param argv The array of arguments to parse
   * @param alreadyParsed Optional pre-parsed values to seed the result with.
   *   Already-set keys are preserved during parsing (e.g. positionals that
   *   already have a value are skipped). Validation and normalization still
   *   run on the complete result.
   * @returns The parsed arguments
   */
  parse(
    argv: string[] = hideBin(process.argv),
    alreadyParsed?: Record<string, unknown>
  ) {
    const argvClone = [...argv];
    const result: any = {
      ...alreadyParsed,
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
        const keys = readArgKeys(
          maybeArg as `-${string}`,
          this.options.stripDashed
        );
        const configuredKeys = keys.map((key) =>
          getConfiguredOptionKey<TArgs>(key, this.configuredOptions)
        );
        // Deduplicate configured keys to avoid processing the same option twice
        // Filter out undefined values - if ANY key matches, we have a match
        const uniqueConfiguredKeys = Array.from(
          new Set(configuredKeys.filter((key) => key !== undefined))
        );
        // Handles unmatched flags - only unmatched if NONE of the keys match
        if (uniqueConfiguredKeys.length === 0) {
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
        for (const configuredKey of uniqueConfiguredKeys) {
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
        // Try unmatchedParser first (e.g., for subcommand discovery).
        // This allows subcommand tokens to be intercepted before
        // positional matching greedily consumes them.
        if (this.options.unmatchedParser(arg, argvClone, this)) {
          arg = argvClone.shift();
          continue;
        }
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
          result.unmatched.push(arg);
        }
        arg = argvClone.shift();
      }
    }

    if (this.options.validate === false) {
      return this.normalizeOptions(result) as TArgs;
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
      // Apply nested defaults for object options (before coerce)
      if (
        configuration.type === 'object' &&
        normalized[configuration.key] !== undefined
      ) {
        const objectConfig = configuration as ObjectOptionConfig<any, any>;
        if (objectConfig.properties) {
          normalized[configuration.key] = applyNestedObjectDefaults(
            normalized[configuration.key],
            objectConfig
          );
          // Now apply coerce after defaults have been applied
          if (configuration.coerce) {
            normalized[configuration.key] = (
              configuration.coerce as (s: any) => any
            )(normalized[configuration.key]);
          }
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
        // Handle nested object properties
        if (
          configuration.type === 'object' &&
          (configuration as ObjectOptionConfig<any, any>).properties &&
          normalized[configuration.key] !== undefined
        ) {
          normalized[configuration.key] = normalizeAndValidateObjectProperties(
            normalized[configuration.key],
            configuration as ObjectOptionConfig<any, any>,
            configuration.key,
            errors
          );
        }
        if (normalized[configuration.key] !== undefined) {
          validateConflicts(configuration);
          validateImplications(configuration);
        }
      } catch (e: any) {
        delete partial[configuration.key];
        errors.push(e);
      }
    }

    // Validate strict mode - check for unmatched arguments
    if (this.options.strict && result.unmatched?.length) {
      for (const unmatchedArg of result.unmatched) {
        const error = new Error(`Unknown argument: ${unmatchedArg}`);
        delete error.stack;
        errors.push(error);
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
        providedFlag: `--${configuration.key}`,
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
  private cachedAggregate?: AggregateConfigProvider<TArgs>;

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
      this.cachedAggregate = new AggregateConfigProvider(
        this.configuredConfigurationProviders
      );
      this.cachedConfig = this.cachedAggregate.load(process.cwd());
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
   * Enables or disables strict mode. When strict mode is enabled, the parser throws a validation error
   * when unmatched arguments are encountered. Unmatched arguments are those that don't match any
   * configured option or positional argument.
   * @param enable Whether to enable strict mode. Defaults to true.
   * @returns The parser instance for method chaining.
   */
  strict(enable = true) {
    this.options.strict = enable;
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
    clone.localizationDictionary = this.localizationDictionary;
    clone.localizationLocale = this.localizationLocale;
    clone.localizationFunction = this.localizationFunction;
    clone.envPrefix = this.envPrefix;
    clone.shouldReadFromEnv = this.shouldReadFromEnv;
    clone.shouldReflectEnv = this.shouldReflectEnv;
    clone.configuredConfigurationProviders = [
      ...this.configuredConfigurationProviders,
    ];

    return clone;
  }

  asReadonly(): ReadonlyArgvParser<TArgs> {
    return this;
  }

  /**
   * Gets the display key for an option, which may be localized.
   * @param key The storage key
   * @returns The localized display key, or the original key if not localized
   */
  getDisplayKey(key: string): string {
    return this.localizedText(key);
  }

  /**
   * Gets the localization dictionary if configured.
   * @returns The localization dictionary, or undefined if not configured
   */
  getLocalizationDictionary(): LocalizationDictionary | undefined {
    return this.localizationDictionary;
  }

  /**
   * Gets documentation sections for all configured configuration providers.
   * @returns An array of documentation sections, one per provider that implements describeConfig.
   */
  getConfigurationDocs(): ConfigurationDocSection[] {
    const sections: ConfigurationDocSection[] = [];
    for (const provider of this.configuredConfigurationProviders) {
      if (isAggregateConfigProvider(provider)) {
        sections.push(...provider.describeConfig());
      } else if (provider.describeConfig) {
        sections.push(provider.describeConfig());
      }
    }
    return sections;
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

function validateOption<TConfig extends Internal<UnknownOptionConfig>, TVal>(
  optionConfig: TConfig,
  value: TVal
) {
  if ('choices' in optionConfig && optionConfig.choices) {
    const choices = [
      ...new Set<TVal>(
        [
          typeof optionConfig.choices === 'function'
            ? optionConfig.choices()
            : optionConfig.choices,
        ].flat() as TVal[]
      ),
    ];
    optionConfig.validate ??= () => true;
    optionConfig.validate = (val: TVal | TVal[]) => {
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
  if (optionConfig.validate && value != undefined) {
    value;
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
    // For object types, defer coerce until after nested defaults are applied
    // For other types, apply coerce immediately
    if (input.config.type === 'object') {
      return val;
    }
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

/**
 * Applies default values to nested properties of an object option recursively.
 * This is called during normalization, before coerce is applied.
 * This function is only called when the parent object exists (has at least one property set).
 * @param value The current value of the object
 * @param config The object option configuration
 * @returns The object with defaults applied to nested properties
 */
function applyNestedObjectDefaults(
  value: Record<string, any>,
  config: ObjectOptionConfig<any, any>
): Record<string, any> {
  const normalized = { ...value };

  for (const propKey in config.properties) {
    const propConfig = config.properties[propKey];

    // Apply defaults for undefined properties
    if (normalized[propKey] === undefined && propConfig.default !== undefined) {
      normalized[propKey] = readDefaultValue(propConfig)[0];
    }

    // Recursively handle nested objects
    if (
      propConfig.type === 'object' &&
      'properties' in propConfig &&
      normalized[propKey] !== undefined
    ) {
      normalized[propKey] = applyNestedObjectDefaults(
        normalized[propKey],
        propConfig
      );
    }
  }

  return normalized;
}

/**
 * Validates nested properties of an object option recursively.
 * This is called during validation, after defaults have been applied and before coerce.
 * Checks required properties at any depth.
 * @param value The current value of the object
 * @param config The object option configuration
 * @param keyPath The path to this property for error messages
 * @param errors Array to collect validation errors
 * @returns The validated value
 */
function normalizeAndValidateObjectProperties(
  value: Record<string, any> | undefined,
  config: ObjectOptionConfig<any, any>,
  keyPath: string,
  errors: Error[]
): Record<string, any> | undefined {
  // If the object is undefined and not required, skip processing
  if (value === undefined) {
    return value;
  }

  const normalized = { ...value };

  for (const propKey in config.properties) {
    const propConfig = config.properties[propKey];
    const propPath = `${keyPath}.${propKey}`;

    // Validate required properties
    if (propConfig.required && normalized[propKey] === undefined) {
      const e = new Error(`Missing required option ${propPath}`);
      delete e.stack;
      errors.push(e);
    }

    // Recursively handle nested objects
    if (propConfig.type === 'object' && 'properties' in propConfig) {
      normalized[propKey] = normalizeAndValidateObjectProperties(
        normalized[propKey],
        propConfig,
        propPath,
        errors
      );
    }
  }

  return normalized;
}
