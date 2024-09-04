import { InternalOptionConfig } from '@cli-forge/parser';
import { InternalCLI } from './internal-cli';

export function readOptionGroupsForCLI(parentCLI: InternalCLI<any>) {
  function registerGroupsFromCLI(cli: InternalCLI) {
    for (const { label, keys, sortOrder } of cli.registeredOptionGroups) {
      groups[label] ??= {
        keys: new Set(),
        sortOrder: Number.MAX_SAFE_INTEGER,
      };
      if (sortOrder) {
        groups[label].sortOrder = sortOrder;
      }
      for (const key of keys) {
        groups[label].keys.add(key);
      }
    }
  }

  const groups: Record<string, { keys: Set<string>; sortOrder: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  let command: InternalCLI<any> = parentCLI;
  registerGroupsFromCLI(command);
  for (const subcommand of parentCLI.commandChain) {
    command = command?.registeredCommands[subcommand];
    registerGroupsFromCLI(command);
  }
  const parserOptions: Record<string, InternalOptionConfig> =
    parentCLI.parser.configuredOptions;

  for (const key in parserOptions) {
    const option = parserOptions[key];
    if (option.group) {
      groups[option.group] ??= {
        keys: new Set(),
        sortOrder: Number.MAX_SAFE_INTEGER,
      };
      groups[option.group].keys.add(key);
    }
  }

  const groupedOptions: Array<{
    label: string;
    sortOrder: number;
    keys: Array<InternalOptionConfig>;
  }> = [];

  for (const label in groups) {
    const entry = {
      sortOrder: groups[label].sortOrder,
      keys: [] as InternalOptionConfig[],
      label,
    };
    for (const key of groups[label].keys) {
      const option = parserOptions[key];
      entry.keys.push(option);
      delete parserOptions[key];
    }
    groupedOptions.push(entry);
  }
  groupedOptions.sort((a, b) => {
    if (a.sortOrder === b.sortOrder) {
      return a.label.localeCompare(b.label);
    } else {
      return a.sortOrder - b.sortOrder;
    }
  });
  return groupedOptions;
}
