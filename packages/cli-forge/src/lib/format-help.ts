import {
  InternalOptionConfig,
  OptionConfig,
  readDefaultValue,
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
            ...command.parser.configuredPositionals.map((p) =>
              p.required ? `<${p.key}>` : `[${p.key}]`
            ),
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
  for (const key in command.registeredCommands) {
    const subcommand = command.registeredCommands[key];
    help.push(
      `  ${key}${
        subcommand.configuration?.description
          ? ' - ' + subcommand.configuration.description
          : ''
      }`
    );
  }
  const groupedOptions = parentCLI.getGroupedOptions();
  const nonpositionalOptions = Object.values(
    command.parser.configuredOptions
  ).filter((c) => !c.positional);

  help.push(...getOptionBlock('Options', nonpositionalOptions));

  for (const { label, keys } of groupedOptions) {
    help.push(...getOptionBlock(label, keys));
  }

  if (command.configuration?.examples?.length) {
    help.push('');
    help.push('Examples:');
    for (const example of command.configuration.examples) {
      help.push(`  \`${example}\``);
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

function getOptionParts(option: OptionConfig) {
  const parts = [];
  if (option.description) {
    parts.push(option.description);
  }
  if ('choices' in option && option.choices) {
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

function getOptionBlock(label: string, options: InternalOptionConfig[]) {
  const lines: string[] = [];

  if (options.length > 0) {
    lines.push('');
    lines.push(label + ':');
  }

  const allParts: Array<[key: string, ...parts: string[]]> = [];
  for (const option of options) {
    allParts.push([option.key, ...getOptionParts(option)]);
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
  for (const [key, ...parts] of allParts) {
    lines.push(
      `  --${key.padEnd(paddingValues[0])}${parts.length ? ' - ' : ''}${parts
        .map((part, i) => part.padEnd(paddingValues[i + 1]))
        .join(' ')}`
    );
  }
  return lines;
}
