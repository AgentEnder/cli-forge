import type { InternalOptionConfig } from '@cli-forge/parser';
import type { AnyInternalCLI } from './internal-cli';
import type { CompletionContext, OptionCompletionCallback } from './completion-types';

export interface ResolveCompletionsOptions {
  /** The root CLI instance */
  rootCLI: AnyInternalCLI;
  /** The raw argv (without --get-completions) */
  argv: string[];
}

/**
 * Compute default completions from a command's registered subcommands and options.
 */
function getDefaultCompletions(
  cmd: AnyInternalCLI
): string[] {
  const completions: string[] = [];

  // Subcommand names (deduplicated, excluding hidden)
  const seenCommands = new Set<AnyInternalCLI>();
  for (const [key, subcmd] of Object.entries(cmd.registeredCommands)) {
    if (seenCommands.has(subcmd)) continue;
    seenCommands.add(subcmd);
    if (subcmd.configuration?.hidden) continue;
    completions.push(key);
  }

  // Flag names (excluding hidden and positionals).
  // Show only one name per option: prefer the primary key, fall back
  // to the first alias if the key is somehow unavailable.
  const configuredOptions: Record<string, InternalOptionConfig> =
    cmd.parser.configuredOptions as any;
  const seenOptionKeys = new Set<string>();
  for (const [key, config] of Object.entries(configuredOptions)) {
    if (config.hidden) continue;
    if (config.configOnly) continue;
    if (config.positional) continue;
    // Deduplicate — the parser may register the same option under
    // both its camelCase key and dashed alias.
    const canonicalKey = config.key;
    if (seenOptionKeys.has(canonicalKey)) continue;
    seenOptionKeys.add(canonicalKey);
    completions.push(key.length === 1 ? `-${key}` : `--${key}`);
    if (config.alias) {
      for (const alias of config.alias) {
        // Include long-form aliases but skip single-char shortflags
        if (alias.length > 1) {
          completions.push(`--${alias}`);
        }
      }
    }
  }

  return completions;
}

/**
 * Determine if we're completing an option's value (the token after a flag like --foo).
 * Returns the option config key if so, null otherwise.
 */
function getOptionExpectingValue(
  argv: string[],
  configuredOptions: Record<string, InternalOptionConfig>
): string | null {
  if (argv.length < 1) return null;

  // The last token is what we're completing. If the second-to-last token
  // is a flag that expects a value, we're completing that flag's value.
  const penultimate = argv.length >= 2 ? argv[argv.length - 2] : null;
  if (!penultimate || !penultimate.startsWith('-')) return null;

  const key = penultimate.replace(/^-+/, '');

  // Direct key match
  if (configuredOptions[key] && configuredOptions[key].type !== 'boolean') {
    return configuredOptions[key].key;
  }

  // Alias match
  for (const [, config] of Object.entries(configuredOptions)) {
    if (config.alias?.includes(key) && config.type !== 'boolean') {
      return config.key;
    }
  }

  return null;
}

/**
 * Search for an option completion callback in the command chain (deepest first).
 */
function findOptionCompletionCallback(
  cmd: AnyInternalCLI,
  rootCLI: AnyInternalCLI,
  optionKey: string
): OptionCompletionCallback | undefined {
  // Walk from the deepest command upward
  let current: AnyInternalCLI | undefined = cmd;
  while (current) {
    const cb = current.completionConfigs.get(optionKey);
    if (cb) return cb;
    current = current.getParent() as
      | AnyInternalCLI
      | undefined;
  }
  // Also check root explicitly (may not be reachable via getParent chain)
  return rootCLI.completionConfigs.get(optionKey);
}

/**
 * Resolve completions for the current argv state.
 */
export async function resolveCompletions(
  options: ResolveCompletionsOptions
): Promise<string[]> {
  const { rootCLI, argv } = options;

  // Walk argv to find the deepest resolved subcommand.
  // Track built commands to avoid re-running builders on live objects.
  let currentCmd: AnyInternalCLI = rootCLI;
  const builtCommands = new Set<AnyInternalCLI>();

  for (const token of argv) {
    if (token.startsWith('-')) continue;

    const subcmd = currentCmd.registeredCommands[token];
    if (subcmd && subcmd.configuration) {
      if (!builtCommands.has(subcmd)) {
        builtCommands.add(subcmd);
        subcmd.parser = rootCLI.parser;
        subcmd.configuration.builder?.(subcmd as any);
      }
      currentCmd = subcmd;
    }
  }

  // Partially parse what we have so far (non-strict, no validation)
  let currentArgs: Record<string, any> = {};
  try {
    currentArgs = rootCLI.parser
      .clone({
        ...rootCLI.parser.options,
        strict: false,
        validate: false,
        unmatchedParser: () => false,
      })
      .parse(argv, {}) as any;
  } catch {
    // Ignore parse errors during completion
  }

  const defaultCompletions = getDefaultCompletions(currentCmd);

  const context: CompletionContext = {
    current: currentArgs,
    argv,
    defaultCompletions,
  };

  // Check if we're completing an option's value
  const configuredOptions = rootCLI.parser.configuredOptions as Record<
    string,
    InternalOptionConfig
  >;
  const optionKey = getOptionExpectingValue(argv, configuredOptions);
  if (optionKey) {
    // Per-option completion callback
    const optionCb = findOptionCompletionCallback(
      currentCmd,
      rootCLI,
      optionKey
    );
    if (optionCb) {
      return optionCb(context);
    }
    // If the option has choices, return those
    // Cast to any because InternalOptionConfig is a union where `choices`
    // isn't directly accessible without narrowing by type discriminator
    const optionConfig = configuredOptions[optionKey] as any;
    if (optionConfig?.choices) {
      const choices =
        typeof optionConfig.choices === 'function'
          ? optionConfig.choices()
          : optionConfig.choices;
      return (choices as unknown[]).map(String);
    }
    return [];
  }

  // Command-level completion callback (walk up to find one)
  let cmdForCallback: AnyInternalCLI | undefined = currentCmd;
  while (cmdForCallback) {
    if (cmdForCallback.completionCallback) {
      return cmdForCallback.completionCallback(context);
    }
    cmdForCallback = cmdForCallback.getParent() as
      | AnyInternalCLI
      | undefined;
  }

  // Return defaults
  return defaultCompletions;
}
