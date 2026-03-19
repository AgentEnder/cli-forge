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
   * Load configuration from a JSON file (or files).
   *
   * @param filename The filename (or array of possible filenames) of the JSON file to load.
   *   When an array is provided, each filename gets its own provider wrapped in an aggregate.
   * @param key The key in the JSON file to load as configuration. By default, the entire JSON object is loaded.
   */
  JsonFile<T>(
    filename: string | string[],
    key?: string
  ): ConfigurationFiles.AnyConfigProvider<T> {
    const transform = key ? (json: any) => json[key] : undefined;
    const writeTransform = key
      ? (json: any, config: T) => ({ ...json, [key]: config })
      : undefined;

    if (Array.isArray(filename)) {
      const aggregate = ConfigurationFiles.getJsonFileConfigLoader<T>(
        filename,
        transform,
        writeTransform
      );
      if (key) {
        for (let i = 0; i < aggregate.providers.length; i++) {
          const provider = aggregate.providers[i];
          if (!ConfigurationFiles.isAggregateConfigProvider(provider)) {
            applyKeyDescribeConfig(provider, filename[i], key);
          }
        }
      }
      return aggregate;
    }

    const loader = ConfigurationFiles.getJsonFileConfigLoader<T>(
      filename,
      transform,
      writeTransform
    );
    if (key) {
      applyKeyDescribeConfig(loader, filename, key);
    }
    return loader;
  },
};

function applyKeyDescribeConfig<T>(
  loader: ConfigurationFiles.ConfigurationProvider<T>,
  filename: string,
  key: string
) {
  loader.describeConfig = () => {
    const heading = `JSON File: ${filename} (key: "${key}")`;
    if (md) {
      return {
        heading,
        body: md.lines(
          `Searches for ${md.code(filename)}`,
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
        `Searches for ${filename}`,
        'Resolution walks up the directory tree from the working directory, using the nearest match.',
        `Reads the "${key}" key from the JSON file.`,
        'Supports "extends" for configuration inheritance.',
      ].join('\n\n'),
    };
  };
}
