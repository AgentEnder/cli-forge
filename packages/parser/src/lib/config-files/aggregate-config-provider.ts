import { getFileSystemProvider } from '../environment-provider.js';
import {
  ConfigurationProvider,
  ConfigurationDocSection,
  DefaultConfig,
} from './configuration-loader.js';
import { toFilePath } from './utils.js';

/**
 * A provider child is either a single-file ConfigurationProvider or a nested AggregateConfigProvider.
 */
export type AnyConfigProvider<T> =
  | ConfigurationProvider<T, any>
  | AggregateConfigProvider<T>;

/**
 * A provider entry pairs a provider with optional framework-level metadata.
 */
export type ProviderEntry<T> = {
  provider: AnyConfigProvider<T>;
  /** Framework-level default path for when no config file exists on disk. */
  default?: DefaultConfig<any>;
};

/**
 * An updater function that receives the current merged configuration
 * and mutates it in place. Only the properties that are set during the
 * callback are written back to their owning providers.
 */
export type ConfigUpdater<T> = (current: T) => void;

/**
 * An aggregate configuration provider that wraps multiple child providers.
 * It owns the merge logic, tracks per-key provenance, and routes
 * `updateConfig` writes to the correct underlying provider.
 *
 * Unlike {@link ConfigurationProvider}, an aggregate has no `resolve` method —
 * it delegates resolution to its children.
 */
export class AggregateConfigProvider<T> {
  /**
   * The list of child providers, derived from {@link entries}.
   * Read-only to prevent desync with the entries array.
   */
  get providers(): ReadonlyArray<AnyConfigProvider<T>> {
    return this.entries.map((e) => e.provider);
  }

  /**
   * Internal entries storing providers with optional framework metadata.
   */
  private entries: ProviderEntry<T>[];

  /**
   * After {@link load} is called, maps each top-level key to the leaf
   * {@link ConfigurationProvider} that supplied it.
   */
  provenance: Map<string, ConfigurationProvider<T, any>> = new Map();

  /**
   * The last configuration root passed to {@link load}, stored for
   * use by {@link updateConfig} to find fallback providers.
   */
  private lastConfigurationRoot?: string;

  constructor(providers: (AnyConfigProvider<T> | ProviderEntry<T>)[]) {
    this.entries = providers.map((p) =>
      isProviderEntry(p) ? p : { provider: p }
    );
  }

  /**
   * Adds a provider with optional framework metadata.
   */
  addProvider(
    provider: AnyConfigProvider<T>,
    metadata?: { default?: DefaultConfig<any> }
  ) {
    const entry: ProviderEntry<T> = { provider, ...metadata };
    this.entries.push(entry);
  }

