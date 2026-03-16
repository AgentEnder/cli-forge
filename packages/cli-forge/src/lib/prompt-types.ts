import type { InternalOptionConfig } from '@cli-forge/parser';

/**
 * Static prompt configuration for an option.
 * - `true` — always prompt
 * - `string` — always prompt with this label
 * - `false` — never prompt
 */
export type PromptConfig = boolean | string;

/**
 * Full prompt configuration, including dynamic resolution.
 * When a function is provided, it receives accumulated args and returns
 * a static PromptConfig. Returning null/undefined from the callback
 * is treated as falsy (don't prompt).
 */
export type PromptOptionConfig<TArgs = unknown> =
  | PromptConfig
  | ((args: Partial<TArgs>) => PromptConfig | null | undefined);

/**
 * An option that needs prompting, passed to prompt providers.
 */
export interface PromptOption {
  /** The option name (key) */
  name: string;
  /** The full option config from the parser, with resolved prompt value */
  config: InternalOptionConfig & { prompt?: PromptConfig };
}

/**
 * A prompt provider that can fulfill missing option values interactively.
 */
export interface PromptProvider {
  /**
   * If provided, this provider only handles options where filter returns true.
   * Providers without filters act as fallbacks.
   */
  filter?: (name: string, config: InternalOptionConfig) => boolean;
  /**
   * Prompt for a single option. Called per-option if promptBatch is not defined.
   */
  prompt?: (option: PromptOption) => Promise<unknown>;
  /**
   * Prompt for multiple options at once. Preferred over prompt when available.
   */
  promptBatch?: (options: PromptOption[]) => Promise<Record<string, unknown>>;
}
