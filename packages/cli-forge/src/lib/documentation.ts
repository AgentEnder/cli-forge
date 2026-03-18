import {
  UnknownOptionConfig,
  OptionConfigToType,
  readDefaultValue,
  LocalizationDictionary,
  ConfigurationFiles,
} from '@cli-forge/parser';
import { InternalCLI } from './internal-cli';
import { CLI } from './public-api';

export type Documentation = {
  name: string;
  description?: string;
  epilogue?: string;
  usage: string;
  examples: string[];
  options: Readonly<Record<string, NormalizedOptionConfig>>;
  positionals: readonly Readonly<NormalizedOptionConfig>[];
  groupedOptions: Array<{
    label: string;
    keys: Array<NormalizedOptionConfig>;
  }>;
  subcommands: Documentation[];
  /**
   * Describes how configuration is loaded for this command.
   * Each section is produced by a provider's `describeConfig` method.
   */
  configurationSources?: ConfigurationFiles.ConfigurationDocSection[];
  /**
   * Localized keys for options and commands. Maps from default key to full localization entry.
   * Only present if localization is configured.
   */
  localizedKeys?: LocalizationDictionary;
};

function normalizeOptionConfigForDocumentation<T extends UnknownOptionConfig>(
  option: T,
  key: string
) {
  const { default: declaredDefault, ...rest } = option;
  let resolvedDefault: OptionConfigToType<T> | string | undefined;
  if (declaredDefault !== undefined) {
    const [defaultValue, description] = readDefaultValue(option);
    resolvedDefault = description ?? defaultValue;
  }
  const result: typeof rest & {
    key: string;
    default?: OptionConfigToType<T> | string | undefined;
  } = { ...rest, key };
  if (resolvedDefault !== undefined) {
    result.default = resolvedDefault;
  }
  return result;
}

type NormalizedOptionConfig<
  T extends UnknownOptionConfig = UnknownOptionConfig
> = ReturnType<typeof normalizeOptionConfigForDocumentation<T>>;

export function generateDocumentation(
  cli: InternalCLI,
  commandChain: string[] = []
) {
  // Ensure current command's options are built.
  if (cli.configuration?.builder) {
    // The cli instance here is typed a bit too well
    // for the builder function, so we need to cast it to
    // a more generic form.
    cli.configuration.builder(cli as unknown as CLI);
  }
  const parser = cli.getParser();

  const groupedOptions = cli.getGroupedOptions();
  const options: Record<string, NormalizedOptionConfig> = Object.fromEntries(
    Object.entries(parser.configuredOptions)
      .filter(([, c]) => !c.hidden)
      .map(([k, v]) => [k, normalizeOptionConfigForDocumentation(v, k)])
  );
  const positionals = parser.configuredPositionals;
  for (const positional of positionals) {
    delete options[positional.key];
  }
  const subcommands: Documentation[] = [];
  for (const subcommand of Object.values(cli.getSubcommands())) {
    if (subcommand.configuration?.hidden !== true) {
      const clone = subcommand.clone();
      if (clone.configuration) {
        clone.configuration.epilogue ??= cli.configuration?.epilogue;
      }
      subcommands.push(
        generateDocumentation(clone, [...commandChain, cli.name])
      );
    }
  }

  Object.values(cli.getSubcommands()).map((cmd) =>
    generateDocumentation(cmd.clone(), [...commandChain, cli.name])
  );

  // Get the localization dictionary if configured
  const dictionary = parser.getLocalizationDictionary();
  let localizedKeys: LocalizationDictionary | undefined;
  
  if (dictionary) {
    // Filter to only include keys that are actually used in this CLI
    const usedKeys: LocalizationDictionary = {};
    let hasUsedKeys = false;
    
    for (const key in parser.configuredOptions) {
      if (dictionary[key]) {
        usedKeys[key] = dictionary[key];
        hasUsedKeys = true;
      }
    }
    
    // Also include command names - track unique commands by instance to avoid duplicates
    const seenCommands = new Set<InternalCLI<any, any, any, any>>();
    for (const cmdKey in cli.getSubcommands()) {
      const cmdInstance = cli.getSubcommands()[cmdKey];
      if (!seenCommands.has(cmdInstance)) {
        seenCommands.add(cmdInstance);
        const defaultName = cmdInstance.name;
        if (dictionary[defaultName]) {
          usedKeys[defaultName] = dictionary[defaultName];
          hasUsedKeys = true;
        }
      }
    }
    
    if (hasUsedKeys) {
      localizedKeys = usedKeys;
    }
  }

  const result: Documentation = {
    name: cli.name,
    description: cli.configuration?.description,
    usage: cli.configuration?.usage
      ? commandChain.length
        ? [...commandChain, cli.configuration.usage].join(' ')
        : cli.configuration?.usage
      : [
          ...commandChain,
          cli.name,
          ...positionals.map((p) => (p.required ? `<${p.key}>` : `[${p.key}]`)),
        ].join(' '),
    epilogue: cli.configuration?.epilogue,
    examples: cli.configuration?.examples ?? [],
    groupedOptions,
    options,
    positionals,
    subcommands,
  };

  const configDocs = parser.getConfigurationDocs();
  if (configDocs.length > 0) {
    result.configurationSources = configDocs;
  }

  if (localizedKeys) {
    result.localizedKeys = localizedKeys;
  }

  return result;
}
