import { ConfigurationFiles } from '@cli-forge/parser';

/**
 * A collection of built-in configuration provider factories. These should be invoked and passed to
 * {@link CLI.config} to load configuration from various sources. For custom configuration providers, see
 * https://craigory.dev/cli-forge/api/parser/namespaces/ConfigurationFiles/type-aliases/ConfigurationProvider
 *
 * @example
 * ```typescript
 * import { cli, ConfigurationProviders } from 'cli-forge';
 *
 * cli(...).config(ConfigurationProviders.PackageJson('myConfig'));
 * ```
 */
export const ConfigurationProviders = {
  /**
   * Load configuration from a package.json file.
   *
   * @param key The key in the package.json file to load as configuration.
   */
  PackageJson<T>(key: string) {
    return ConfigurationFiles.getPackageJsonConfigurationLoader<T>(key);
  },

  /**
   * Load configuration from a JSON file.
   *
   * @param filename The filename of the JSON file to load.
   * @param key The key in the JSON file to load as configuration. By default, the entire JSON object is loaded.
   */
  JsonFile<T>(filename: string, key?: string) {
    return ConfigurationFiles.getJsonFileConfigLoader<T>(filename, (json) =>
      key ? json[key] : json
    );
  },
};
