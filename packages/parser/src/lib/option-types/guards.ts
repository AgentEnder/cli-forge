import type { UnknownOptionConfig } from './option-config';
import type { ObjectOptionConfig } from './object';
import type { BooleanOptionConfig } from './boolean';
import type { OneOfOptionConfig } from './one-of';
import type { ArrayOptionConfig } from './array';
import type { StringOptionConfig } from './string';
import type { NumberOptionConfig } from './number';

export function isOneOfOptionConfig(
  config: UnknownOptionConfig
): config is OneOfOptionConfig {
  return config.type === 'oneOf';
}

export function isObjectOptionConfig(
  config: UnknownOptionConfig
): config is ObjectOptionConfig<any, any> {
  return config.type === 'object';
}

export function isBooleanOptionConfig(
  config: UnknownOptionConfig
): config is BooleanOptionConfig {
  return config.type === 'boolean';
}

export function isArrayOptionConfig(
  config: UnknownOptionConfig
): config is ArrayOptionConfig {
  return config.type === 'array';
}

export function isStringOptionConfig(
  config: UnknownOptionConfig
): config is StringOptionConfig {
  return config.type === 'string';
}

export function isNumberOptionConfig(
  config: UnknownOptionConfig
): config is NumberOptionConfig {
  return config.type === 'number';
}

/**
 * Check if a config supports boolean-like negation (--no-flag).
 * True for boolean options and oneOf options containing a boolean valueType.
 */
export function supportsNegation(config: UnknownOptionConfig): boolean {
  return (
    isBooleanOptionConfig(config) ||
    (isOneOfOptionConfig(config) &&
      config.valueTypes.some((vt) => vt.type === 'boolean'))
  );
}
