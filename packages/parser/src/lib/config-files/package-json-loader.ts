import { inspect } from 'node:util';

import { ConfigurationProvider } from './configuration-loader';
import { getJsonFileConfigLoader } from './json-file-loader';

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
    (json) => json[key]
  );
  (loader as any)[inspect.custom] = () =>
    'PackageJsonConfigurationLoader: ' + key;
  return loader;
}
