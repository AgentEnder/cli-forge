import type { InternalOptionConfig } from '@cli-forge/parser';
import type {
  PromptConfig,
  PromptOption,
  PromptOptionConfig,
  PromptProvider,
} from './prompt-types';

/**
 * Collects options that need prompting, matches them to providers,
 * executes prompts, and returns the prompted values.
 */
export async function resolvePrompts(opts: {
  configuredOptions: Record<string, InternalOptionConfig>;
  configuredImplies: Record<string, Set<string>>;
  promptConfigs: Map<string, PromptOptionConfig<any>>;
  providers: PromptProvider[];
  currentArgs: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const {
    configuredOptions,
    configuredImplies,
    promptConfigs,
    providers,
    currentArgs,
  } = opts;

  // Step 1: Collect promptable options
  const promptableOptions: PromptOption[] = [];

  for (const [name, config] of Object.entries(configuredOptions)) {
    // Skip internal options
    if (
      name === 'help' ||
      name === 'version' ||
      name === 'unmatched' ||
      name === '--'
    ) {
      continue;
    }

    // Already has a value — skip unless prompt is explicitly true/string
    const hasValue = currentArgs[name] !== undefined;

    const promptSetting = promptConfigs.get(name);
    let resolved: PromptConfig | null | undefined;

    if (typeof promptSetting === 'function') {
      resolved = promptSetting(currentArgs);
      // Callback: null/undefined treated as false
      if (resolved === null || resolved === undefined) {
        continue;
      }
    } else if (promptSetting !== undefined) {
      // Static value
      resolved = promptSetting;
    } else {
      // Not specified: prompt only if required and missing value
      if (hasValue) continue;

      const isRequired = config.required === true;
      const isImplied = isOptionImplied(name, configuredImplies, currentArgs);

      if (!isRequired && !isImplied) continue;
      if (providers.length === 0) continue; // No providers, let validation handle it

      resolved = true; // Will prompt
    }

    if (resolved === false) continue;
    if (hasValue && resolved !== true && typeof resolved !== 'string') continue;

    promptableOptions.push({
      name,
      config: {
        ...config,
        prompt: resolved === true ? true : resolved ?? undefined,
      },
    });
  }

  if (promptableOptions.length === 0) {
    return {};
  }

  // Step 2: Match options to providers
  const filteredProviders = providers.filter((p) => p.filter);
  const fallbackProviders = providers.filter((p) => !p.filter);

  const providerGroups = new Map<PromptProvider, PromptOption[]>();
  const unmatchedOptions: PromptOption[] = [];

  for (const option of promptableOptions) {
    let matched = false;
    for (const provider of filteredProviders) {
      if (provider.filter!(option.name, option.config)) {
        if (!providerGroups.has(provider)) {
          providerGroups.set(provider, []);
        }
        providerGroups.get(provider)!.push(option);
        matched = true;
        break;
      }
    }
    if (!matched) {
      unmatchedOptions.push(option);
    }
  }

  // Assign unmatched options to first fallback provider
  if (unmatchedOptions.length > 0) {
    if (fallbackProviders.length === 0) {
      const names = unmatchedOptions.map((o) => `'${o.name}'`).join(', ');
      throw new Error(
        `Option(s) ${names} require prompting but no prompt provider is available`
      );
    }
    const fallback = fallbackProviders[0];
    if (!providerGroups.has(fallback)) {
      providerGroups.set(fallback, []);
    }
    providerGroups.get(fallback)!.push(...unmatchedOptions);
  }

  // Step 3: Execute prompts
  const results: Record<string, unknown> = {};

  for (const [provider, options] of providerGroups) {
    if (provider.promptBatch) {
      const batchResults = await provider.promptBatch(options);
      Object.assign(results, batchResults);
    } else if (provider.prompt) {
      for (const option of options) {
        results[option.name] = await provider.prompt(option);
      }
    }
  }

  return results;
}

/**
 * Check if an option is implied by another option that has been set.
 */
function isOptionImplied(
  name: string,
  configuredImplies: Record<string, Set<string>>,
  currentArgs: Record<string, unknown>
): boolean {
  for (const [trigger, implied] of Object.entries(configuredImplies)) {
    if (implied.has(name) && currentArgs[trigger] !== undefined) {
      return true;
    }
  }
  return false;
}
