import { join } from 'path';

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
};

// Runs all the configuration loaders in order to resolve the configuration file.
// Recurses if the configuration file extends another configuration file.
export function resolveConfiguration<T>(
  configurationRoot: string,
  loaders: ConfigurationProvider<T>[]
): T {
  function loadConfiguration(
    filename: string,
    provider: ConfigurationProvider<T>
  ): T {
    const loaded = provider.load(filename);
    if (loaded.extends) {
      const extended = resolveConfiguration(
        loaded.extends.startsWith('.')
          ? join(configurationRoot, loaded.extends)
          : loaded.extends,
        loaders
      );
      return { ...extended, ...loaded };
    }
    return loaded;
  }

  let combined: T = {} as T;
  for (const loader of loaders) {
    const filename = loader.resolve(configurationRoot);
    if (filename) {
      combined = {
        ...loadConfiguration(filename, loader),
        ...combined,
      };
    }
  }
  return combined;
}
