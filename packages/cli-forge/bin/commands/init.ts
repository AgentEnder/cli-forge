import type { ParsedArgs } from '@cli-forge/parser';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { CLI } from '../../src';
import { ensureDirSync } from '../utils/fs';

type InitArgs = {
  cliName: string;
  output: string;
  format: string;
};

export function withInitArgs<T extends ParsedArgs>(cmd: CLI<T, T & InitArgs>) {
  return cmd
    .positional('cliName', {
      type: 'string',
      description: 'Name of the CLI to generate.',
      required: true,
    })
    .option('output', {
      alias: ['o'],
      type: 'string',
      description: 'Where should the CLI be created?',
      default: 'docs',
    })
    .option('format', {
      type: 'string',
      default: 'ts',
      description: 'What format should the CLI be in? (js, ts)',
    });
}

export function withInit<T extends ParsedArgs>(cli: CLI<T>) {
  return cli.command<T & InitArgs>('init', {
    description: 'Generate a new CLI',
    builder: withInitArgs,
    handler: async (args) => {
      args.output ??= process.cwd();
      ensureDirSync(args.output);
      const packageJsonPath = join(args.output, 'package.json');
      const cliPath = join(args.output, 'bin', 'cli.' + args.format);
      const packageJsonContent: {
        name: string;
        bin?: {
          [cmd: string]: string;
        };
      } = readJsonOr(packageJsonPath, { name: args.cliName });
      packageJsonContent.bin ??= {};
      packageJsonContent.bin[args.cliName] = cliPath;
      writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJsonContent, null, 2)
      );
      ensureDirSync(dirname(cliPath));
      writeFileSync(
        cliPath,
        args.format === 'ts'
          ? TS_CLI_CONTENTS(args.cliName)
          : JS_CLI_CONTENTS(args.cliName)
      );
    },
  });
}

const COMMON_CONTENTS = (name: string) => `cliForge(${name})
  .command('hello', {
    builder: (args) => args.positional('name', {type: 'string'}),
    handler: (args) => {
      console.log('hello', args.name);
    }
  })`;

const JS_CLI_CONTENTS = (
  name: string
) => `const cliForge = require('cli-forge');

${COMMON_CONTENTS(name)}
`;

const TS_CLI_CONTENTS = (name: string) => `import cliForge from 'cli-forge';

${COMMON_CONTENTS(name)}
`;

function readJsonOr<T>(filePath: string, alt: T): T {
  try {
    const contents = readFileSync(filePath, 'utf-8');
    return JSON.parse(contents);
  } catch {
    return alt;
  }
}
