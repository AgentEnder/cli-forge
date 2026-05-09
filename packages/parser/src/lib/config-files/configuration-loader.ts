/**
 * A structured section of configuration documentation produced by a provider.
 * Each section has a heading and a markdown body string.
 */
export type ConfigurationDocSection = {
  /** The heading for this documentation section (e.g., "JSON File: app.config.json") */
  heading: string;
  /** Markdown-formatted body describing how this provider loads configuration. */
  body: string;
};

/**
 * Implement this type to create a custom configuration provider.
 *
 * @typeParam T The configuration object type.
 * @typeParam TLocation The type used to represent file paths. Defaults to `string | URL`.
 *   Providers that only work with filesystem paths can narrow this to `string`.
 *   ESM-friendly providers should keep the default to support `file://` URLs.
 */
export type ConfigurationProvider<T, TLocation = string | URL> = {
  /**
   * A function that searches for a configuration file in the given directory and returns the path to the file.
   * Should handle being passed either a directory to search, or a file to check.
   * @param configurationRoot
   * @returns The path to the configuration file, or undefined if no applicable file was found.
   */
  resolve: (configurationRoot: string) => TLocation | undefined;

  /**
   * A function that loads the configuration from the given file.
   * @param filename The path to the configuration file (resolved by {@link ConfigurationProvider#resolve}).
   * @returns The loaded configuration object.
   */
  load: (filename: TLocation) => T & { extends?: string };

  /**
   * Updates the configuration file managed by this provider.
   * Accepts either a full configuration object to write, or an updater function
   * that receives the current configuration and returns the new configuration.
   *
   * @param configOrUpdater A configuration object to write, or a function that receives the current config and returns the updated config.
   * @param options Optional settings for the update.
   * @param options.targetPath When provided by the framework (e.g., from a resolved `default` config option),
   *   the provider should write to this path instead of using {@link resolve}. If the file does not exist,
   *   the provider should create it (including parent directories).
   */
  updateConfig?: (
    configOrUpdater: T | ((current: T) => T | Promise<T>),
    options?: { targetPath?: TLocation }
  ) => Promise<void>;

  /**
   * Returns structured documentation describing how this provider resolves and loads configuration.
   * Each provider knows its own semantics (file traversal, key extraction, transforms)
   * and can describe them more accurately than a generic renderer.
   */
  describeConfig?: () => ConfigurationDocSection;
};

/**
 * Extracts the `TLocation` type parameter from a {@link ConfigurationProvider}.
 */
export type ExtractLocation<P> = P extends ConfigurationProvider<any, infer TLoc>
  ? TLoc
  : string | URL;

/**
 * A default config path specification. Used as a framework-level option in `.config()` calls
 * to specify where a config file should be created when none exists on disk.
 *
 * - Static value: a path or URL to use directly.
 * - Function: called lazily; return `null` to fall through to the next provider.
 *
 * @typeParam TLocation The location type (usually `string | URL`).
 */
export type DefaultConfig<TLocation = string | URL> =
  | TLocation
  | (() => TLocation | null | Promise<TLocation | null>);

/**
 * A map of named configuration locations registered for a single `.config()` call.
 *
 * Each entry's value is a {@link DefaultConfig} — a static path/URL or a callback
 * that resolves the path lazily (sync or async). Callbacks returning `null` are
 * skipped during reads and fall through during writes.
 *
 * Named locations are scanned during read in declaration order *after* the
 * provider's walk-upward result. Per-option `defaultConfigLocation` and the
 * provider's `defaultLocation` reference these names by key for write routing.
 *
 * @typeParam TLocation The location type (usually `string | URL`).
 */
export type NamedConfigLocations<TLocation = string | URL> = {
  readonly [name: string]: DefaultConfig<TLocation>;
};
