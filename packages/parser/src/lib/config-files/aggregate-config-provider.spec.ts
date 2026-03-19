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

  describe('updateConfig', () => {
    it('should route updates to the provider that owns each key', async () => {
      const updatedA: any[] = [];
      const updatedB: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ foo: 'fromA' }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function' ? await updater({ foo: 'fromA' }) : updater;
          updatedA.push(result);
        },
      };
      const providerB: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configB' : undefined),
        load: () => ({ bar: 2 }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function' ? await updater({ bar: 2 }) : updater;
          updatedB.push(result);
        },
      };

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      aggregate.load('/root');

      await aggregate.updateConfig({ foo: 'newFoo', bar: 99 });

      expect(updatedA).toEqual([{ foo: 'newFoo' }]);
      expect(updatedB).toEqual([{ bar: 99 }]);
    });

    it('should route unknown keys to the first resolving provider', async () => {
      const updatedA: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ foo: 'fromA' }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function' ? await updater({ foo: 'fromA' }) : updater;
          updatedA.push(result);
        },
      };

      const aggregate = new AggregateConfigProvider([providerA]);
      aggregate.load('/root');

      await aggregate.updateConfig({ newKey: 'newValue' } as any);

      expect(updatedA).toEqual([{ foo: 'fromA', newKey: 'newValue' }]);
    });

    it('should throw if the target provider does not support updateConfig', async () => {
      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ foo: 'fromA' }),
        // no updateConfig
      };

      const aggregate = new AggregateConfigProvider([providerA]);
      aggregate.load('/root');

      await expect(
        aggregate.updateConfig({ foo: 'newFoo' })
      ).rejects.toThrow(/updateConfig/);
    });

    it('should throw if no providers resolve (no provenance, no fallback)', async () => {
      const providerA: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
      };

      const aggregate = new AggregateConfigProvider([providerA]);
      aggregate.load('/root');

      await expect(
        aggregate.updateConfig({ foo: 'newFoo' })
      ).rejects.toThrow();
    });
  });

  describe('describeConfig', () => {
    it('should aggregate documentation from all children', () => {
      const providerA: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        describeConfig: () => ({ heading: 'Config A', body: 'Description A' }),
      };
      const providerB: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        describeConfig: () => ({ heading: 'Config B', body: 'Description B' }),
      };
      const providerC: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        // no describeConfig
      };

      const aggregate = new AggregateConfigProvider([
        providerA,
        providerB,
        providerC,
      ]);
      expect(aggregate.describeConfig()).toEqual([
        { heading: 'Config A', body: 'Description A' },
        { heading: 'Config B', body: 'Description B' },
      ]);
    });

    it('should flatten nested aggregate documentation', () => {
      const providerA: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        describeConfig: () => ({ heading: 'A', body: 'A' }),
      };
      const providerB: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        describeConfig: () => ({ heading: 'B', body: 'B' }),
      };
      const inner = new AggregateConfigProvider([providerB]);
      const outer = new AggregateConfigProvider([providerA, inner]);

      expect(outer.describeConfig()).toEqual([
        { heading: 'A', body: 'A' },
        { heading: 'B', body: 'B' },
      ]);
    });
  });

  describe('integration: multi-provider updateConfig routing', () => {
    it('should route updates to correct providers across nested aggregates', async () => {
      const updatesA: any[] = [];
      const updatesB: any[] = [];
      const updatesC: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ name: 'fromA', debug: false }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ name: 'fromA', debug: false })
              : updater;
          updatesA.push(result);
        },
      };
      const providerB: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configB' : undefined),
        load: () => ({ port: 3000 }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ port: 3000 })
              : updater;
          updatesB.push(result);
        },
      };
      const providerC: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configC' : undefined),
        load: () => ({ host: 'localhost' }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ host: 'localhost' })
              : updater;
          updatesC.push(result);
        },
      };

      const inner = new AggregateConfigProvider([providerB, providerC]);
      const outer = new AggregateConfigProvider([providerA, inner]);

      outer.load('/root');

      await outer.updateConfig({
        name: 'newName',
        port: 8080,
        host: '0.0.0.0',
      });

      // Each provider should only receive its own keys
      expect(updatesA).toEqual([{ name: 'newName', debug: false }]);
      expect(updatesB).toEqual([{ port: 8080 }]);
      expect(updatesC).toEqual([{ host: '0.0.0.0' }]);
    });
  });
});
