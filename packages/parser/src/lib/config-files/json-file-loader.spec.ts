import { describe, it, expect } from 'vitest';
import { getJsonFileConfigLoader } from './json-file-loader.js';
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
});
