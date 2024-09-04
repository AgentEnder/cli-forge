import { OptionConfig } from '@cli-forge/parser';
import { InternalCLI } from './internal-cli';
import { CLI } from './public-api';

export type Documentation = {
  name: string;
  description?: string;
  epilogue?: string;
  usage: string;
  examples: string[];
  options: Readonly<Record<string, OptionConfig & { key: string }>>;
  positionals: readonly Readonly<OptionConfig & { key: string }>[];
  groupedOptions: Array<{
    label: string;
    keys: Array<OptionConfig & { key: string }>;
  }>;
  subcommands: Documentation[];
};

export function generateDocumentation(
  cli: InternalCLI,
  commandChain: string[] = []
) {
  // Ensure current command's options are built.
  if (cli.configuration?.builder) {
    // The cli instance here is typed a bit too well
    // for the builder function, so we need to cast it to
    // a more generic form.
    cli.configuration.builder(cli as CLI);
  }
  const parser = cli.getParser();

  const groupedOptions = cli.getGroupedOptions();
  const options: Record<string, OptionConfig & { key: string }> =
    Object.fromEntries(
      Object.entries(parser.configuredOptions).filter(([, c]) => !c.hidden)
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

  return {
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
}
