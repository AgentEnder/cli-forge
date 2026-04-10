import {
  InternalOptionConfig,
  UnknownOptionConfig,
  readDefaultValue,
  isOneOfOptionConfig,
  isObjectOptionConfig,
} from '@cli-forge/parser';
import { InternalCLI } from './internal-cli';

export function formatHelp(parentCLI: InternalCLI<any>): string {
  const help: string[] = [];
  let command = parentCLI;
  let epilogue = parentCLI.configuration?.epilogue;
  for (const key of parentCLI.commandChain) {
    command = command.registeredCommands[key] as typeof parentCLI;

    // Properties that are ineherited from the parent command should be copied over
    if (command.configuration?.epilogue) {
      epilogue = command.configuration.epilogue;
    }
  }
  help.push(
    `Usage: ${
      command.configuration?.usage
        ? command.configuration.usage
        : [
            parentCLI.name,
            ...parentCLI.commandChain,
            ...command.parser.configuredPositionals.map((p) => {
              const displayKey = command.parser.getDisplayKey(p.key);
              return p.required ? `<${displayKey}>` : `[${displayKey}]`;
            }),
          ].join(' ')
    }`
  );
  if (command.configuration?.description) {
    help.push(command.configuration.description);
  }
  if (Object.keys(command.registeredCommands).length > 0) {
    help.push('');
    help.push('Commands:');
  }
  // Track displayed commands by their actual CLI instance to avoid duplicates
  const displayedCommands = new Set<InternalCLI<any, any, any, any>>();
  for (const key in command.registeredCommands) {
    const subcommand = command.registeredCommands[key];
    // Skip if we've already displayed this command instance
    if (displayedCommands.has(subcommand)) {
      continue;
    }
    displayedCommands.add(subcommand);
    // Use the localized command name for display based on the command's default name
    const displayKey = command.getLocalizedCommandName(subcommand.name);
    help.push(
      `  ${displayKey}${
        subcommand.configuration?.description
          ? ' - ' + subcommand.configuration.description
          : ''
      }`
    );
  }
  const groupedOptions = parentCLI.getGroupedOptions();
  const nonpositionalOptions = Object.values(
    command.parser.configuredOptions
  ).filter((c) => !c.positional && !c.hidden);

  help.push(...getOptionBlock('Options', nonpositionalOptions, command.parser));

  for (const { label, keys } of groupedOptions) {
    help.push(...getOptionBlock(label, keys, command.parser));
  }

  if (command.configuration?.examples?.length) {
    help.push('');
    help.push('Examples:');
    for (const example of command.configuration.examples) {
      help.push(`  \`${example}\``);
    }
  }

  const configDocs = command.parser.getConfigurationDocs();
  if (configDocs.length > 0) {
    help.push('');
    help.push('Configuration:');
    for (const section of configDocs) {
      help.push(`  ${section.heading}`);
      help.push(`    ${section.body}`);
    }
  }

  if (Object.keys(command.registeredCommands).length > 0) {
    help.push(' ');
    help.push(
      `Run \`${[parentCLI.name, ...parentCLI.commandChain].join(
        ' '
      )} [command] --help\` for more information on a command`
    );
  }

  if (epilogue) {
    help.push('');
    help.push(epilogue);
  }

  return help.join('\n');
}

function getOptionParts(option: UnknownOptionConfig) {
  const parts = [];
  if (option.description) {
    parts.push(option.description);
  }
  if (isOneOfOptionConfig(option)) {
    const { valueTypes } = option;
    const typeNames = valueTypes.map((vt) => vt.type).join('|');
    parts.push(`[${typeNames}]`);
    for (const vt of valueTypes) {
      const subParts: string[] = [];
      if (vt.description) {
        subParts.push(vt.description);
      }
      if (vt.choices) {
        const choices =
          typeof vt.choices === 'function' ? vt.choices() : vt.choices;
        subParts.push(`(${choices.join(', ')})`);
      }
      if (subParts.length > 0) {
        parts.push(`${vt.type}: ${subParts.join(' ')}`);
      }
    }
  } else if ('choices' in option && option.choices) {
    const choices =
      typeof option.choices === 'function' ? option.choices() : option.choices;
    parts.push(`(${choices.join(', ')})`);
  }
  if (option.default) {
    parts.push(
      '[default: ' + formatDefaultValue(readDefaultValue(option)) + ']'
    );
  } else if (option.required) {
    parts.push('[required]');
  }
  if (option.deprecated) {
    parts.push('[deprecated: ' + option.deprecated + ']');
  }
  return parts;
}

