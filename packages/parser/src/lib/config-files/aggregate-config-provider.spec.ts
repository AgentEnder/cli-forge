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

    it('should handle deeply nested extends chains (A → B → C)', () => {
      const provider: ConfigurationProvider<any> = {
        resolve: (dir) => {
          if (dir === '/root') return '/root/.config';
          if (dir === '/mid') return '/mid/.config';
          if (dir === '/base') return '/base/.config';
          return undefined;
        },
        load: (file) => {
          if (file === '/root/.config')
            return { extends: '/mid', root: 'root-val' };
          if (file === '/mid/.config')
            return { extends: '/base', mid: 'mid-val', root: 'mid-override' };
          if (file === '/base/.config')
            return { base: 'base-val', mid: 'base-override', root: 'base-override' };
          return {};
        },
      };

      const aggregate = new AggregateConfigProvider([provider]);
      const result = aggregate.load('/root');

      // root's explicit "root" wins over mid and base
      expect(result.root).toBe('root-val');
      // mid's explicit "mid" wins over base
      expect(result.mid).toBe('mid-val');
      // base's "base" fills in (no one else set it)
      expect(result.base).toBe('base-val');
    });

    it('should prioritize explicit values over extends-derived values regardless of provider order', () => {
      // Provider A (first) has extends that brings in "name" from a base config.
      // Provider B (second) explicitly sets "name" in its own config.
      // Provider B's explicit value should win over A's extends-derived value.
      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => {
          if (dir === '/root') return '/root/.configA';
          if (dir === '/base') return '/base/.configA';
          return undefined;
        },
        load: (file) => {
          if (file === '/root/.configA')
            return { extends: '/base', color: 'red' };
          if (file === '/base/.configA')
            return { name: 'from-base', host: 'base-host' };
          return {};
        },
      };
      const providerB = makeMockProvider({
        '/root/.configB': { name: 'B-explicit', port: 8080 },
      });

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      const result = aggregate.load('/root');

      // B's explicit "name" beats A's extends-derived "name"
      expect(result.name).toBe('B-explicit');
      // A's explicit "color" is kept
      expect(result.color).toBe('red');
      // B's explicit "port" is kept
      expect(result.port).toBe(8080);
      // A's extends-derived "host" fills in (no explicit value from anyone)
      expect(result.host).toBe('base-host');
    });

    it('should prioritize extends-derived values by provider order when no explicit value exists', () => {
      // Both providers have extends. When no explicit value exists for a key,
      // the first provider's extends-derived value should win.
      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => {
          if (dir === '/root') return '/root/.configA';
          if (dir === '/baseA') return '/baseA/.config';
          return undefined;
        },
        load: (file) => {
          if (file === '/root/.configA')
            return { extends: '/baseA', color: 'red' };
          if (file === '/baseA/.config') return { theme: 'dark' };
          return {};
        },
      };
      const providerB: ConfigurationProvider<any> = {
        resolve: (dir) => {
          if (dir === '/root') return '/root/.configB';
          if (dir === '/baseB') return '/baseB/.config';
          return undefined;
        },
        load: (file) => {
          if (file === '/root/.configB')
            return { extends: '/baseB', port: 8080 };
          if (file === '/baseB/.config') return { theme: 'light' };
          return {};
        },
      };

      const aggregate = new AggregateConfigProvider([providerA, providerB]);
      const result = aggregate.load('/root');

      // A's extends-derived "theme" wins (first-provider-wins among extends)
      expect(result.theme).toBe('dark');
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

    it('should support updater function via proxy tracking', async () => {
      const updatedA: any[] = [];
      const updatedB: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ foo: 'fromA' }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ foo: 'fromA' })
              : updater;
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

      await aggregate.updateConfig((config) => {
        config.foo = 'updatedFoo';
        config.bar = 99;
      });

      expect(updatedA).toEqual([{ foo: 'updatedFoo' }]);
      expect(updatedB).toEqual([{ bar: 99 }]);
    });

    it('should only write keys that were actually set in updater', async () => {
      const updatedA: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ foo: 'fromA', bar: 2 }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ foo: 'fromA', bar: 2 })
              : updater;
          updatedA.push(result);
        },
      };

      const aggregate = new AggregateConfigProvider([providerA]);
      aggregate.load('/root');

      await aggregate.updateConfig((config) => {
        // Only set foo, don't touch bar
        config.foo = 'newFoo';
      });

      // bar should still be original value, only foo changed
      expect(updatedA).toEqual([{ foo: 'newFoo', bar: 2 }]);
    });

    it('should allow updater to read current values', async () => {
      const updatedA: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: (dir) => (dir === '/root' ? '/root/.configA' : undefined),
        load: () => ({ count: 5 }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ count: 5 })
              : updater;
          updatedA.push(result);
        },
      };

      const aggregate = new AggregateConfigProvider([providerA]);
      aggregate.load('/root');

      await aggregate.updateConfig((config) => {
        config.count = config.count + 1;
      });

      expect(updatedA).toEqual([{ count: 6 }]);
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

  describe('updateConfig with default fallback', () => {
    it('should use default provider when no providers resolve', async () => {
      const updates: any[] = [];
      const targetPaths: any[] = [];

      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined, // no file exists
        load: () => ({}),
        updateConfig: async (updater, options) => {
          const result =
            typeof updater === 'function' ? await updater({}) : updater;
          updates.push(result);
          if (options?.targetPath) targetPaths.push(options.targetPath);
        },
      };

      const aggregate = new AggregateConfigProvider([
        { provider, default: '/tmp/default.json' },
      ]);
      aggregate.load('/root');

      await aggregate.updateConfig({ foo: 'bar' });

      expect(updates).toEqual([{ foo: 'bar' }]);
      expect(targetPaths).toEqual(['/tmp/default.json']);
    });

    it('should support default as a function', async () => {
      const updates: any[] = [];
      const targetPaths: any[] = [];

      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async (updater, options) => {
          const result =
            typeof updater === 'function' ? await updater({}) : updater;
          updates.push(result);
          if (options?.targetPath) targetPaths.push(options.targetPath);
        },
      };

      const aggregate = new AggregateConfigProvider([
        { provider, default: () => '/tmp/from-function.json' },
      ]);
      aggregate.load('/root');

      await aggregate.updateConfig({ key: 'value' });

      expect(targetPaths).toEqual(['/tmp/from-function.json']);
    });

    it('should support async default function', async () => {
      const targetPaths: any[] = [];

      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async (updater, options) => {
          if (options?.targetPath) targetPaths.push(options.targetPath);
        },
      };

      const aggregate = new AggregateConfigProvider([
        {
          provider,
          default: async () => '/tmp/async-default.json',
        },
      ]);
      aggregate.load('/root');

      await aggregate.updateConfig({ key: 'value' });

      expect(targetPaths).toEqual(['/tmp/async-default.json']);
    });

    it('should fall through when default function returns null', async () => {
      const targetPaths: any[] = [];

      const providerA: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async (_updater, options) => {
          if (options?.targetPath) targetPaths.push(options.targetPath);
        },
      };

      const providerB: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async (_updater, options) => {
          if (options?.targetPath) targetPaths.push(options.targetPath);
        },
      };

      const aggregate = new AggregateConfigProvider([
        { provider: providerA, default: () => null },
        { provider: providerB, default: '/tmp/fallback.json' },
      ]);
      aggregate.load('/root');

      await aggregate.updateConfig({ key: 'value' });

      // Should skip providerA (returned null) and use providerB
      expect(targetPaths).toEqual(['/tmp/fallback.json']);
    });

    it('should prefer resolving provider over default provider', async () => {
      const resolvedUpdates: any[] = [];
      const defaultUpdates: any[] = [];

      const resolvingProvider: ConfigurationProvider<any> = {
        resolve: (dir) =>
          dir === '/root' ? '/root/.config.json' : undefined,
        load: () => ({ existing: true }),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function'
              ? await updater({ existing: true })
              : updater;
          resolvedUpdates.push(result);
        },
      };

      const defaultProvider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async (updater) => {
          const result =
            typeof updater === 'function' ? await updater({}) : updater;
          defaultUpdates.push(result);
        },
      };

      const aggregate = new AggregateConfigProvider([
        resolvingProvider,
        { provider: defaultProvider, default: '/tmp/default.json' },
      ]);
      aggregate.load('/root');

      await aggregate.updateConfig({ newKey: 'value' } as any);

      // Should route to resolving provider, not the default one
      expect(resolvedUpdates).toEqual([
        { existing: true, newKey: 'value' },
      ]);
      expect(defaultUpdates).toEqual([]);
    });

    it('should throw when no provider resolves and no default is configured', async () => {
      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async () => {},
      };

      const aggregate = new AggregateConfigProvider([provider]);
      aggregate.load('/root');

      await expect(
        aggregate.updateConfig({ foo: 'bar' })
      ).rejects.toThrow(/no provider resolved/);
    });

    it('should support URL as default', async () => {
      const targetPaths: any[] = [];

      const provider: ConfigurationProvider<any> = {
        resolve: () => undefined,
        load: () => ({}),
        updateConfig: async (_updater, options) => {
          if (options?.targetPath) targetPaths.push(options.targetPath);
        },
      };

      const defaultUrl = new URL('file:///tmp/url-default.json');
      const aggregate = new AggregateConfigProvider([
        { provider, default: defaultUrl },
      ]);
      aggregate.load('/root');

      await aggregate.updateConfig({ key: 'value' });

      expect(targetPaths).toEqual([defaultUrl]);
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
