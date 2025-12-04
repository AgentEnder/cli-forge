import { OptionConfig, UnknownOptionConfig } from './option-config';

export * from './option-config-to-type';
export * from './type-resolution';
export * from './common';
export * from './array';
export * from './boolean';
export * from './number';
export * from './object';
export * from './string';

export type { OptionConfig, UnknownOptionConfig };

export type Internal<T extends UnknownOptionConfig> = T & InternalOptionConfig;
export type InternalOptionConfig = UnknownOptionConfig & {
  key: string;
  position?: number;
};
