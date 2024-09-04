import { OptionConfig } from '../option-types';
import { ParsedArgs } from '../parser';

export function getConfiguredOptionKey<T extends ParsedArgs>(
  key: string,
  configuredOptions: Partial<Record<keyof T, OptionConfig>>
): keyof T | undefined {
  if (key in configuredOptions) {
    return key as keyof T;
  }

  function normalizeNegatedBooleanKey(key: string) {
    if (
      key.startsWith('no') &&
      key.length > 2 &&
      key[2] === key[2].toUpperCase()
    ) {
      const stripped = key.slice(2);
      return [stripped[0].toLowerCase(), stripped.slice(1)].join('');
    }
    return key;
  }

  function normalizeObjectOptionKey(key: string) {
    if (key.includes('.')) {
      return key.split('.')[0];
    }
    return key;
  }

  // Handles booleans passed as `--no-foo`
  const normalizedKey = normalizeObjectOptionKey(
    normalizeNegatedBooleanKey(key)
  );

  if (normalizedKey in configuredOptions) {
    return normalizedKey as keyof T;
  }

  for (const configuredKey in configuredOptions) {
    const config = configuredOptions[configuredKey];
    if (config?.alias?.includes(key)) {
      return configuredKey as keyof T;
    }
    // Handles negated booleans that are aliased
    if (config?.type === 'boolean' && config.alias?.includes(normalizedKey)) {
      return configuredKey as keyof T;
    }
  }
  return undefined;
}
