import { join } from 'path';

import { ConfigurationProvider, ConfigurationDocSection } from './configuration-loader.js';

/**
 * A provider child is either a single-file ConfigurationProvider or a nested AggregateConfigProvider.
 */
export type AnyConfigProvider<T> =
  | ConfigurationProvider<T>
  | AggregateConfigProvider<T>;

/**
 * An aggregate configuration provider that wraps multiple child providers.
 * It owns the merge logic, tracks per-key provenance, and routes
 * `updateConfig` writes to the correct underlying provider.
 *
 * Unlike {@link ConfigurationProvider}, an aggregate has no `resolve` method —
 * it delegates resolution to its children.
 */
export class AggregateConfigProvider<T> {
  readonly providers: AnyConfigProvider<T>[];

  /**
   * After {@link load} is called, maps each top-level key to the leaf
   * {@link ConfigurationProvider} that supplied it.
   */
  provenance: Map<string, ConfigurationProvider<T>> = new Map();

  /**
   * The last configuration root passed to {@link load}, stored for
   * use by {@link updateConfig} to find fallback providers.
   */
  private lastConfigurationRoot?: string;

  constructor(providers: AnyConfigProvider<T>[]) {
    this.providers = providers;
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
    visited?: Map<ConfigurationProvider<T>, Set<string>>
  ): T {
    const visitedMap =
      visited ?? new Map<ConfigurationProvider<T>, Set<string>>();
    this.provenance = new Map();
    this.lastConfigurationRoot = configurationRoot;

    let combined: T = {} as T;

    for (const provider of this.providers) {
      if (isAggregateConfigProvider(provider)) {
        const childResult = provider.load(configurationRoot, visitedMap);
        for (const key of Object.keys(childResult as any)) {
          if (!(key in (combined as any))) {
            (combined as any)[key] = (childResult as any)[key];
            const childOwner = provider.provenance.get(key);
            if (childOwner) {
              this.provenance.set(key, childOwner);
            }
          }
        }
      } else {
        const filename = provider.resolve(configurationRoot);
        if (filename) {
          const loaderVisited = visitedMap.get(provider) ?? new Set<string>();
          if (loaderVisited.has(filename)) {
            throw new Error(
              `Circular reference detected in configuration file: ${filename}. This is likely caused by an "extends" property pointing to a directory which doesn't contain a configuration file.`
            );
          }
          loaderVisited.add(filename);
          visitedMap.set(provider, loaderVisited);

          const loaded = this.loadWithExtends(
            filename,
            provider,
            configurationRoot,
            visitedMap
          );

          for (const key of Object.keys(loaded as any)) {
            if (!(key in (combined as any))) {
              (combined as any)[key] = (loaded as any)[key];
              this.provenance.set(key, provider);
            }
          }
        }
      }
    }
    return combined;
  }

  private loadWithExtends(
    filename: string,
    provider: ConfigurationProvider<T>,
    configurationRoot: string,
    visited: Map<ConfigurationProvider<T>, Set<string>>
  ): T {
    const loaded = provider.load(filename);
    if (loaded.extends) {
      const extendsRoot = loaded.extends.startsWith('.')
        ? join(configurationRoot, loaded.extends)
        : loaded.extends;
      const extendsAggregate = new AggregateConfigProvider<T>(this.providers);
      const extended = extendsAggregate.load(extendsRoot, visited);
      const { extends: _, ...rest } = loaded as any;
      return { ...extended, ...rest } as T;
    }
    return loaded;
  }

  /**
   * Updates configuration by routing each key to its owning provider.
   * Keys not found in provenance are routed to the first resolving provider.
   *
   * @param values Partial configuration to write.
   */
  async updateConfig(values: Partial<T>): Promise<void> {
    // Group keys by their owning provider
    const updatesByProvider = new Map<ConfigurationProvider<T>, Partial<T>>();

    // Find the first leaf provider that resolves (fallback for new keys)
    let fallbackProvider: ConfigurationProvider<T> | undefined;
    if (this.lastConfigurationRoot) {
      fallbackProvider = this.findFirstResolvingProvider(
        this.lastConfigurationRoot
      );
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
      const existing = updatesByProvider.get(owner) ?? ({} as Partial<T>);
      (existing as any)[key] = values[key];
      updatesByProvider.set(owner, existing);
    }

    // Call each provider's updateConfig with an updater that merges the partial update
    const promises: Promise<void>[] = [];
    for (const [provider, partial] of updatesByProvider) {
      promises.push(
        provider.updateConfig!((current) => ({ ...current, ...partial }))
      );
    }
    await Promise.all(promises);
  }

  private findFirstResolvingProvider(
    configurationRoot: string
  ): ConfigurationProvider<T> | undefined {
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
