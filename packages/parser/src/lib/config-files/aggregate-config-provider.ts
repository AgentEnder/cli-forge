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
    throw new Error('Not implemented');
  }

  /**
   * Updates configuration by routing each key to its owning provider.
   * Keys not found in provenance are routed to the first resolving provider.
   *
   * @param values Partial configuration to write.
   */
  async updateConfig(values: Partial<T>): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Aggregates documentation sections from all child providers.
   */
  describeConfig(): ConfigurationDocSection[] {
    return [];
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
