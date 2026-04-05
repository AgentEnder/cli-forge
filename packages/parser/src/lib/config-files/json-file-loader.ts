import { inspect } from 'node:util';

import {
  getEnvironmentProvider,
  getFileSystemProvider,
} from '../environment-provider.js';
import {
  AggregateConfigProvider,
  AnyConfigProvider,
} from './aggregate-config-provider.js';
import {
  ConfigurationDocSection,
  ConfigurationProvider,
} from './configuration-loader.js';
import { toFilePath, traverseForFile } from './utils.js';

/**
 * Options for constructing a {@link JsonFileConfigLoader}.
 */
export type JsonFileConfigLoaderOptions<T> = {
  /**
   * The filename (or array of filenames) to search for.
   * When multiple filenames are provided, `resolve` tries each in order
   * and returns the first match found while walking up the directory tree.
   */
  filename: string | string[];
  /**
   * Optional transform applied when loading — extracts the desired config shape from the raw JSON.
   */
  transform?: (json: any) => T;
  /**
   * A function that merges the updated config back into the full JSON structure.
   * Required for `updateConfig` when a read `transform` is used.
   */
  writeTransform?: (json: any, config: T) => any;
};

function loadJsonFile(filepath: string) {
  const fs = getFileSystemProvider();
  return JSON.parse(fs.readFileSync(filepath));
}

/**
 * A configuration provider that loads configuration from a JSON file.
 * Supports multiple candidate filenames and `file://` URLs.
 */
export class JsonFileConfigLoader<T>
  implements ConfigurationProvider<T, string | URL>
{
  private readonly filenames: string[];
  private readonly transform?: (json: any) => T;
  private readonly writeTransform?: (json: any, config: T) => any;

  constructor(options: JsonFileConfigLoaderOptions<T>) {
    this.filenames = Array.isArray(options.filename)
      ? options.filename
      : [options.filename];
    this.transform = options.transform;
    this.writeTransform = options.writeTransform;
  }

  resolve(configurationRoot: string): string | undefined {
    for (const filename of this.filenames) {
      const nearestFile = traverseForFile(filename, configurationRoot);
      if (nearestFile && nearestFile.endsWith('.json')) {
        return nearestFile;
      }
    }
    return undefined;
  }

  load(jsonFile: string | URL) {
    const filePath = toFilePath(jsonFile);
    const json = loadJsonFile(filePath);
    if (this.transform) {
      return this.transform(json) as T & { extends?: string };
    }
    return json as T & { extends?: string };
  }

  async updateConfig(
    configOrUpdater: T | ((current: T) => T | Promise<T>),
    options?: { targetPath?: string | URL }
  ): Promise<void> {
    if (this.transform && !this.writeTransform) {
      throw new Error(
        'Cannot update config when read transform is supplied without a write transform, doing so would set the untransformed file structure to the transformed structure, instead of updating it in place.'
      );
    }

    const env = getEnvironmentProvider();
    const fs = getFileSystemProvider();
    const resolvedPath = options?.targetPath
      ? toFilePath(options.targetPath)
      : this.resolve(env.cwd());

    if (!resolvedPath) {
      throw new Error(
        `Could not resolve configuration file "${this.filenames.join(', ')}" from ${env.cwd()}`
      );
    }

    const fileExists = fs.existsSync(resolvedPath);

    // When targetPath is provided and file doesn't exist, start from empty
    const fullJson = fileExists ? loadJsonFile(resolvedPath) : {};
    const currentConfig = this.transform ? this.transform(fullJson) : fullJson;

    const newConfig =
      typeof configOrUpdater === 'function'
        ? await (configOrUpdater as (current: T) => T | Promise<T>)(
            currentConfig
          )
        : configOrUpdater;

    const outputJson =
      this.writeTransform && this.transform
        ? this.writeTransform(fullJson, newConfig)
        : newConfig;

    // Ensure parent directories exist when creating a new file
    if (!fileExists) {
      fs.mkdirSync(fs.dirname(resolvedPath), { recursive: true });
    }

    await fs.writeFile(resolvedPath, JSON.stringify(outputJson, null, 2) + '\n');
  }

  describeConfig(): ConfigurationDocSection {
    const filenameDisplay =
      this.filenames.length === 1
        ? `\`${this.filenames[0]}\``
        : this.filenames.map((f) => `\`${f}\``).join(', ');
    const parts: string[] = [
      `Searches for ${filenameDisplay}`,
      'Resolution walks up the directory tree from the working directory, using the nearest match.',
    ];
    if (this.filenames.length > 1) {
      parts.push('Filenames are tried in order; the first match wins.');
    }
    if (this.transform) {
      parts.push(
        'A transform is applied to extract configuration from the file.'
      );
    }
    parts.push('Supports `"extends"` for configuration inheritance.');
    return {
      heading: `JSON File: ${this.filenames.join(', ')}`,
      body: parts.join('\n\n'),
    };
  }

  [inspect.custom]() {
    return 'JsonFileConfigLoader: ' + this.filenames.join(', ');
  }
}

/**
 * A factory function to create simple configuration providers that load configuration from a JSON file.
 * @param filename The filename of the JSON file to load.
 * @param transform The function to transform the loaded JSON object into the desired configuration object.
 * @param writeTransform A function that merges the updated config back into the full JSON structure.
 *   Receives the current full JSON and the new config value, and returns the full JSON to write.
 *   Required for `updateConfig` when a read `transform` is used.
 * @returns A `{@link ConfigurationProvider}` that loads configuration from the specified JSON file.
 */
export function getJsonFileConfigLoader<T>(
  filename: string,
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): ConfigurationProvider<T>;
/**
 * A factory function to create an aggregate configuration provider that wraps
 * individual single-file loaders for each filename.
 * @param filename An array of possible filenames to load.
 * @param transform The function to transform the loaded JSON object into the desired configuration object.
 * @param writeTransform A function that merges the updated config back into the full JSON structure.
 * @returns An `{@link AggregateConfigProvider}` wrapping individual loaders.
 */
export function getJsonFileConfigLoader<T>(
  filename: string[],
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): AggregateConfigProvider<T>;
export function getJsonFileConfigLoader<T>(
  filename: string | string[],
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): AnyConfigProvider<T> {
  if (Array.isArray(filename)) {
    const providers = filename.map(
      (f) =>
        new JsonFileConfigLoader<T>({ filename: f, transform, writeTransform })
    );
    return new AggregateConfigProvider(providers);
  }

  return new JsonFileConfigLoader<T>({
    filename,
    transform,
    writeTransform,
  });
}
