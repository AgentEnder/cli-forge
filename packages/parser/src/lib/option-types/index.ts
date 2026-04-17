import { OptionConfig, UnknownOptionConfig } from './option-config';

export * from './option-config-to-type';
export * from './type-resolution';
export * from './common';
export * from './array';
export * from './boolean';
export * from './number';
export * from './object';
export * from './one-of';
export * from './guards';
export * from './string';

export type { OptionConfig, UnknownOptionConfig };

export type Internal<T extends UnknownOptionConfig> = T & InternalOptionConfig;
export type InternalOptionConfig = Omit<UnknownOptionConfig, 'alias'> & {
  key: string;
  position?: number;
  /**
   * Internally we flatten the user-provided alias array (which may contain
   * strings or `AliasConfig` objects) into a plain list of names. Hidden
   * aliases are tracked separately in {@link hiddenAliases}.
   */
  alias?: string[];
  /**
   * Aliases that should be omitted from help output and generated
   * documentation. This covers both aliases the user explicitly marked
   * `hidden: true` and aliases that were added automatically by the parser
   * (strip-dashed conversions, localized keys).
   */
  hiddenAliases?: string[];
};