function formatDefaultValue([value, description]: [any, string | undefined]) {
  if (description) {
    return description;
  }
  return removeTrailingAndLeadingQuotes(JSON.stringify(value));
}

function removeTrailingAndLeadingQuotes(str: string) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '');
}

/**
 * Extract the merged properties from a oneOf config's object valueTypes.
 * When a oneOf has object branches, their properties can be set via dot notation,
 * so we merge them for display in help output.
 */
function getOneOfObjectProperties(
  config: UnknownOptionConfig
): Record<string, UnknownOptionConfig> | undefined {
  if (!isOneOfOptionConfig(config)) return undefined;
  const merged: Record<string, UnknownOptionConfig> = {};
  let found = false;
  for (const vt of config.valueTypes) {
    if (
      vt.type === 'object' &&
      'properties' in vt &&
      vt.properties &&
      typeof vt.properties === 'object'
    ) {
      found = true;
      for (const [k, v] of Object.entries(
        vt.properties as Record<string, UnknownOptionConfig>
      )) {
        // First object branch wins for any given key
        if (!(k in merged)) {
          merged[k] = v;
        }
      }
    }
  }
  return found ? merged : undefined;
}

function collectObjectProperties(
  parentKey: string,
  properties: Record<string, UnknownOptionConfig>
): Array<{ key: string; config: UnknownOptionConfig }> {
  const result: Array<{ key: string; config: UnknownOptionConfig }> = [];
  for (const [name, config] of Object.entries(properties)) {
    if (config.hidden) continue;
    const fullKey = `${parentKey}.${name}`;
    result.push({ key: fullKey, config });
    if (isObjectOptionConfig(config) && config.properties) {
      result.push(
        ...collectObjectProperties(
          fullKey,
          config.properties as Record<string, UnknownOptionConfig>
        )
      );
    } else {
      const oneOfProps = getOneOfObjectProperties(config);
      if (oneOfProps) {
        result.push(...collectObjectProperties(fullKey, oneOfProps));
      }
    }
  }
  return result;
}

function getPropertyLines(
  parentKey: string,
  properties: Record<string, UnknownOptionConfig>
): string[] {
  const flatProps = collectObjectProperties(parentKey, properties);
  if (flatProps.length === 0) return [];

  const allParts: Array<[key: string, ...parts: string[]]> = [];
  for (const { key, config } of flatProps) {
    allParts.push([key, ...getOptionParts(config)]);
  }

  const paddingValues: number[] = [];
  for (let i = 0; i < allParts.length; i++) {
    for (let j = 0; j < allParts[i].length; j++) {
      if (!paddingValues[j]) {
        paddingValues[j] = 0;
      }
      paddingValues[j] = Math.max(paddingValues[j], allParts[i][j].length);
    }
  }

  const lines: string[] = [];
  for (const [key, ...parts] of allParts) {
    lines.push(
      `    --${key.padEnd(paddingValues[0])}${parts.length ? ' - ' : ''}${parts
        .map((part, i) => part.padEnd(paddingValues[i + 1]))
        .join(' ')}`
    );
  }
  return lines;
}

function getOptionBlock(
  label: string,
  options: InternalOptionConfig[],
  parser: import('@cli-forge/parser').ReadonlyArgvParser<any>
) {
  const lines: string[] = [];

  if (options.length > 0) {
    lines.push('');
    lines.push(label + ':');
  }

  const allParts: Array<[key: string, ...parts: string[]]> = [];
  for (const option of options) {
    // Use the display key (localized) instead of the storage key
    const displayKey = parser.getDisplayKey(option.key);
    allParts.push([displayKey, ...getOptionParts(option)]);
  }
  const paddingValues: number[] = [];
  for (let i = 0; i < allParts.length; i++) {
    for (let j = 0; j < allParts[i].length; j++) {
      if (!paddingValues[j]) {
        paddingValues[j] = 0;
      }
      paddingValues[j] = Math.max(paddingValues[j], allParts[i][j].length);
    }
  }
  for (let i = 0; i < allParts.length; i++) {
    const [key, ...parts] = allParts[i];
    lines.push(
      `  --${key.padEnd(paddingValues[0])}${parts.length ? ' - ' : ''}${parts
        .map((part, j) => part.padEnd(paddingValues[j + 1]))
        .join(' ')}`
    );
    const option = options[i];
    if (isObjectOptionConfig(option) && option.properties) {
      lines.push(
        ...getPropertyLines(
          option.key,
          option.properties as Record<string, UnknownOptionConfig>
        )
      );
    } else {
      const oneOfProps = getOneOfObjectProperties(option);
      if (oneOfProps) {
        lines.push(...getPropertyLines(option.key, oneOfProps));
      }
    }
  }
  return lines;
}
