/**
 * Browser-safe fallback for AsyncLocalStorage.
 *
 * Uses a simple last-set-wins store. This is correct for browser usage
 * where CLI execution is single-threaded/sequential.
 *
 * Swapped in via browserAlias in tsdown.config.mjs.
 */

export interface ForgeContextData {
  args: Record<string, unknown>;
  commandChain: string[];
  commandIdChain: string[];
  providers: Map<string, unknown>;
  providerFactories: Map<string, { factory: Function; lifetime: string }>;
  handlerPhase: boolean;
  /** Keys whose factories are currently being resolved — used for cycle detection */
  resolving: Set<string>;
}

let currentStore: ForgeContextData | undefined;
let activeRuns = 0;
let warnedAboutConcurrency = false;

/**
 * Emit a one-shot warning when a second `forge()`/`sdk()` call starts while
 * another is still on the stack. Real async-boundary isolation needs
 * `AsyncLocalStorage`, which browsers don't provide — this store is just a
 * last-set-wins global. The warning exists so misuse fails loudly instead of
 * silently leaking providers between concurrent executions.
 */
function warnOnceAboutConcurrency(): void {
  if (warnedAboutConcurrency) return;
  warnedAboutConcurrency = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[cli-forge] Concurrent forge()/sdk() execution detected in the browser. ' +
      'The browser build uses a last-set-wins context store because ' +
      'AsyncLocalStorage is unavailable, so DI providers may leak between ' +
      'overlapping executions. See docs: "DI and the browser runtime".'
  );
}

export const contextStorage = {
  run<T>(
    store: ForgeContextData,
    fn: (...args: unknown[]) => T,
    ...args: unknown[]
  ): T {
    if (activeRuns > 0) {
      warnOnceAboutConcurrency();
    }
    const prev = currentStore;
    currentStore = store;
    activeRuns++;
    try {
      return fn(...args);
    } finally {
      currentStore = prev;
      activeRuns--;
    }
  },
  getStore(): ForgeContextData | undefined {
    return currentStore;
  },
  enterWith(store: ForgeContextData | undefined): void {
    currentStore = store;
  },
};
