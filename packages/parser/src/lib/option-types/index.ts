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
export type InternalOptionConfig = UnknownOptionConfig & {
  key: string;
  position?: number;
  /**
   * Aliases that should be omitted from help output and generated
   * documentation. This covers both aliases the user explicitly marked
   * `hidden: true` and aliases that were added automatically by the parser
   * (strip-dashed conversions, localized keys).
   */
  hiddenAliases?: string[];
};
