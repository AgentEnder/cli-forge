import type { ArrayOptionConfig, ParsedArgs } from '@cli-forge/parser';

import { existsSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { join as joinPathFragments, normalize } from 'node:path/posix';

import cli from '../../src';
import {
  Documentation,
  generateDocumentation,
} from '../../src/lib/documentation';
import { CLI, InternalCLI } from '../../src/lib/cli-forge';
import { ensureDirSync } from '../utils/fs';
import { pathToFileURL } from 'node:url';

type mdfactory = typeof import('markdown-factory');

type GenerateDocsArgs = ParsedArgs<{
  cli: string;
  output: string;
  format: string;
  export: string;
}>;

export function withGenerateDocumentationArgs<T extends ParsedArgs>(
  cmd: CLI<T>
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
      description: 'What format should the documentation be output in?',
      default: 'md',
      choices: ['json', 'md'],
    })
    .option('export', {
      type: 'string',
      description:
        'The name of the export that contains the CLI instance. By default, docs will be generated for the default export.',
    })
    .option('tsconfig', {
      type: 'string',
      description:
        'Specifies the `tsconfig` used when loading typescript based CLIs.',
    });
}

export const generateDocumentationCommand: CLI = cli('generate-documentation', {
  description: 'Generate documentation for the given CLI',
  builder: (b) => withGenerateDocumentationArgs(b),
  handler: async (args) => {
    const cliModule = await loadCLIModule(args);
    const cli = readCLIFromModule(cliModule, args);

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

async function generateMarkdownDocumentation(
  docs: Documentation,
  args: GenerateDocsArgs
) {
  const md = await importMarkdownFactory();
  await generateMarkdownForSingleCommand(docs, args.output, args.output, md);
}

async function generateMarkdownForSingleCommand(
  docs: Documentation,
  out: string,
  docsRoot: string,
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
        [md.bold('Usage:'), md.code(docs.usage)].join(' '),
        docs.description,
        getPositionalArgsFragment(docs.positionals, md),
        getFlagArgsFragment(docs.options, md),
        getSubcommandsFragment(docs.subcommands, outdir, docsRoot, md),
        getExamplesFragment(docs.examples, md),
      ].filter(isTruthy)
    )
  );
  for (const subcommand of docs.subcommands) {
    await generateMarkdownForSingleCommand(
      subcommand,
      join(outdir, subcommand.name),
      docsRoot,
      md
    );
  }
}

function formatOption(option: Documentation['options'][string], md: mdfactory) {
  return md.h3(
    option.deprecated ? md.strikethrough(option.key) : option.key,
    ...[
      option.deprecated ? md.bold(md.italics('Deprecated')) : undefined,
      md.bold('Type:') +
        ' ' +
        (option.type === 'array'
          ? `${(option as ArrayOptionConfig).items}[]`
          : option.type),
      option.description,
      option.default ? md.bold('Default:') + ' ' + option.default : undefined,
      // No need to show required if it's required and has a default, as its not actually required to pass.
      option.required && !option.default ? md.bold('Required') : undefined,
      option.choices
        ? md.bold('Valid values:') +
          ' ' +
          (() => {
            const choicesAsString = (
              typeof option.choices === 'function'
                ? option.choices()
                : option.choices
            ).map((t) => t.toString());
            return choicesAsString.join(', ');
          })()
        : undefined,
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
  outdir: string,
  docsRoot: string,
  md: mdfactory
) {
  if (subcommands.length === 0) {
    return undefined;
  }
  return md.h2(
    'Subcommands',
    ...subcommands.map((subcommand) =>
      md.link(
        './' +
          joinPathFragments(
            normalize(relative(docsRoot, outdir)),
            subcommand.name + '.md'
          ),
        subcommand.name
      )
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

function isCLI(obj: unknown): obj is InternalCLI {
  if (obj instanceof InternalCLI) {
    return true;
  }
  if (typeof obj !== 'object' || !obj) {
    return false;
  }
  if (!('constructor' in obj)) {
    return false;
  }
  if (!('name' in obj.constructor)) {
    return false;
  }
  return obj.constructor.name === InternalCLI.name;
}

function getExamplesFragment(
  examples: string[],
  md: typeof import('markdown-factory')
): string | undefined {
  if (examples.length === 0) {
    return undefined;
  }
  return md.h2(
    'Examples',
    ...examples.map((example) => md.codeBlock(example, 'shell'))
  );
}

/**
 * Reads the CLI instance from the provided module. For some reason,
 * when importing a module that uses `export default` in typescript
 * the default export is nested under a `default` property on the module...
 * We for code that looks like `export default 5`, on import we get back
 * `{ default: {default: 5}}`. To work around this, and make things work
 * we try to read the CLI instance from the module in a few different ways.
 *
 * @param cliModule The imported module
 * @param exportSpecifier The name of the export to read the CLI from. Defaults to `default`.
 * @returns A CLI instance.
 */
function readCLIFromModule(
  cliModule: any,
  args: GenerateDocsArgs
): InternalCLI {
  let cli = cliModule;
  if (args.export) {
    cli = cliModule[args.export] ?? cliModule['default']?.[args.export];
  } else {
    cli =
      cliModule['default']?.['default'] ?? cliModule['default'] ?? cliModule;
  }
  if (!isCLI(cli)) {
    throw new Error(
      `${args.cli}${args.export ? '#' + args.export : ''} is not a CLI.`
    );
  }
  return cli;
}

async function loadCLIModule(
  args: { unmatched: string[]; '--'?: string[] } & { cli: string } & {
    output: string;
  } & { format: string } & { export: string } & { tsconfig: string }
) {
  if (!isAbsolute(args.cli)) {
    args.cli = join(process.cwd(), args.cli);
  }
  const cliPath = [
    args.cli,
    `${args.cli}.ts`,
    `${args.cli}.js`,
    `${args.cli}.cjs`,
    `${args.cli}.mjs`,
    join(args.cli, 'index.ts'),
    join(args.cli, 'index.js'),
    join(args.cli, 'index.cjs'),
    join(args.cli, 'index.mjs'),
  ].find((f) => existsSync(f));

  if (!cliPath) {
    throw new Error(`Could not find CLI module at ${args.cli}
      
      Ensure that the path is correct and that the CLI module exists.`);
  }

  try {
    const tsx = (await import(
      // For some reason the typescript language server doesn't like the import statement below.
      // Its accurate, and in fact the full path with `/dist/` would error as its not part of
      // the package.json's `exports` field.
      //
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      'tsx/esm/api'
    )) as typeof import('tsx/dist/esm/api/index.cjs');
    return tsx.tsImport(cliPath, {
      tsconfig: args.tsconfig,
      parentURL: pathToFileURL(__dirname).toString(),
    });
  } catch {
    try {
      return await import(cliPath);
    } catch (e) {
      if (cliPath.endsWith('.ts')) {
        console.warn(
          '[cli-forge]: Generating docs for a typescript CLI requires installing `tsx` as a dev dependency, targeting the build artifacts instead, or otherwise registering a typescript loader with node.'
        );
      }
      throw e;
    }
  }
}
