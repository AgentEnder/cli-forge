import { getFileSystemProvider } from '../environment-provider.js';
import {
  ConfigurationProvider,
  ConfigurationDocSection,
  DefaultConfig,
  NamedConfigLocations,
} from './configuration-loader.js';
import { toFilePath } from './utils.js';

/**
 * Returns true when an object has no own enumerable properties. Used to
 * detect "nothing resolved from cwd" in {@link AggregateConfigProvider.updateConfig}
 * so the updater form can fall back to reading the default-location file.
 */
function isEmptyObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value as object).length === 0
  );
}

/**
 * A leaf ConfigurationProvider with any location type.
 */
type AnyProvider<T> = ConfigurationProvider<T, any>;

/**
 * A provider child is either a single-file ConfigurationProvider or a nested AggregateConfigProvider.
 */
export type AnyConfigProvider<T> = AnyProvider<T> | AggregateConfigProvider<T>;

/**
 * A config registration can be a single provider or multiple providers.
 * Parser/CLI registration APIs normalize arrays into separate provider entries.
 */
export type ConfigProviderRegistration<T> =
  | AnyConfigProvider<T>
  | readonly AnyConfigProvider<T>[];

/**
 * A provider entry pairs a provider with optional framework-level metadata.
 *
 * Named locations live alongside walk-upward: the provider still calls
 * `resolve(configurationRoot)` for its walk-upward filename, AND the
 * aggregate scans every entry in `locations` (in declaration order) for
 * additional config payloads. Named-location reads do not walk — the
 * resolved path is used directly.
 *
 * `defaultLocation` is the catch-all write target when an option has no
 * provenance (not yet present in any file) and no per-option override.
 */
export type ProviderEntry<T> = {
  provider: AnyConfigProvider<T>;
  /**
   * Map of named locations to scan in addition to walk-upward. Each value is
   * a {@link DefaultConfig} (static path/URL or callback returning one).
   */
  locations?: NamedConfigLocations<any>;
  /**
   * Name (a key of {@link locations}) used as the write target for keys
   * with no provenance and no per-option override. When omitted and
   * `locations` is set, the provider has no fresh-write fallback for keys
   * not pinned via `defaultConfigLocation`.
   */
  defaultLocation?: string;
};

/**
 * Records the source from which a key was loaded. Writes route back to
 * the same `provider` and `resolvedPath` so updates land in the file the
 * value came from, not a sibling location with a different name.
 */
