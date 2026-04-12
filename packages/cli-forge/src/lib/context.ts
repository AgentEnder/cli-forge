import type { CLI, AnyCLI, ProviderConfig, GlobalProviderConfig } from './public-api';
import { contextStorage, ForgeContextData } from './async-context';

// ─── Type Helpers ─────────────────────────────────────────────────────────────

/**
 * Recursively gathers all providers from a CLI and its ancestors.
 *
 * When a child command re-provides a key that its parent also provides, the
 * child's type shadows the parent's — matching the runtime override semantics
 * in `collectProviders()`. This is why the parent's providers are wrapped in
 * `Omit<..., keyof TProviders>` before being intersected with the child's.
 */
export type ProvidersOf<T> = T extends CLI<any, any, any, infer TParent, infer TProviders>
  ? TProviders &
      (TParent extends AnyCLI
        ? Omit<ProvidersOf<TParent>, keyof TProviders>
        : Record<never, never>)
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

/**
 * Clears the module-level cache for `lifetime: 'global'` providers.
 *
 * Global provider factories normally run once per Node process and their
 * result is memoized forever. That's the desired behavior in production —
 * it's also what makes them leak between tests. Call this from test setup
 * (or automatically via `TestHarness.clearMockedContexts()`) to get a clean
 * slate between specs that exercise global-lifetime providers.
 */
export function resetGlobalProviders(): void {
  globalProviderCache.clear();
}

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

  // 3. Cycle detection — a factory that inject()s a provider whose own
  //    factory inject()s back into this key would otherwise blow the stack.
  if (store.resolving.has(key)) {
    const cycle = [...store.resolving, key].join(' -> ');
    throw new Error(
      `Circular provider dependency detected while resolving "${key}": ${cycle}`
    );
  }

  const { factory, lifetime } = registration;
  store.resolving.add(key);
  try {
    if (lifetime === 'global') {
      // Global: permanent module-level cache
      if (!globalProviderCache.has(key)) {
        globalProviderCache.set(
          key,
          (factory as GlobalProviderConfig<unknown>['factory'])()
        );
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
  } finally {
    store.resolving.delete(key);
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
 * ## Runtime safety
 *
 * When called with a CLI instance, `getCommandContext` validates at runtime
 * that the instance is part of the active command chain — the root app,
 * any ancestor on the chain, or the currently-running subcommand. If you
 * pass a CLI that isn't in the chain (a sibling command, an unrelated app,
 * a descendant that didn't run), it throws with a descriptive error. This
 * catches the common bug where the wrong instance is passed as a type
 * witness and `inject()` silently returns the wrong providers.
 *
 * ## Two ways to reach subcommand-typed access
 *
 * **Option 1** — from the root, walk by name:
 * ```ts
 * const ctx = getCommandContext(app);
 * const buildCtx = ctx.getChildContext('build');
 * console.log(buildCtx.args.target);
 * ```
 *
 * **Option 2** — pass a composed subcommand reference directly, skipping
 * the `getChildContext` hop:
 * ```ts
 * import { build } from './build'; // standalone CLI composed into app
 * const ctx = getCommandContext(build);
 * console.log(ctx.args.target);
 * ```
 *
 * Both forms are runtime-safe. Option 2 is only typed if the subcommand
 * reference carries the full `TProviders` — i.e. the subcommand is declared
 * inside the parent's `.command('name', { builder, handler })` call, where
 * TypeScript can thread parent providers into the builder's `cmd`. A
 * standalone `cli('build', ...)` reference doesn't see inherited providers
 * in its type; use Option 1 for that shape.
 *
 * ## Type witness (no instance)
 *
 * The parameterless overload returns a context typed by an explicit generic
 * — useful when you can't get a live reference to the CLI from where the
 * handler is written. **This form has no runtime safety**: the `T` type
 * parameter is trusted as-is, so a mismatched generic silently returns a
 * context typed for a CLI that isn't running. Prefer passing the CLI
 * instance whenever feasible.
 *
 * @param cli CLI instance used as both a type witness for inference and
 *            a runtime identity check. Required for runtime-safe usage.
 *
 * @example
 * ```ts
 * import { getCommandContext } from 'cli-forge/context';
 * import { app } from './cli';
 *
 * const ctx = getCommandContext(app);
 * const db = ctx.inject('db');
 * ```
 */
export function getCommandContext<T extends AnyCLI>(cli: T): InferContextOfCommand<T>;
/**
 * Type-only overload: trusts `T` without runtime validation. Prefer the
 * instance-based overload whenever you can import the CLI that owns the
 * handler — this form exists as an escape hatch for cases where no live
 * CLI reference is reachable from the handler's module.
 */
export function getCommandContext<T extends AnyCLI>(): InferContextOfCommand<T>;
export function getCommandContext<T extends AnyCLI>(cli?: T): InferContextOfCommand<T> {
  const store = readStore();
  if (cli && typeof (cli as { commandId?: unknown }).commandId === 'string') {
    const { commandId } = cli as unknown as { commandId: string; name?: string };
    if (!store.commandIdChain.includes(commandId)) {
      const name = (cli as unknown as { name?: string }).name ?? commandId;
      throw new Error(
        `getCommandContext() was called with a CLI instance ("${name}", id=${commandId}) ` +
          `that is not part of the active command chain. ` +
          `Active chain ids: [${store.commandIdChain.join(', ')}]. ` +
          `Pass the root app, an ancestor on the chain, or the currently-running subcommand.`
      );
    }
  }
  return createCommandContext(store) as InferContextOfCommand<T>;
}
