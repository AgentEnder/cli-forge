import type { Readable, Writable } from 'node:stream';
import type { PromptOption, PromptProvider } from '../lib/prompt-types';

/**
 * Options for {@link createClackPromptProvider}.
 */
export interface ClackPromptProviderOptions {
  /**
   * Custom input stream to read from instead of `process.stdin`.
   * Useful for testing — pass a `Readable` with `isTTY = true` and
   * a no-op `setRawMode` to emulate a terminal.
   */
  input?: Readable;
  /**
   * Custom output stream to write to instead of `process.stdout`.
   */
  output?: Writable;
}

/**
 * Creates a prompt provider backed by @clack/prompts.
 * Requires `@clack/prompts` as a peer dependency.
 *
 * The provider uses dynamic imports so that `@clack/prompts` is only
 * loaded when prompting actually occurs.
 */
export function createClackPromptProvider(
  providerOptions?: ClackPromptProviderOptions
): PromptProvider {
  // Build the common stream options once; spread into every prompt call.
  const streamOpts: { input?: Readable; output?: Writable } = {};
  if (providerOptions?.input) streamOpts.input = providerOptions.input;
  if (providerOptions?.output) streamOpts.output = providerOptions.output;

  return {
    async promptBatch(
      options: PromptOption[]
    ): Promise<Record<string, unknown>> {
      const clack = await import('@clack/prompts');

      const results: Record<string, unknown> = {};

      for (const option of options) {
        const message = getLabel(option);
        const defaultValue = getDefault(option.config);

        let value: unknown;

        if (option.config.type === 'boolean') {
          value = await clack.confirm({
            ...streamOpts,
            message,
            initialValue:
              typeof defaultValue === 'boolean' ? defaultValue : undefined,
          });
        } else if (hasChoices(option.config)) {
          const choices = getChoices(option.config);
          if (option.config.type === 'array') {
            value = await clack.multiselect({
              ...streamOpts,
              message,
              options: choices.map((c) => ({ value: c, label: String(c) })),
            });
          } else {
            value = await clack.select({
              ...streamOpts,
              message,
              options: choices.map((c) => ({ value: c, label: String(c) })),
            });
          }
        } else if (option.config.type === 'number') {
          const raw = await clack.text({
            ...streamOpts,
            message,
            placeholder:
              defaultValue !== undefined ? String(defaultValue) : undefined,
            defaultValue:
              defaultValue !== undefined ? String(defaultValue) : undefined,
            validate: (val: string | undefined) => {
              if (val && isNaN(Number(val))) {
                return 'Please enter a valid number';
              }
              return undefined;
            },
          });

          if (clack.isCancel(raw)) {
            clack.cancel('Operation cancelled.');
            throw new Error('Prompt cancelled by user');
          }

          value = raw !== undefined && raw !== '' ? Number(raw) : defaultValue;
        } else {
          // string, array without choices
          value = await clack.text({
            ...streamOpts,
            message,
            placeholder:
              defaultValue !== undefined ? String(defaultValue) : undefined,
            defaultValue:
              defaultValue !== undefined ? String(defaultValue) : undefined,
          });
        }

        // clack returns a Symbol when the user cancels (Ctrl+C)
        if (clack.isCancel(value)) {
          clack.cancel('Operation cancelled.');
          throw new Error('Prompt cancelled by user');
        }

        results[option.name] = value;
      }

      return results;
    },
  };
}

/**
 * Default clack prompt provider, uses stdin/stdout
 */
export const ClackPromptProvider = createClackPromptProvider();

/**
 * Determine the label to show for a prompt option.
 * Priority: prompt string > description > option name.
 */
function getLabel(option: PromptOption): string {
  if (typeof option.config.prompt === 'string') {
    return option.config.prompt;
  }
  return option.config.description ?? option.name;
}

/**
 * Extract the default value from an option config.
 * Handles the three forms:
 * - Primitive value directly
 * - `{ value: T; description: string }` object
 * - `{ factory: () => T; description: string }` object
 */
function getDefault(config: PromptOption['config']): unknown {
  if (config.default === undefined) return undefined;
  if (typeof config.default === 'object' && config.default !== null) {
    if ('factory' in config.default) {
      return (config.default as { factory: () => unknown }).factory();
    }
    if ('value' in config.default) {
      return (config.default as { value: unknown }).value;
    }
  }
  return config.default;
}

function hasChoices(config: PromptOption['config']): boolean {
  return (
    'choices' in config &&
    (config as Record<string, unknown>)['choices'] !== undefined
  );
}

function getChoices(config: PromptOption['config']): unknown[] {
  const cfg = config as Record<string, unknown>;
  const choices = cfg['choices'];
  if (typeof choices === 'function') {
    return choices();
  }
  return (choices as unknown[]) ?? [];
}
