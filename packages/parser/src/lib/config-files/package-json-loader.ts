import { inspect } from 'node:util';

import { ConfigurationProvider } from './configuration-loader.js';
import { getJsonFileConfigLoader } from './json-file-loader.js';

/**
 * A factory function to create a configuration provider that loads configuration from a package.json file.
 * @param key The key in the package.json file to load as configuration.
 * @returns A `{@link ConfigurationProvider}` that loads configuration from the specified package.json file.
 */
export function getPackageJsonConfigurationLoader<T>(
  key: string
): ConfigurationProvider<T> {
  const loader = getJsonFileConfigLoader<T>(
    'package.json',
    (json) => json[key],
    (json, config) => ({ ...json, [key]: config })
  );
  (loader as any)[inspect.custom] = () =>
    'PackageJsonConfigurationLoader: ' + key;
  loader.describeConfig = () => ({
    heading: `package.json (key: "${key}")`,
    body: [
      `Reads the \`"${key}"\` key from the nearest \`package.json\` file.`,
      'Resolution walks up the directory tree from the working directory.',
      '',
      '**Example:**',
      '```json',
      JSON.stringify({ [key]: { option: 'value' } }, null, 2),
      '```',
    ].join('\n'),
  });
  return loader;
}
