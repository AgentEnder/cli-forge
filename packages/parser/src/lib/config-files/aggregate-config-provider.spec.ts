import { describe, it, expect } from 'vitest';
import { AggregateConfigProvider, isAggregateConfigProvider } from './aggregate-config-provider';
import { ConfigurationProvider } from './configuration-loader';

describe('AggregateConfigProvider', () => {
  describe('isAggregateConfigProvider', () => {
    it('should return true for AggregateConfigProvider instances', () => {
      const aggregate = new AggregateConfigProvider([]);
      expect(isAggregateConfigProvider(aggregate)).toBe(true);
    });

    it('should return false for regular ConfigurationProvider instances', () => {
      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
      };
      expect(isAggregateConfigProvider(provider)).toBe(false);
    });
  });
});
