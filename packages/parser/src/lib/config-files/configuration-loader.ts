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
 */
export type ConfigurationProvider<T> = {
  /**
   * A function that searches for a configuration file in the given directory and returns the path to the file.
   * Should handle being passed either a directory to search, or a file to check.
   * @param configurationRoot
   * @returns The path to the configuration file, or undefined if no applicable file was found.
   */
  resolve: (configurationRoot: string) => string | undefined;

  /**
   * A function that loads the configuration from the given file.
   * @param filename The path to the configuration file (resolved by {@link ConfigurationProvider#resolve}).
   * @returns The loaded configuration object.
   */
  load: (filename: string) => T & { extends?: string };

  /**
   * Updates the configuration file managed by this provider.
   * Accepts either a full configuration object to write, or an updater function
   * that receives the current configuration and returns the new configuration.
   *
   * @param configOrUpdater A configuration object to write, or a function that receives the current config and returns the updated config.
   */
  updateConfig?: (
    configOrUpdater: T | ((current: T) => T | Promise<T>)
  ) => Promise<void>;

  /**
   * Returns structured documentation describing how this provider resolves and loads configuration.
   * Each provider knows its own semantics (file traversal, key extraction, transforms)
   * and can describe them more accurately than a generic renderer.
   */
  describeConfig?: () => ConfigurationDocSection;
};
