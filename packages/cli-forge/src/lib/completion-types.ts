import type { ParsedArgs } from '@cli-forge/parser';

let fs: typeof import('fs') | undefined;
let path: typeof import('path') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  path = require('path');
} catch {
  // Running in a browser environment — filesystem completion helpers are unavailable.
}

/**
 * Context passed to completion callbacks.
 */
export interface CompletionContext<TArgs = ParsedArgs> {
  /** Partially-parsed args available so far */
  current: Partial<TArgs>;
  /** The raw argv being completed */
  argv: string[];
  /** Default completions cli-forge would return (subcommands, flags, choices) */
  defaultCompletions: string[];
}

/**
 * A completion callback that returns custom completion suggestions.
 * Used with `.completion()` on a CLI instance.
 */
export type CompletionCallback<TArgs = ParsedArgs> = (
  context: CompletionContext<TArgs>
) => string[] | Promise<string[]>;

/**
 * Per-option completion callback, attached to option configs via the `completion` field.
 */
export type OptionCompletionCallback<TArgs = ParsedArgs> = (
  context: CompletionContext<TArgs>
) => string[] | Promise<string[]>;

/**
 * Helpers for common completion scenarios.
 */
export const completionHelpers = {
  /**
   * Returns a completion callback that suggests filesystem paths.
   * @param glob Optional glob pattern to filter results (e.g. '*.json')
   */
  files(glob?: string): OptionCompletionCallback {
    return ({ argv }) => {
      if (!fs || !path) return [];
      const partial = argv[argv.length - 1] || '';
      const dir = partial ? path.dirname(partial) : '.';
      const prefix = partial ? path.basename(partial) : '';

      try {
        let entries: string[] = fs.readdirSync(dir === '' ? '.' : dir);

        if (prefix) {
          entries = entries.filter((e) => e.startsWith(prefix));
        }

        if (glob) {
          // Simple extension filter for patterns like '*.json'
          const ext = glob.startsWith('*.') ? glob.slice(1) : null;
          if (ext) {
            entries = entries.filter((e) => e.endsWith(ext));
          }
        }

        return entries.map((e) => (dir === '.' ? e : path!.join(dir, e)));
      } catch {
        return [];
      }
    };
  },
};