  /**
   * Loads and merges configuration from all child providers.
   * First-registered provider wins when keys overlap.
   *
   * @param configurationRoot The directory to resolve config files from.
   * @param visited Shared visited-file map for circular reference detection.
   * @returns The merged configuration object.
   */
  load(
    configurationRoot: string,
    visited?: Map<ConfigurationProvider<T, any>, Set<string>>
  ): T {
    const visitedMap =
      visited ?? new Map<ConfigurationProvider<T, any>, Set<string>>();
    this.provenance = new Map();
    this.lastConfigurationRoot = configurationRoot;

    // Phase 1: Load each provider's own config, separating extends references.
    // Aggregate children are loaded recursively (they handle extends internally).
    const results = new Map<
      AnyConfigProvider<T>,
      {
        own: Partial<T>;
        extendsRef?: string;
        childProvenance?: Map<string, ConfigurationProvider<T, any>>;
      }
    >();

    for (const provider of this.providers) {
      if (isAggregateConfigProvider(provider)) {
        const childResult = provider.load(configurationRoot, visitedMap);
        results.set(provider, {
          own: childResult,
          childProvenance: provider.provenance,
        });
      } else {
        const filename = provider.resolve(configurationRoot);
        if (filename) {
          const filenameStr = toFilePath(filename);
          const loaderVisited = visitedMap.get(provider) ?? new Set<string>();
          if (loaderVisited.has(filenameStr)) {
            throw new Error(
              `Circular reference detected in configuration file: ${filenameStr}. This is likely caused by an "extends" property pointing to a directory which doesn't contain a configuration file.`
            );
          }
          loaderVisited.add(filenameStr);
          visitedMap.set(provider, loaderVisited);

          const loaded = provider.load(filename);
          const { extends: extendsRef, ...own } = loaded as any;
          results.set(provider, { own, extendsRef });
        }
      }
    }

    // Phase 2: Merge explicit values in registration order (first-wins).
    // Explicit values from ANY provider beat extends-derived values.
    let combined: T = {} as T;

    for (const provider of this.providers) {
      const result = results.get(provider);
      if (!result) continue;

      for (const key of Object.keys(result.own as any)) {
        if (!(key in (combined as any))) {
          (combined as any)[key] = (result.own as any)[key];
          if (
            isAggregateConfigProvider(provider) &&
            result.childProvenance
          ) {
            const childOwner = result.childProvenance.get(key);
            if (childOwner) {
              this.provenance.set(key, childOwner);
            }
          } else {
            this.provenance.set(
              key,
              provider as ConfigurationProvider<T, any>
            );
          }
        }
      }
    }

    // Phase 3: Resolve extends chains and merge base values underneath.
    // These only fill keys not already set by any explicit value.
    const fs = getFileSystemProvider();
    for (const provider of this.providers) {
      if (isAggregateConfigProvider(provider)) continue;
      const result = results.get(provider);
      if (!result?.extendsRef) continue;

      const extendsRoot = result.extendsRef.startsWith('.')
        ? fs.join(configurationRoot, result.extendsRef)
        : result.extendsRef;
      const extendsAggregate = new AggregateConfigProvider<T>(this.entries);
      const extended = extendsAggregate.load(extendsRoot, visitedMap);
      for (const key of Object.keys(extended as any)) {
        if (!(key in (combined as any))) {
          (combined as any)[key] = (extended as any)[key];
          this.provenance.set(
            key,
            provider as ConfigurationProvider<T, any>
          );
        }
      }
    }

    return combined;
  }

  /**
   * Updates configuration by routing each key to its owning provider.
   * Keys not found in provenance are routed to the first resolving provider.
   * If no provider resolves, attempts to use a provider with a `default` config
   * to create a new configuration file.
   *
   * @param values Partial configuration to write.
   */
  async updateConfig(values: Partial<T>): Promise<void>;
  /**
   * Updates configuration via an updater function. The current merged
   * configuration is wrapped in a proxy that tracks which properties are set.
   * Only the changed properties are written back to their owning providers.
   *
   * @param updater A function that receives the current config and mutates it in place.
   */
  async updateConfig(updater: ConfigUpdater<T>): Promise<void>;
  async updateConfig(
    valuesOrUpdater: Partial<T> | ConfigUpdater<T>
  ): Promise<void> {
    let values: Partial<T>;
    if (typeof valuesOrUpdater === 'function') {
      values = this.trackUpdates(valuesOrUpdater);
    } else {
      values = valuesOrUpdater;
    }

    // Group keys by their owning provider
    const updatesByProvider = new Map<
      ConfigurationProvider<T, any>,
      { partial: Partial<T>; targetPath?: string | URL }
    >();

    // Find the first leaf provider that resolves (fallback for new keys)
    let fallbackProvider: ConfigurationProvider<T, any> | undefined;
    let fallbackTargetPath: (string | URL) | undefined;

    if (this.lastConfigurationRoot) {
      fallbackProvider = this.findFirstResolvingProvider(
        this.lastConfigurationRoot
      );
    }

    // If no provider resolves, try to find one with a default
    if (!fallbackProvider) {
      const defaultResult = await this.resolveDefaultProvider();
      if (defaultResult) {
        fallbackProvider = defaultResult.provider;
        fallbackTargetPath = defaultResult.targetPath;
      }
    }

    for (const key of Object.keys(values) as (keyof T & string)[]) {
      const owner = this.provenance.get(key) ?? fallbackProvider;
      if (!owner) {
        throw new Error(
          `Cannot update config key "${key}": no provider resolved and no fallback available. ` +
            'Ensure at least one configuration file exists.'
        );
      }
      if (!owner.updateConfig) {
        throw new Error(
          `Cannot update config key "${key}": the owning provider does not implement updateConfig.`
        );
      }
      const existing = updatesByProvider.get(owner) ?? {
        partial: {} as Partial<T>,
      };
      (existing.partial as any)[key] = values[key];
      // Attach targetPath only for the fallback provider when using default
      if (owner === fallbackProvider && fallbackTargetPath) {
        existing.targetPath = fallbackTargetPath;
      }
      updatesByProvider.set(owner, existing);
    }

    // Call each provider's updateConfig with an updater that merges the partial update
    const promises: Promise<void>[] = [];
    for (const [provider, { partial, targetPath }] of updatesByProvider) {
      promises.push(
        provider.updateConfig!(
          (current) => ({ ...(current ?? ({} as T)), ...partial }),
          targetPath ? { targetPath } : undefined
        )
      );
    }
    await Promise.all(promises);
  }

