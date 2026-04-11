import { AsyncLocalStorage } from 'node:async_hooks';

export interface ForgeContextData {
  args: Record<string, unknown>;
  commandChain: string[];
  /** Pre-resolved eager providers and cached factory results */
  providers: Map<string, unknown>;
  /** Factory registrations for lazy resolution */
  providerFactories: Map<string, { factory: Function; lifetime: string }>;
  /** Whether inject() is currently allowed (only during handler phase) */
  handlerPhase: boolean;
}

export const contextStorage = new AsyncLocalStorage<ForgeContextData>();
