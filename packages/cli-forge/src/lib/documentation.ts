import { OptionConfig } from '@cli-forge/parser';
import { CLI } from './cli-forge';

export type Documentation = {
  name: string;
  description?: string;
  options: Readonly<Record<string, OptionConfig & { key: string }>>;
  positionals: readonly Readonly<OptionConfig & { key: string }>[];
  subcommands: Documentation[];
};

export function generateDocumentation(cli: CLI) {
  // Ensure current command's options are built.
  if (cli.configuration?.builder) {
    cli.configuration.builder(cli);
  }
  const parser = cli.getParser();

  const options = parser.configuredOptions;
  const positionals = parser.configuredPositionals;
  const subcommands: Documentation[] = Object.values(cli.getSubcommands()).map(
    (cmd) => generateDocumentation(cmd.clone())
  );

  return {
    name: cli.name,
    description: cli.configuration?.description,
    options,
    positionals,
    subcommands,
  };
}
