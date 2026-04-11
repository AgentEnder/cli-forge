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
  providers: Map<string, unknown>;
  providerFactories: Map<string, { factory: Function; lifetime: string }>;
  handlerPhase: boolean;
}

let currentStore: ForgeContextData | undefined;

export const contextStorage = {
  run<T>(
    store: ForgeContextData,
    fn: (...args: unknown[]) => T,
    ...args: unknown[]
  ): T {
    const prev = currentStore;
    currentStore = store;
    try {
      return fn(...args);
    } finally {
      currentStore = prev;
    }
  },
  getStore(): ForgeContextData | undefined {
    return currentStore;
  },
  enterWith(store: ForgeContextData | undefined): void {
    currentStore = store as ForgeContextData | undefined;
  },
};
