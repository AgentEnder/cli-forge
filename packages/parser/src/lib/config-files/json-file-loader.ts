let _readFileSync: ((path: string, encoding: string) => string) | undefined;
let _writeFile: ((path: string, data: string) => Promise<void>) | undefined;
let _inspect: { custom?: symbol } | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _readFileSync = require('fs').readFileSync;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _writeFile = require('fs/promises').writeFile;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _inspect = require('util').inspect;
} catch {
  // Running in a browser environment — JSON file loading is unavailable.
}

import {
  AggregateConfigProvider,
  AnyConfigProvider,
} from './aggregate-config-provider.js';
import {
  ConfigurationDocSection,
  ConfigurationProvider,
} from './configuration-loader.js';
import { traverseForFile } from './utils.js';

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
    const providers = filename.map((f) =>
      getJsonFileConfigLoader(f, transform, writeTransform)
    );
    return new AggregateConfigProvider(providers);
  }

  const singleFilename: string = filename;

  function loadJsonFile(filepath: string) {
    if (!_readFileSync) {
      throw new Error('Configuration file loading is not available in this environment.');
    }
    return JSON.parse(_readFileSync(filepath, 'utf-8'));
  }

  class JsonFileConfigLoader {
    resolve(configurationRoot: string) {
      const nearestFile = traverseForFile(singleFilename, configurationRoot);
      if (nearestFile && nearestFile.endsWith('.json')) {
        return nearestFile;
      }
      return undefined;
    }

    load(jsonFile: string) {
      const json = loadJsonFile(jsonFile);
      if (transform) {
        return transform(json);
      }
      return json;
    }

    async updateConfig(
      configOrUpdater: T | ((current: T) => T | Promise<T>)
    ): Promise<void> {
      if (transform && !writeTransform) {
        throw new Error(
          'Cannot update config when read transform is supplied without a write transform, doing so would set the untrasnformed file structure to the transformed structure, instead of updating it in place.'
        );
      }

      const resolvedPath = this.resolve(typeof process !== 'undefined' ? process.cwd() : '/');
      if (!resolvedPath) {
        throw new Error(
          `Could not resolve configuration file "${singleFilename}" from ${typeof process !== 'undefined' ? process.cwd() : '/'}`
        );
      }

      const fullJson = loadJsonFile(resolvedPath);
      const currentConfig = transform ? transform(fullJson) : fullJson;

      const newConfig =
        typeof configOrUpdater === 'function'
          ? await (configOrUpdater as (current: T) => T | Promise<T>)(
              currentConfig
            )
          : configOrUpdater;

      const outputJson =
        writeTransform && transform
          ? writeTransform(fullJson, newConfig)
          : newConfig;

      if (!_writeFile) {
        throw new Error('Configuration file writing is not available in this environment.');
      }
      await _writeFile(resolvedPath, JSON.stringify(outputJson, null, 2) + '\n');
    }

    describeConfig(): ConfigurationDocSection {
      const parts: string[] = [
        `Searches for \`${singleFilename}\``,
        'Resolution walks up the directory tree from the working directory, using the nearest match.',
      ];
      if (transform) {
        parts.push(
          'A transform is applied to extract configuration from the file.'
        );
      }
      parts.push('Supports `"extends"` for configuration inheritance.');
      return {
        heading: `JSON File: ${singleFilename}`,
        body: parts.join('\n\n'),
      };
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
      return 'JsonFileConfigLoader: ' + singleFilename;
    }
  }

  return new JsonFileConfigLoader();
}
