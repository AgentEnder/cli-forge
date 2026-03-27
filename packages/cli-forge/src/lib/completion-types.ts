import type { ParsedArgs } from '@cli-forge/parser';
import { getFileSystemProvider } from '@cli-forge/parser';

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
      const fs = getFileSystemProvider();
      const partial = argv[argv.length - 1] || '';
      const dir = partial ? fs.dirname(partial) : '.';
      const prefix = partial ? fs.basename(partial) : '';

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

        return entries.map((e) => (dir === '.' ? e : fs.join(dir, e)));
      } catch {
        return [];
      }
    };
  },
};
