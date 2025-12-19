import {
  ResolveOptionType,
  WithOptional,
  ResolveProperties,
} from './type-resolution';

/**
 * Converts an OptionConfig to the TypeScript type for the parsed value.
 * Uses shared type resolution logic from type-resolution.ts.
 */
export type OptionConfigToType<TOptionConfig extends { type: string }> =
  WithOptional<ResolveOptionType<TOptionConfig>, TOptionConfig>;

// Re-export for use in other modules
export type { ResolveProperties };
