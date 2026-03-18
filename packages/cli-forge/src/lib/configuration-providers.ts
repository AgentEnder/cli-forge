import { ConfigurationFiles } from '@cli-forge/parser';

let md: typeof import('markdown-factory') | undefined;
try {
  // markdown-factory is an optional peer dependency
  md = require('markdown-factory');
} catch {
  // not available
}

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
   * @param filename The filename (or array of possible filenames) of the JSON file to load.
   *   When an array is provided, the nearest matching file wins.
   * @param key The key in the JSON file to load as configuration. By default, the entire JSON object is loaded.
   */
  JsonFile<T>(filename: string | string[], key?: string) {
    const loader = ConfigurationFiles.getJsonFileConfigLoader<T>(
      filename,
      key ? (json) => json[key] : undefined,
      key ? (json, config) => ({ ...json, [key]: config }) : undefined
    );
    if (key) {
      const filenames = Array.isArray(filename) ? filename : [filename];
      const fileList = filenames.join(', ');
      loader.describeConfig = () => {
        const heading = `JSON File: ${fileList} (key: "${key}")`;
        if (md) {
          return {
            heading,
            body: md.lines(
              filenames.length > 1
                ? `Searches for one of: ${filenames.map((f) => md.code(f)).join(', ')}`
                : `Searches for ${md.code(filenames[0])}`,
              'Resolution walks up the directory tree from the working directory, using the nearest match.',
              `Reads the ${md.code(`"${key}"`)} key from the JSON file.`,
              `Supports ${md.code('"extends"')} for configuration inheritance.`,
              '',
              md.bold('Example:'),
              md.codeBlock(
                JSON.stringify({ [key]: { option: 'value' } }, null, 2),
                'json'
              )
            ),
          };
        }
        return {
          heading,
          body: [
            filenames.length > 1
              ? `Searches for one of: ${fileList}`
              : `Searches for ${filenames[0]}`,
            'Resolution walks up the directory tree from the working directory, using the nearest match.',
            `Reads the "${key}" key from the JSON file.`,
            'Supports "extends" for configuration inheritance.',
          ].join('\n\n'),
        };
      };
    }
    return loader;
  },
};
