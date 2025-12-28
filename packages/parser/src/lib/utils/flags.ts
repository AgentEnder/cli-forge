import { fromDashedToCamelCase } from './case-transformations';

export function isFlag(str: string): str is `-${string}` {
  return str.startsWith('-');
}
export function readArgKeys(str: `-${string}`, stripDashed = true): string[] {
  // Long flags (e.g. --foo)
  if (str.startsWith('--')) {
    const key = str.slice(2);
    if (key.includes('-')) {
      if (stripDashed) {
        // Return both camelCase and original dashed versions for strip-dashed support
        return [fromDashedToCamelCase(key), key];
      } else {
        // When stripDashed is false, only return the original dashed version
        return [key];
      }
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