export type ProvenanceEntry<T> = {
  provider: AnyProvider<T>;
  /** Undefined when the source was a walk-upward resolve(). */
  locationName?: string;
  resolvedPath: string | URL;
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
   * After {@link load} is called, maps each top-level key to the source
   * (provider + location name + resolved path) that supplied it. Writes
   * route to the same `resolvedPath` so values land back in their source file.
   */
  provenance: Map<string, ProvenanceEntry<T>> = new Map();

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
    metadata?: { locations?: NamedConfigLocations<any>; defaultLocation?: string }
  ) {
    const entry: ProviderEntry<T> = { provider, ...metadata };
    this.entries.push(entry);
  }

  /**
   * Returns the registered entries, exposed so callers (e.g. parser) can
   * inspect locations to validate per-option `defaultConfigLocation` references.
   */
  getEntries(): ReadonlyArray<ProviderEntry<T>> {
    return this.entries;
  }

  /**
   * Loads and merges configuration from all child providers.
   * First-registered provider wins when keys overlap. For a single
   * provider, sources are scanned in this order:
   *
   * 1. Walk-upward via `provider.resolve(configurationRoot)`.
   * 2. Each `entry.locations[name]` in declaration order — resolved as
   *    a {@link DefaultConfig} (sync value or callback). Callbacks
   *    returning `null` and missing files are skipped.
   *
   * @param configurationRoot The directory to resolve config files from.
   * @param visited Shared visited-file map for circular reference detection.
   * @returns The merged configuration object.
   */
  load(
    configurationRoot: string,
    visited?: Map<AnyProvider<T>, Set<string>>
  ): T {
    const visitedMap =
      visited ?? new Map<AnyProvider<T>, Set<string>>();
    this.provenance = new Map();
    this.lastConfigurationRoot = configurationRoot;

    // Phase 1: Load each entry's sources. A single entry can produce
    // multiple loaded payloads — one per resolved walk-upward file plus
    // one per existing named-location file.
    type SourceResult = {
      entry: ProviderEntry<T>;
      provider: AnyProvider<T>;
      locationName?: string; // undefined for walk-upward sources
      resolvedPath: string | URL;
      own: Partial<T>;
      extendsRef?: string;
    };
    type AggregateSourceResult = {
      entry: ProviderEntry<T>;
      aggregate: AggregateConfigProvider<T>;
      own: Partial<T>;
      childProvenance: Map<string, ProvenanceEntry<T>>;
    };

    const sources: SourceResult[] = [];
    const aggregateSources: AggregateSourceResult[] = [];
    const fs = getFileSystemProvider();

    const recordLeafSource = (
      entry: ProviderEntry<T>,
      provider: AnyProvider<T>,
      resolvedPath: string | URL,
      locationName: string | undefined
    ) => {
      const filenameStr = toFilePath(resolvedPath);
      const loaderVisited = visitedMap.get(provider) ?? new Set<string>();
      if (loaderVisited.has(filenameStr)) {
        throw new Error(
          `Circular reference detected in configuration file: ${filenameStr}. This is likely caused by an "extends" property pointing to a directory which doesn't contain a configuration file.`
        );
      }
      loaderVisited.add(filenameStr);
      visitedMap.set(provider, loaderVisited);

      const loaded = provider.load(resolvedPath);
      const { extends: extendsRef, ...own } = loaded as any;
      sources.push({
        entry,
        provider,
        resolvedPath,
        locationName,
        own,
        extendsRef,
      });
    };

    for (const entry of this.entries) {
      const provider = entry.provider;
      if (isAggregateConfigProvider(provider)) {
        const childResult = provider.load(configurationRoot, visitedMap);
        aggregateSources.push({
          entry,
          aggregate: provider,
          own: childResult,
          childProvenance: provider.provenance,
        });
      } else {
        // 1. Walk-upward via resolve().
        const resolved = provider.resolve(configurationRoot);
        if (resolved) {
          recordLeafSource(entry, provider, resolved, undefined);
        }

        // 2. Named locations in declaration order. Callbacks may be async,
        // but load() is sync — use only sync callback returns here.
        // Async-only callbacks are skipped during read; updateConfig handles them.
        if (entry.locations) {
          for (const name of Object.keys(entry.locations)) {
            const spec = entry.locations[name];
            const resolvedLocation = resolveLocationSync(spec);
            if (resolvedLocation == null) continue;
            const path = toFilePath(resolvedLocation);
            if (!fs.existsSync(path)) continue;
            recordLeafSource(entry, provider, resolvedLocation, name);
          }
        }
      }
    }

    // Phase 2: Merge explicit values in source order (first-wins).
    // Explicit values from ANY source beat extends-derived values.
    let combined: T = {} as T;

    // First: aggregate children (recursive — they own their own provenance shapes).
    // Walk in registration order, interleaving aggregate and leaf sources to
    // preserve the original first-wins semantics across mixed entries.
    for (const entry of this.entries) {
      const provider = entry.provider;
      if (isAggregateConfigProvider(provider)) {
        const aggSrc = aggregateSources.find((s) => s.aggregate === provider);
        if (!aggSrc) continue;
        for (const key of Object.keys(aggSrc.own as any)) {
          if (!(key in (combined as any))) {
            (combined as any)[key] = (aggSrc.own as any)[key];
            const childProv = aggSrc.childProvenance.get(key);
            if (childProv) {
              this.provenance.set(key, childProv);
            }
          }
        }
      } else {
        for (const src of sources) {
          if (src.entry !== entry) continue;
          for (const key of Object.keys(src.own as any)) {
            if (!(key in (combined as any))) {
              (combined as any)[key] = (src.own as any)[key];
              this.provenance.set(key, {
                provider: src.provider,
                locationName: src.locationName,
                resolvedPath: src.resolvedPath,
              });
            }
          }
        }
      }
    }

    // Phase 3: Resolve extends chains and merge base values underneath.
    // These only fill keys not already set by any explicit value.
    //
    // The recursive aggregate strips `locations` and `defaultLocation`
    // because those are fixed absolute paths, not walk-upward searches —
    // re-scanning them at the extends root would pick up the same file
    // and loop. extends-from-extends still works via walk-upward.
    for (const src of sources) {
      if (!src.extendsRef) continue;
      const extendsRoot = src.extendsRef.startsWith('.')
        ? fs.join(configurationRoot, src.extendsRef)
        : src.extendsRef;
      const extendsAggregate = new AggregateConfigProvider<T>(
        this.entries.map((e) => ({
          provider: e.provider,
        }))
      );
      const extended = extendsAggregate.load(extendsRoot, visitedMap);
      for (const key of Object.keys(extended as any)) {
        if (!(key in (combined as any))) {
          (combined as any)[key] = (extended as any)[key];
          this.provenance.set(key, {
            provider: src.provider,
            locationName: src.locationName,
            resolvedPath: src.resolvedPath,
          });
        }
      }
    }

    return combined;
  }

  /**
   * Updates configuration by routing each key to its owning provider.
   *
   * Routing per key:
   * 1. Provenance match — write back to the same `{ provider, resolvedPath }`
   *    the value was loaded from.
   * 2. Per-option `defaultConfigLocation` (passed via `optionLocationOverrides`).
   * 3. Global `entry.defaultLocation` for each entry in registration order.
   *
   * If none of the above route, throws.
   *
   * @param values Partial configuration to write.
   * @param options Per-option location overrides (`{ [key]: locationName }`).
   */
  async updateConfig(
    values: Partial<T>,
    options?: { optionLocationOverrides?: Record<string, string> }
  ): Promise<void>;
  /**
   * Updates configuration via an updater function. The current merged
   * configuration is wrapped in a proxy that tracks which properties are set.
   * Only the changed properties are written back via the same routing rules
   * as the values overload.
   *
   * @param updater A function that receives the current config and mutates it in place.
   * @param options Per-option location overrides (`{ [key]: locationName }`).
   */
  async updateConfig(
    updater: ConfigUpdater<T>,
    options?: { optionLocationOverrides?: Record<string, string> }
  ): Promise<void>;
  async updateConfig(
    valuesOrUpdater: Partial<T> | ConfigUpdater<T>,
    options?: { optionLocationOverrides?: Record<string, string> }
  ): Promise<void> {
    let values: Partial<T>;
    if (typeof valuesOrUpdater === 'function') {
      values = await this.trackUpdates(valuesOrUpdater);
    } else {
      values = valuesOrUpdater;
    }

    const optionLocationOverrides = options?.optionLocationOverrides ?? {};

    // Each update is keyed by `provider + targetPath` so multiple keys
    // headed to the same file are merged into a single write.
    const updatesByTarget = new Map<
      string,
      {
        provider: AnyProvider<T>;
        targetPath: string | URL;
        partial: Partial<T>;
      }
    >();

    const targetKey = (provider: AnyProvider<T>, path: string | URL) =>
      `${(provider as object).constructor?.name ?? 'p'}::${toFilePath(path)}`;

    for (const key of Object.keys(values) as (keyof T & string)[]) {
      const route = await this.resolveWriteRoute(
        key,
        optionLocationOverrides[key]
      );
      if (!route) {
        throw new Error(
          `Cannot update config key "${key}": no provenance, no defaultConfigLocation override, and no defaultLocation registered. ` +
            'Either pre-load a config file, set a defaultConfigLocation on the option, or set defaultLocation on a .config() call.'
        );
      }
      if (!route.provider.updateConfig) {
        throw new Error(
          `Cannot update config key "${key}": the owning provider does not implement updateConfig.`
        );
      }
      const tk = targetKey(route.provider, route.targetPath);
      const existing = updatesByTarget.get(tk) ?? {
        provider: route.provider,
        targetPath: route.targetPath,
        partial: {} as Partial<T>,
      };
      (existing.partial as any)[key] = values[key];
      updatesByTarget.set(tk, existing);
    }

    // Call each provider's updateConfig with an updater that merges the partial update.
    // Always pass `targetPath` so writes land in the exact source file.
    const promises: Promise<void>[] = [];
    for (const { provider, partial, targetPath } of updatesByTarget.values()) {
      promises.push(
        provider.updateConfig!(
          (current) => ({ ...(current ?? ({} as T)), ...partial }),
          { targetPath }
        )
      );
    }
    await Promise.all(promises);
  }

  /**
   * Resolves the `{ provider, targetPath }` to write a key to.
   * Returns `undefined` when no route can be determined.
   *
   * @param key The configuration key being written.
   * @param overrideName Optional named-location override for this key
   *   (from per-option `defaultConfigLocation`).
   */
  private async resolveWriteRoute(
    key: string,
    overrideName: string | undefined
  ): Promise<
    { provider: AnyProvider<T>; targetPath: string | URL } | undefined
  > {
    // 1. Provenance — write back to the source file the value came from.
    const prov = this.provenance.get(key);
    if (prov) {
      return { provider: prov.provider, targetPath: prov.resolvedPath };
    }

    // 2. Per-option override — find any entry that declares the named
    // location, in registration order.
    if (overrideName !== undefined) {
      const route = await this.resolveByLocationName(overrideName);
      if (route) return route;
    }

    // 3. Global defaultLocation per entry, in registration order.
    for (const entry of this.entries) {
      if (!entry.defaultLocation || !entry.locations) continue;
      const route = await this.resolveLocationOnEntry(
        entry,
        entry.defaultLocation
      );
      if (route) return route;
    }

    return undefined;
  }

  /**
   * Finds the first entry whose `locations` contains `name` and resolves
   * that location to a target path.
   */
  private async resolveByLocationName(
    name: string
  ): Promise<
    { provider: AnyProvider<T>; targetPath: string | URL } | undefined
  > {
    for (const entry of this.entries) {
      if (!entry.locations || !(name in entry.locations)) continue;
      const route = await this.resolveLocationOnEntry(entry, name);
      if (route) return route;
    }
    return undefined;
  }

  /**
   * Resolves a single named location on a specific entry to an executable
   * write target. Returns undefined if the location callback returns null
   * or the entry's provider is an aggregate without a leaf to write to.
   */
  private async resolveLocationOnEntry(
    entry: ProviderEntry<T>,
    name: string
  ): Promise<
    { provider: AnyProvider<T>; targetPath: string | URL } | undefined
  > {
    if (!entry.locations) return undefined;
    const spec = entry.locations[name];
    if (spec === undefined) return undefined;

    const resolved = await resolveLocationAsync(spec);
    if (resolved == null) return undefined;

    const provider = isAggregateConfigProvider(entry.provider)
      ? this.findFirstLeafProvider(entry.provider)
      : entry.provider;
    if (!provider || !provider.updateConfig) return undefined;
    return { provider, targetPath: resolved };
  }

  /**
   * Runs an updater function against a proxy of the merged config,
   * returning only the properties that were set during the callback.
   *
   * The proxy target is computed from:
   *
   * 1. The merged result of {@link load} against the current configuration
   *    root. This sees any provider whose walk-upward `resolve()` or named
   *    locations find a file.
   * 2. As a fallback, the file at any entry's `defaultLocation`, if that
   *    file exists on disk. This allows read-modify-write updaters to see
   *    the most recently persisted state even when the only file lives
   *    at a named location whose path is outside the configuration root.
   *
   * Without (2), a sequence like `init` → write via defaultLocation →
   * later `app.updateConfig(config => config.count + 1)` would always
   * see `count === undefined`.
   */
  private async trackUpdates(
    updater: ConfigUpdater<T>
  ): Promise<Partial<T>> {
    if (!this.lastConfigurationRoot) {
      throw new Error(
        'Cannot use updater function: config has not been loaded yet. Call load() first.'
      );
    }
    // Re-load to get the current merged config
    let current = this.load(this.lastConfigurationRoot);

    // Nothing resolved — try the first entry's defaultLocation file as a fallback.
    if (isEmptyObject(current) && this.provenance.size === 0) {
      for (const entry of this.entries) {
        if (!entry.defaultLocation || !entry.locations) continue;
        const route = await this.resolveLocationOnEntry(
          entry,
          entry.defaultLocation
        );
        if (!route) continue;
        const fs = getFileSystemProvider();
        const path = toFilePath(route.targetPath);
        if (!fs.existsSync(path)) continue;
        try {
          const loaded = route.provider.load(path);
          const { extends: _extendsIgnored, ...rest } = (loaded ?? {}) as {
            extends?: string;
          } & T;
          current = rest as T;
          break;
        } catch {
          // Failed to read the default-location file — keep iterating in
          // case a later entry's defaultLocation works, otherwise fall
          // through with the empty object load() returned.
        }
      }
    }

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
   * Finds the first non-aggregate leaf provider in a nested structure.
   */
  private findFirstLeafProvider(
    aggregate: AggregateConfigProvider<T>
  ): AnyProvider<T> | undefined {
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

/**
 * Synchronously resolves a {@link DefaultConfig} value. Sync values are
 * returned directly. A function spec is invoked, but only its synchronous
 * return value is used: thenables are skipped (returns null) since the
 * caller cannot await during a sync `load()`. Async-only locations are
 * still usable for writes via {@link resolveLocationAsync}.
 */
function resolveLocationSync(spec: DefaultConfig<any>): string | URL | null {
  if (typeof spec === 'function') {
    let value: unknown;
    try {
      value = (spec as () => unknown)();
    } catch {
      return null;
    }
    if (value && typeof (value as { then?: unknown }).then === 'function') {
      return null;
    }
    return (value as string | URL | null) ?? null;
  }
  return spec ?? null;
}

/**
 * Asynchronously resolves a {@link DefaultConfig} value, awaiting any
 * promise returned by a callback.
 */
async function resolveLocationAsync(
  spec: DefaultConfig<any>
): Promise<string | URL | null> {
  if (typeof spec === 'function') {
    try {
      const value = await (spec as () => string | URL | null | Promise<string | URL | null>)();
      return value ?? null;
    } catch {
      return null;
    }
  }
  return spec ?? null;
}
