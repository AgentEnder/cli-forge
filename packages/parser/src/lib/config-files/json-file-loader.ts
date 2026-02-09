import { readFileSync } from 'fs';
import { inspect } from 'util';

import { ConfigurationProvider } from './configuration-loader.js';
import { traverseForFile } from './utils.js';

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
    resolve(configurationRoot: string) {
      const nearestFile = traverseForFile(filename, configurationRoot);
      if (!nearestFile || !nearestFile.endsWith('.json')) {
        return undefined;
      }
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
