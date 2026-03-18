import { existsSync, readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { inspect } from 'util';

import {
  ConfigurationDocSection,
  ConfigurationProvider,
} from './configuration-loader.js';
import { traverseForFile } from './utils.js';

/**
 * A factory function to create simple configuration providers that load configuration from a JSON file.
 * @param filename The filename (or array of possible filenames) of the JSON file to load.
 *   When an array is provided, the resolver checks all candidates at each directory level
 *   before traversing upward, so the nearest matching file always wins.
 * @param transform The function to transform the loaded JSON object into the desired configuration object.
 * @param writeTransform A function that merges the updated config back into the full JSON structure.
 *   Receives the current full JSON and the new config value, and returns the full JSON to write.
 *   Required for `updateConfig` when a read `transform` is used.
 * @returns A `{@link ConfigurationProvider}` that loads configuration from the specified JSON file.
 */
export function getJsonFileConfigLoader<T>(
  filename: string | string[],
  transform?: (json: any) => T,
  writeTransform?: (json: any, config: T) => any
): ConfigurationProvider<T> {
  const filenames = Array.isArray(filename) ? filename : [filename];

  function loadJsonFile(filepath: string) {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  }

  class JsonFileConfigLoader {
    resolve(configurationRoot: string) {
      if (filenames.length === 1) {
        const nearestFile = traverseForFile(filenames[0], configurationRoot);
        if (nearestFile && nearestFile.endsWith('.json')) {
          return nearestFile;
        }
        return undefined;
      }

      // Check all candidates at each directory level before traversing upward,
      // so the nearest matching file wins regardless of its position in the array.
      let prev: string | undefined;
      let current = configurationRoot;
      while (prev !== current) {
        prev = current;
        for (const name of filenames) {
          const testPath = join(current, name);
          if (existsSync(testPath) && testPath.endsWith('.json')) {
            return testPath;
          }
        }
        current = dirname(current);
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

      const resolvedPath = this.resolve(process.cwd());
      if (!resolvedPath) {
        throw new Error(
          `Could not resolve configuration file "${filenames.join(', ')}" from ${process.cwd()}`
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

      await writeFile(resolvedPath, JSON.stringify(outputJson, null, 2) + '\n');
    }

    describeConfig(): ConfigurationDocSection {
      const fileList = filenames.map((f) => `\`${f}\``).join(', ');
      const parts: string[] = [
        filenames.length > 1
          ? `Searches for one of: ${fileList}`
          : `Searches for ${fileList}`,
        'Resolution walks up the directory tree from the working directory, using the nearest match.',
      ];
      if (transform) {
        parts.push(
          'A transform is applied to extract configuration from the file.'
        );
      }
      parts.push('Supports `"extends"` for configuration inheritance.');
      return {
        heading: `JSON File: ${filenames.join(', ')}`,
        body: parts.join('\n\n'),
      };
    }

    [inspect.custom]() {
      return 'JsonFileConfigLoader: ' + filenames.join(', ');
    }
  }

  return new JsonFileConfigLoader();
}