  /**
   * Runs an updater function against a proxy of the merged config,
   * returning only the properties that were set during the callback.
   */
  private trackUpdates(updater: ConfigUpdater<T>): Partial<T> {
    if (!this.lastConfigurationRoot) {
      throw new Error(
        'Cannot use updater function: config has not been loaded yet. Call load() first.'
      );
    }
    // Re-load to get the current merged config
    const current = this.load(this.lastConfigurationRoot);
    const changes: Partial<T> = {} as Partial<T>;
    const proxy = new Proxy(current as object, {
      set(_target, prop, value) {
        (changes as any)[prop] = value;
        return true;
      },
      get(target, prop) {
        return (target as any)[prop];
      },
    }) as T;
    updater(proxy);
    return changes;
  }

  /**
   * Finds the first leaf provider that resolves a file in the given root.
   */
  private findFirstResolvingProvider(
    configurationRoot: string
  ): ConfigurationProvider<T, any> | undefined {
    for (const provider of this.providers) {
      if (isAggregateConfigProvider(provider)) {
        const found = provider.findFirstResolvingProvider(configurationRoot);
        if (found) return found;
      } else {
        if (provider.resolve(configurationRoot)) return provider;
      }
    }
    return undefined;
  }

  /**
   * Iterates entries looking for the first provider with a `default` config
   * that resolves to a non-null path. Returns the provider and resolved path.
   */
  private async resolveDefaultProvider(): Promise<
    | { provider: ConfigurationProvider<T, any>; targetPath: string | URL }
    | undefined
  > {
    for (const entry of this.entries) {
      if (entry.default == null) continue;

      const provider = isAggregateConfigProvider(entry.provider)
        ? // For aggregate entries with a default, find the first leaf provider
          this.findFirstLeafProvider(entry.provider)
        : entry.provider;

      if (!provider || !provider.updateConfig) continue;

      const resolved =
        typeof entry.default === 'function'
          ? await entry.default()
          : entry.default;

      if (resolved != null) {
        return { provider, targetPath: resolved };
      }
    }
    return undefined;
  }

  /**
   * Finds the first non-aggregate leaf provider in a nested structure.
   */
  private findFirstLeafProvider(
    aggregate: AggregateConfigProvider<T>
  ): ConfigurationProvider<T, any> | undefined {
    for (const provider of aggregate.providers) {
      if (isAggregateConfigProvider(provider)) {
        const found = this.findFirstLeafProvider(provider);
        if (found) return found;
      } else {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Aggregates documentation sections from all child providers.
   */
  describeConfig(): ConfigurationDocSection[] {
    const sections: ConfigurationDocSection[] = [];
    for (const provider of this.providers) {
      if (isAggregateConfigProvider(provider)) {
        sections.push(...provider.describeConfig());
      } else if (provider.describeConfig) {
        sections.push(provider.describeConfig());
      }
    }
    return sections;
  }
}

/**
 * Type guard to distinguish an AggregateConfigProvider from a ConfigurationProvider.
 */
export function isAggregateConfigProvider<T>(
  provider: AnyConfigProvider<T>
): provider is AggregateConfigProvider<T> {
  return provider instanceof AggregateConfigProvider;
}

/**
 * Type guard to distinguish a ProviderEntry from a bare provider.
 */
function isProviderEntry<T>(
  value: AnyConfigProvider<T> | ProviderEntry<T>
): value is ProviderEntry<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'provider' in value &&
    !(value instanceof AggregateConfigProvider)
  );
}
