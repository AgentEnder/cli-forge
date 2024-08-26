import type { ArrayOptionConfig, ParsedArgs } from '@cli-forge/parser';

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CLI } from '../../src';
import {
  Documentation,
  generateDocumentation,
} from '../../src/lib/documentation';
import { ensureDirSync } from '../utils/fs';

type mdfactory = typeof import('markdown-factory');

type GenerateDocsArgs = {
  cli: string;
  output: string;
  format: string;
  export: string;
};

export function withGenerateDocumentationArgs<T extends ParsedArgs>(
  cmd: CLI<T, T & GenerateDocsArgs>
) {
  return cmd
    .positional('cli', {
      type: 'string',
      description: 'Path to the cli that docs should be generated for.',
      required: true,
    })
    .option('output', {
      alias: ['o'],
      type: 'string',
      description: 'Where should the documentation be output?',
      default: 'docs',
    })
    .option('format', {
      type: 'string',
      description:
        'What format should the documentation be output in? (json, md)',
      default: 'md',
    })
    .option('export', {
      type: 'string',
      description:
        'The name of the export that contains the CLI instance. By default, docs will be generated for the default export.',
    });
}

export function withGenerateDocumentation<T extends ParsedArgs>(cli: CLI<T>) {
  return cli.command<T & GenerateDocsArgs>('generate-documentation', {
    description: 'Generate documentation for the given CLI',
    builder: withGenerateDocumentationArgs,
    handler: async (args) => {
      if (args.cli.startsWith('./')) {
        args.cli = join(process.cwd(), args.cli);
      }
      const cliModule = await import(args.cli);
      const cli = cliModule[args.export || 'default'] ?? cliModule;
      if (!(cli instanceof CLI)) {
        throw new Error(
          `${args.cli}${args.export ? '#' + args.export : ''} is not a CLI.`
        );
      }
      const documentation = generateDocumentation(cli);
      if (args.format === 'md') {
        await generateMarkdownDocumentation(documentation, args);
      } else if (args.format === 'json') {
        const outfile = args.output.endsWith('json')
          ? args.output
          : join(args.output, cli.name + '.json');
        const outdir = dirname(outfile);
        ensureDirSync(outdir);
        writeFileSync(outfile, JSON.stringify(documentation, null, 2));
      }
    },
  });
}

async function generateMarkdownDocumentation(
  docs: Documentation,
  args: GenerateDocsArgs
) {
  const md = await importMarkdownFactory();
  await generateMarkdownForSingleCommand(
    docs,
    join(args.output, docs.name),
    md
  );
}

async function generateMarkdownForSingleCommand(
  docs: Documentation,
  out: string,
  md: mdfactory
) {
  const subcommands = docs.subcommands;
  const outdir = subcommands.length ? out : dirname(out);
  const outname = subcommands.length ? 'index' : docs.name;

  ensureDirSync(outdir);

  writeFileSync(
    join(outdir, outname + '.md'),
    md.h1(
      docs.name,
      ...[
        docs.description,
        getPositionalArgsFragment(docs.positionals, md),
        getFlagArgsFragment(docs.options, md),
        getSubcommandsFragment(docs.subcommands, md),
      ].filter(isTruthy)
    )
  );
  for (const subcommand of docs.subcommands) {
    await generateMarkdownForSingleCommand(
      subcommand,
      join(outdir, subcommand.name),
      md
    );
  }
}

function formatOption(option: Documentation['options'][string], md: mdfactory) {
  return md.h3(
    option.key,
    ...[
      md.bold('Type:') +
        ' ' +
        (option.type === 'array'
          ? `${(option as ArrayOptionConfig).items}[]`
          : option.type),
      option.description,
      option.default ? md.bold('Default:') + ' ' + option.default : undefined,
      option.required ? md.bold('Required') : undefined,
      option.alias?.length
        ? md.h4('Aliases', md.ul(...option.alias))
        : undefined,
    ].filter(isTruthy)
  );
}

function getPositionalArgsFragment(
  positionals: Documentation['positionals'],
  md: mdfactory
) {
  if (positionals?.length === 0) {
    return undefined;
  }
  return md.h2(
    'Positional Arguments',
    ...positionals.map((positional) => formatOption(positional, md))
  );
}

function getFlagArgsFragment(options: Documentation['options'], md: mdfactory) {
  if (Object.keys(options).length === 0) {
    return undefined;
  }
  return md.h2(
    'Flags',
    ...Object.values(options).map((option) => formatOption(option, md))
  );
}

function getSubcommandsFragment(
  subcommands: Documentation['subcommands'],
  md: mdfactory
) {
  if (subcommands.length === 0) {
    return undefined;
  }
  return md.h2(
    'Subcommands',
    ...subcommands.map((subcommand) =>
      md.link(`./${subcommand.name}`, subcommand.name)
    )
  );
}

function isTruthy<T>(value: T | undefined | null): value is T {
  return !!value;
}

async function importMarkdownFactory(): Promise<mdfactory> {
  try {
    return await import('markdown-factory');
  } catch {
    throw new Error(
      'Could not find markdown-factory. Please install it to generate markdown documentation.'
    );
  }
}