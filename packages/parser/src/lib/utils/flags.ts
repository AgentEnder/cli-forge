import { fromDashedToCamelCase } from './case-transformations';

/**
 * The keys a flag token resolves to, tagged with how the token produced them.
 *
 * The distinction matters when a key fails to resolve to a configured option:
 * a long flag yields alternate *spellings of one option*, so an unresolved
 * spelling is expected, while a short-flag group yields *distinct options*, so
 * an unresolved character is a genuine unknown flag.
 */
export type ReadArgKeysResult =
  | {
      /** A long flag (`--foo-bar`). `keys` are alternate spellings of one option. */
      kind: 'long';
      keys: string[];
    }
  | {
      /**
       * A short flag or short-flag group (`-f`, `-fb`). Each entry in `keys` is
       * a single character naming a distinct option.
       */
      kind: 'short';
      keys: string[];
    };

export function isFlag(str: string): str is `-${string}` {
  return str.startsWith('-');
}
export function readArgKeys(
  str: `-${string}`,
  stripDashed = true
): ReadArgKeysResult {
  // Long flags (e.g. --foo)
  if (str.startsWith('--')) {
    const key = str.slice(2);
    if (key.includes('-')) {
      if (stripDashed) {
        // Return both camelCase and original dashed versions for strip-dashed support
        return { kind: 'long', keys: [fromDashedToCamelCase(key), key] };
      } else {
        // When stripDashed is false, only return the original dashed version
        return { kind: 'long', keys: [key] };
      }
    }
    return { kind: 'long', keys: [key] };
    // Short flag combinations (e.g. -xvf)
  } else if (str.startsWith('-')) {
    return { kind: 'short', keys: str.slice(1).split('') };
  }
  throw new Error(`Invalid flag ${str}`);
}
export function isNextFlag(str: string) {
  return str.startsWith('--') || str.startsWith('-');
}
