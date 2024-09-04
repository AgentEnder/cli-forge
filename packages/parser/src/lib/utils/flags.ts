import { fromDashedToCamelCase } from './case-transformations';

export function isFlag(str: string): str is `-${string}` {
  return str.startsWith('-');
}
export function readArgKeys(str: `-${string}`): string[] {
  // Long flags (e.g. --foo)
  if (str.startsWith('--')) {
    const key = str.slice(2);
    if (key.includes('-')) {
      return [fromDashedToCamelCase(key)];
    }
    return [str.slice(2)];
    // Short flag combinations (e.g. -xvf)
  } else if (str.startsWith('-')) {
    return str.slice(1).split('');
  }
  throw new Error(`Invalid flag ${str}`);
}
export function isNextFlag(str: string) {
  return str.startsWith('--') || str.startsWith('-');
}
