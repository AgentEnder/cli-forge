import { OptionConfig } from '@cli-forge/parser';
import { InternalCLI } from './cli-forge';

export type Documentation = {
  name: string;
  description?: string;
  usage: string;
  examples: string[];
  options: Readonly<Record<string, OptionConfig & { key: string }>>;
  positionals: readonly Readonly<OptionConfig & { key: string }>[];
  subcommands: Documentation[];
};

export function generateDocumentation(
  cli: InternalCLI,
  commandChain: string[] = []
) {
  // Ensure current command's options are built.
  if (cli.configuration?.builder) {
    cli.configuration.builder(cli);
  }
  const parser = cli.getParser();

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
      subcommands.push(
        generateDocumentation(subcommand.clone(), [...commandChain, cli.name])
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
    examples: cli.configuration?.examples ?? [],
    options,
    positionals,
    subcommands,
  };
}
