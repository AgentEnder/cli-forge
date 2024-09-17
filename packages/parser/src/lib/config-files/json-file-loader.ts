import { readFileSync } from 'fs';
import { inspect } from 'util';

import { ConfigurationProvider } from './configuration-loader';
import { traverseForFile } from './utils';

/**
 * A factory function to create simple configuration providers that load configuration from a JSON file.
 * @param filename The filename of the JSON file to load.
 * @param transform The function to transform the loaded JSON object into the desired configuration object.
 * @returns A `{@link ConfigurationProvider}` that loads configuration from the specified JSON file.
 */
export function getJsonFileConfigLoader<T>(
  filename: string,
  transform?: (json: any) => T
): ConfigurationProvider<T> {
  function loadJsonFile(filepath: string) {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  }

  class JsonFileConfigLoader {
    private seen = new Set<string>();

    resolve(configurationRoot: string) {
      const nearestFile = traverseForFile(filename, configurationRoot);
      if (!nearestFile || !nearestFile.endsWith('.json')) {
        return undefined;
      }
      if (this.seen.has(nearestFile)) {
        throw new Error(
          `Circular reference detected in configuration file: ${nearestFile}. This is likely caused by an "extends" property pointing to a directory which doesn't contain a configuration file.`
        );
      }
      this.seen.add(nearestFile);
      return nearestFile;
    }

    load(jsonFile: string) {
      const json = loadJsonFile(jsonFile);
      if (transform) {
        return transform(json);
      }
      return json;
    }

    [inspect.custom]() {
      return 'JsonFileConfigLoader: ' + filename;
    }
  }

  return new JsonFileConfigLoader();
}
