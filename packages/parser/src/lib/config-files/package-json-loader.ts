import { inspect } from 'node:util';

import { ConfigurationProvider } from './configuration-loader.js';
import {
  getJsonFileConfigLoader,
  JsonFileConfigLoader,
} from './json-file-loader.js';

/**
 * Options for constructing a {@link PackageJsonConfigLoader}.
 */
export type PackageJsonConfigLoaderOptions = {
  /**
   * The key in the package.json file to load as configuration.
   */
  key: string;
};

/**
 * A configuration provider that loads configuration from a key in a `package.json` file.
 * Internally delegates to a {@link JsonFileConfigLoader} with appropriate transforms.
 */
export class PackageJsonConfigLoader<T>
  implements ConfigurationProvider<T, string | URL>
{
  private readonly inner: JsonFileConfigLoader<T>;
  private readonly key: string;

  constructor(options: PackageJsonConfigLoaderOptions) {
    this.key = options.key;
    this.inner = new JsonFileConfigLoader<T>({
      filename: 'package.json',
      transform: (json) => json[this.key],
      writeTransform: (json, config) => ({ ...json, [this.key]: config }),
    });
  }

  resolve(configurationRoot: string) {
    return this.inner.resolve(configurationRoot);
  }

  load(filename: string | URL) {
    return this.inner.load(filename);
  }

  async updateConfig(
    configOrUpdater: T | ((current: T) => T | Promise<T>),
    options?: { targetPath?: string | URL }
  ) {
    return this.inner.updateConfig(configOrUpdater, options);
  }

  describeConfig() {
    return {
      heading: `package.json (key: "${this.key}")`,
      body: [
        `Reads the \`"${this.key}"\` key from the nearest \`package.json\` file.`,
        'Resolution walks up the directory tree from the working directory.',
        '',
        '**Example:**',
        '```json',
        JSON.stringify({ [this.key]: { option: 'value' } }, null, 2),
        '```',
      ].join('\n'),
    };
  }

  [inspect.custom]() {
    return 'PackageJsonConfigurationLoader: ' + this.key;
  }
}

/**
 * A factory function to create a configuration provider that loads configuration from a package.json file.
 * @param key The key in the package.json file to load as configuration.
 * @returns A `{@link ConfigurationProvider}` that loads configuration from the specified package.json file.
 */
export function getPackageJsonConfigurationLoader<T>(
  key: string
): ConfigurationProvider<T> {
  return new PackageJsonConfigLoader<T>({ key });
}
