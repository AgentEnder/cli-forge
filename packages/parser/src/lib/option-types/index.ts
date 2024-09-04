import { OptionConfig } from './option-config';

export * from './option-config-to-type';
export * from './common';
export * from './array';
export * from './boolean';
export * from './number';
export * from './object';
export * from './string';

export { OptionConfig };

export type Internal<T extends OptionConfig> = T & InternalOptionConfig;
export type InternalOptionConfig = OptionConfig & {
  key: string;
  position?: number;
};
