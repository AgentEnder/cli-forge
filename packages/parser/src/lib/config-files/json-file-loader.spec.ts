import { describe, it, expect } from 'vitest';
import {
  getJsonFileConfigLoader,
  JsonFileConfigLoader,
} from './json-file-loader.js';
import { isAggregateConfigProvider } from './aggregate-config-provider.js';

describe('getJsonFileConfigLoader', () => {
  it('should return a ConfigurationProvider for a single filename', () => {
    const loader = getJsonFileConfigLoader('config.json');
    expect(isAggregateConfigProvider(loader)).toBe(false);
    expect(loader).toHaveProperty('resolve');
  });

  it('should return an AggregateConfigProvider for multiple filenames', () => {
    const loader = getJsonFileConfigLoader(['config.json', 'alt.config.json']);
    expect(isAggregateConfigProvider(loader)).toBe(true);
  });

  it('should construct multiple leaf providers for multiple filenames', () => {
    const loaders = new JsonFileConfigLoader({
      filename: ['config.json', 'alt.config.json'],
    });

    expect(Array.isArray(loaders)).toBe(true);
    expect(loaders).toHaveLength(2);
    expect(loaders[0]).toHaveProperty('resolve');
    expect(isAggregateConfigProvider(loaders[0])).toBe(false);
  });
});
