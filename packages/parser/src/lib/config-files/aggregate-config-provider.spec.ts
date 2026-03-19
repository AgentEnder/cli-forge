import { describe, it, expect } from 'vitest';
import {
  AggregateConfigProvider,
  isAggregateConfigProvider,
} from './aggregate-config-provider.js';
import { ConfigurationProvider } from './configuration-loader.js';

function makeMockProvider<T>(
  config: Record<string, T>
): ConfigurationProvider<any> {
  return {
    resolve: (dir) => {
      for (const key of Object.keys(config)) {
        if (key.startsWith(dir)) return key;
      }
      return undefined;
    },
    load: (file) => config[file],
  };
}

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

  describe('load', () => {
    it('should merge config from multiple providers', () => {
      const providerA = makeMockProvider({
        '/root/.configA': { foo: 'fromA', bar: 1 },
      });
      const providerB = makeMockProvider({
        '/root/.configB': { baz: true },
      });

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      const result = aggregate.load('/root');

      expect(result).toEqual({ foo: 'fromA', bar: 1, baz: true });
    });

    it('should give precedence to first-registered provider on key conflicts', () => {
      const providerA = makeMockProvider({
        '/root/.configA': { foo: 'fromA' },
      });
      const providerB = makeMockProvider({
        '/root/.configB': { foo: 'fromB', bar: 2 },
      });

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      const result = aggregate.load('/root');

      expect(result).toEqual({ foo: 'fromA', bar: 2 });
    });

    it('should record provenance for each key', () => {
      const providerA = makeMockProvider({
        '/root/.configA': { foo: 'fromA' },
      });
      const providerB = makeMockProvider({
        '/root/.configB': { bar: 2 },
      });

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      aggregate.load('/root');

      expect(aggregate.provenance.get('foo')).toBe(providerA);
      expect(aggregate.provenance.get('bar')).toBe(providerB);
    });

    it('should record provenance to first provider on key conflict', () => {
      const providerA = makeMockProvider({
        '/root/.configA': { foo: 'fromA' },
      });
      const providerB = makeMockProvider({
        '/root/.configB': { foo: 'fromB' },
      });

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      aggregate.load('/root');

      expect(aggregate.provenance.get('foo')).toBe(providerA);
    });

    it('should skip providers that do not resolve', () => {
      const providerA: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({ foo: 'unreachable' }),
      };
      const providerB = makeMockProvider({
        '/root/.configB': { bar: 2 },
      });

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      const result = aggregate.load('/root');

      expect(result).toEqual({ bar: 2 });
    });

    it('should detect circular references', () => {
      const provider = makeMockProvider({
        '/root/.config': { extends: '/root', foo: 'hello' },
      });

      const aggregate = new AggregateConfigProvider([provider]);
      expect(() => aggregate.load('/root')).toThrow(/[Cc]ircular/);
    });

    it('should handle extends chains', () => {
      const provider: ConfigurationProvider<any> = {
        resolve: (dir) => {
          if (dir === '/root') return '/root/.config';
          if (dir === '/base') return '/base/.config';
          return undefined;
        },
        load: (file) => {
          if (file === '/root/.config')
            return { extends: '/base', foo: 'root' };
          if (file === '/base/.config') return { bar: 'base' };
          return {};
        },
      };

      const aggregate = new AggregateConfigProvider([provider]);
      const result = aggregate.load('/root');

      expect(result).toEqual({ foo: 'root', bar: 'base' });
    });

    it('should load nested aggregates and merge their provenance', () => {
      const providerA = makeMockProvider({
        '/root/.configA': { foo: 'fromA' },
      });
      const providerB = makeMockProvider({
        '/root/.configB': { bar: 2 },
      });
      const innerAggregate = new AggregateConfigProvider([providerB]);
      const outerAggregate = new AggregateConfigProvider([
        providerA,
        innerAggregate,
      ]);

      const result = outerAggregate.load('/root');

      expect(result).toEqual({ foo: 'fromA', bar: 2 });
      expect(outerAggregate.provenance.get('foo')).toBe(providerA);
      expect(outerAggregate.provenance.get('bar')).toBe(providerB);
    });
  });
});
