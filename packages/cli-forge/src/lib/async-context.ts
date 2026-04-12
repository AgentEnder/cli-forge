import { AsyncLocalStorage } from 'node:async_hooks';

export interface ForgeContextData {
  args: Record<string, unknown>;
  commandChain: string[];
  /**
   * Process-unique identifiers of every CLI instance from the root down to
   * the currently-running command. Used by `getCommandContext(cli)` to
   * validate the CLI reference passed as a type witness is any command on
   * the active chain — the root app, an ancestor, or the running command
   * itself. Accepting ancestors matters because standalone-composed
   * subcommands don't track their parent in the type system, so users
   * reliably have a reference to the root `app` but not always to the
   * specific running subcommand.
   */
  commandIdChain: string[];
  /** Pre-resolved eager providers and cached factory results */
  providers: Map<string, unknown>;
  /** Factory registrations for lazy resolution */
  providerFactories: Map<string, { factory: Function; lifetime: string }>;
  /** Whether inject() is currently allowed (only during handler phase) */
  handlerPhase: boolean;
  /** Keys whose factories are currently being resolved — used for cycle detection */
  resolving: Set<string>;
}

export const contextStorage = new AsyncLocalStorage<ForgeContextData | undefined>();
