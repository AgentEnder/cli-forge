import type { CLI, AnyCLI, ProviderConfig, GlobalProviderConfig } from './public-api';
import { contextStorage, ForgeContextData } from './async-context';

// ─── Type Helpers ─────────────────────────────────────────────────────────────

/**
 * Recursively gathers all providers from a CLI and its ancestors.
 */
export type ProvidersOf<T> = T extends CLI<any, any, any, infer TParent, infer TProviders>
  ? TProviders & (TParent extends AnyCLI ? ProvidersOf<TParent> : Record<never, never>)
  : Record<never, never>;

/**
 * Infers the full CommandContext type from a CLI type.
 */
export type InferContextOfCommand<T extends AnyCLI> = T extends CLI<
  infer TArgs,
  any,
  infer TChildren,
  any,
  any
>
  ? CommandContext<TArgs, ProvidersOf<T>, TChildren>
  : never;

/**
 * The context object available inside a command handler via {@link getCommandContext}.
 */
export interface CommandContext<TArgs, TProviders, TChildren = {}> {
  /** The parsed arguments for the current command. */
  readonly args: TArgs;

  /**
   * The chain of command names from root to the currently executing command.
   * e.g. `['my-app', 'serve']`
   */
  readonly commandChain: string[];

  /**
   * Resolves a provider by its key.
   *
   * @param key The provider key (must be a key of TProviders)
   * @param defaultValue Optional fallback if the provider has no registered factory
   */
  inject<K extends keyof TProviders>(key: K): TProviders[K];
  inject<K extends keyof TProviders>(key: K, defaultValue: TProviders[K]): TProviders[K];

  /**
   * Returns a CommandContext scoped to a child command that was already executed.
   * The child command must appear in the current commandChain.
   */
  getChildContext<K extends keyof TChildren>(
    command: K & string
  ): TChildren[K] extends AnyCLI ? InferContextOfCommand<TChildren[K]> : never;
}

// ─── Module-level state ───────────────────────────────────────────────────────

/** Permanent cache for global-lifetime providers. Survives across executions. */
const globalProviderCache = new Map<string, unknown>();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function readStore(): ForgeContextData {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error(
      'No CLI context found. getCommandContext() must be called from within a command handler.'
    );
  }
  if (!store.handlerPhase) {
    throw new Error(
      'inject() can only be called during the handler phase. ' +
        'Do not call getCommandContext() during option builders or middleware.'
    );
  }
  return store;
}

const NOT_FOUND = Symbol('NOT_FOUND');

function resolveProvider(store: ForgeContextData, key: string): unknown | typeof NOT_FOUND {
  // 1. Check pre-cached/pre-resolved providers (use .has() to handle undefined values)
  if (store.providers.has(key)) {
    return store.providers.get(key);
  }

  // 2. Lazy-resolve from factories
  const registration = store.providerFactories.get(key);
  if (!registration) {
    return NOT_FOUND;
  }

  const { factory, lifetime } = registration;

  if (lifetime === 'global') {
    // Global: permanent module-level cache
    if (!globalProviderCache.has(key)) {
      globalProviderCache.set(key, (factory as GlobalProviderConfig<unknown>['factory'])());
    }
    const value = globalProviderCache.get(key);
    // Also cache in the store so subsequent inject() calls skip factory lookup
    store.providers.set(key, value);
    return value;
  } else {
    // executionScope: scoped to this execution, keyed by args identity
    const value = (factory as ProviderConfig<unknown>['factory'])(store.args);
    store.providers.set(key, value);
    return value;
  }
}

function createCommandContext(store: ForgeContextData): CommandContext<any, any, any> {
  return {
    get args() {
      return store.args;
    },

    get commandChain() {
      return store.commandChain;
    },

    inject(key: string, defaultValue?: unknown): unknown {
      const resolved = resolveProvider(store, key);
      if (resolved === NOT_FOUND) {
        if (arguments.length >= 2) {
          return defaultValue;
        }
        throw new Error(
          `No provider registered for key "${key}". ` +
            `Register it with .provide("${key}", { factory: ... }) on the CLI.`
        );
      }
      return resolved;
    },

    getChildContext(command: string): any {
      if (!store.commandChain.includes(command)) {
        throw new Error(
          `Command "${command}" is not in the current command chain: [${store.commandChain.join(', ')}]. ` +
            `getChildContext() can only be used with commands that have already executed.`
        );
      }
      return createCommandContext(store);
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the {@link CommandContext} for the currently executing command.
 *
 * Must be called from within a command handler (not during builders or middleware).
 *
 * @param cli Optional CLI instance used as a type witness for inference.
 *            At runtime the instance is ignored — the context is read from
 *            AsyncLocalStorage set by {@link forge}.
 *
 * @example
 * ```ts
 * import { getCommandContext } from 'cli-forge/context';
 *
 * const ctx = getCommandContext(myCommand);
 * const db = ctx.inject('db');
 * ```
 */
export function getCommandContext<T extends AnyCLI>(cli: T): InferContextOfCommand<T>;
export function getCommandContext<T extends AnyCLI>(): InferContextOfCommand<T>;
export function getCommandContext<T extends AnyCLI>(_cli?: T): InferContextOfCommand<T> {
  const store = readStore();
  return createCommandContext(store) as InferContextOfCommand<T>;
}
