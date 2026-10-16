import {
  InternalOptionConfig,
  UnknownOptionConfig,
  readDefaultValue,
  isOneOfOptionConfig,
  isObjectOptionConfig,
} from '@cli-forge/parser';
import { AnyInternalCLI } from './internal-cli';

export function formatHelp(
  parentCLI: AnyInternalCLI,
  hiddenKeys?: Set<string>
): string {
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
  // Track displayed commands by their actual CLI instance to avoid duplicates
  const displayedCommands = new Set<AnyInternalCLI>();
  const visibleSubcommands: AnyInternalCLI[] = [];
  for (const key in command.registeredCommands) {
    const subcommand = command.registeredCommands[key];
    // Skip if we've already displayed this command instance
    if (displayedCommands.has(subcommand)) {
      continue;
    }
    displayedCommands.add(subcommand);
    if (subcommand.configuration?.hidden) {
      continue;
    }
    visibleSubcommands.push(subcommand);
  }
  if (visibleSubcommands.length > 0) {
    help.push('');
    help.push('Commands:');
  }
  for (const subcommand of visibleSubcommands) {
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
  ).filter(
    (c) => !c.positional && !c.hidden && !(hiddenKeys && hiddenKeys.has(c.key))
  );

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

  if (visibleSubcommands.length > 0) {
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

/**
 * Renders a single option's help text line, applying any per-option
 * `formatHelpText` override.
 *
 * Note: The returned text is **not** column-aligned, since alignment
 * requires knowing all sibling options. This matches the `defaultText`
 * passed to `formatHelpText` callbacks in the full help output.
 *
 * @param option The option configuration.
 * @param displayKey The display key (may be localized).
 * @returns The formatted help text line for this option.
 */
export function renderOptionHelpText(
  option: UnknownOptionConfig & { key: string },
  displayKey: string
): string {
  const parts = getOptionParts(option);
  const defaultText = `  --${displayKey}${parts.length ? ' - ' : ''}${parts.join(' ')}`;
  if (option.formatHelpText) {
    return option.formatHelpText(option as any, defaultText);
  }
  return defaultText;
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

function getPropertyEntries(
  option: UnknownOptionConfig
): Array<{ key: string; config: UnknownOptionConfig }> {
  let properties: Record<string, UnknownOptionConfig> | undefined;
  if (isObjectOptionConfig(option) && option.properties) {
    properties = option.properties as Record<string, UnknownOptionConfig>;
  } else {
    properties = getOneOfObjectProperties(option);
  }
  if (!properties) return [];
  return collectObjectProperties(
    (option as InternalOptionConfig).key,
    properties
  );
}

function formatFlag(name: string): string {
  return name.length === 1 ? `-${name}` : `--${name}`;
}

function getDisplayAliases(
  option: InternalOptionConfig,
  displayKey: string
): string[] {
  const aliases = option.alias ?? [];
  if (aliases.length === 0) return [];
  const hiddenAliases = option.hiddenAliases ?? [];
  return aliases.filter(
    (alias) => alias !== displayKey && !hiddenAliases.includes(alias)
  );
}

function buildFlagColumn(displayKey: string, aliases: string[]): string {
  return [formatFlag(displayKey), ...aliases.map(formatFlag)].join(', ');
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

  // Collect all entries (options + their property sub-entries) into a flat list.
  // Options with a custom `formatHelpText` get a `customRender` function that
  // replaces the standard aligned rendering for that entry.
  const entries: Array<{
    flagColumn: string;
    parts: string[];
    indent: number;
    customRender?: (defaultText: string) => string;
  }> = [];

  for (const option of options) {
    const displayKey = parser.getDisplayKey(option.key);
    const aliases = getDisplayAliases(option, displayKey);
    entries.push({
      flagColumn: buildFlagColumn(displayKey, aliases),
      parts: getOptionParts(option),
      indent: 0,
      customRender: option.formatHelpText
        ? (_defaultText) => option.formatHelpText!(option as any, _defaultText)
        : undefined,
    });
    for (const { key, config } of getPropertyEntries(option)) {
      entries.push({
        flagColumn: `--${key}`,
        parts: getOptionParts(config),
        indent: 2,
      });
    }
  }

  // Compute flag column width accounting for indent so all `-` separators align.
  // Custom-rendered entries are excluded from padding calculation.
  let flagColumnWidth = 0;
  for (const entry of entries) {
    if (!entry.customRender) {
      flagColumnWidth = Math.max(
        flagColumnWidth,
        entry.indent + entry.flagColumn.length
      );
    }
  }

  // Compute padding for each part column across standard entries
  const partPadding: number[] = [];
  for (const entry of entries) {
    if (entry.customRender) continue;
    for (let j = 0; j < entry.parts.length; j++) {
      if (!partPadding[j]) {
        partPadding[j] = 0;
      }
      partPadding[j] = Math.max(partPadding[j], entry.parts[j].length);
    }
  }

  // Render in original order — custom entries use their callback,
  // standard entries use column-aligned formatting.
  for (const { flagColumn, parts, indent, customRender } of entries) {
    const defaultText = `${' '.repeat(2 + indent)}${flagColumn}${
      parts.length ? ' - ' : ''
    }${parts.join(' ')}`;
    if (customRender) {
      lines.push(customRender(defaultText));
    } else {
      const paddedFlagColumn = flagColumn.padEnd(flagColumnWidth - indent);
      lines.push(
        `${' '.repeat(2 + indent)}${paddedFlagColumn}${
          parts.length ? ' - ' : ''
        }${parts.map((part, i) => part.padEnd(partPadding[i])).join(' ')}`
      );
    }
  }
  return lines;
}
