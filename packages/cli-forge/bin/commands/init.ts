import type { ParsedArgs } from '@cli-forge/parser';

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { version as CLI_FORGE_VERSION } from '../../package.json';
import cli, { CLI } from '../../src';
// import { CLI } from '../../src/lib/cli-forge';
import { ensureDirSync } from '../utils/fs';

export function withInitArgs<T extends ParsedArgs>(cmd: CLI<T>) {
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
    })
    .option('format', {
      type: 'string',
      default: 'ts',
      description: 'What format should the CLI be in? (js, ts)',
    });
}

export const initCommand = cli('init', {
  description: 'Generate a new CLI',
  builder: (b) => withInitArgs(b),
  handler: async (args) => {
    args.output ??= process.cwd();
    ensureDirSync(args.output);
    const packageJsonPath = join(args.output, 'package.json');
    const cliPath = join(args.output, 'bin', `${args.cliName}.${args.format}`);
    const packageJsonContent: {
      name: string;
      bin?: {
        [cmd: string]: string;
      };
      dependencies?: Record<string, string>;
    } = readJsonOr(packageJsonPath, { name: args.cliName });
    packageJsonContent.bin ??= {};
    packageJsonContent.bin[args.cliName] = relative(args.output, cliPath);
    packageJsonContent.dependencies ??= {};
    packageJsonContent.dependencies['cli-forge'] ??= CLI_FORGE_VERSION;
    writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
    ensureDirSync(dirname(cliPath));
    writeFileSync(
      cliPath,
      args.format === 'ts'
        ? TS_CLI_CONTENTS(args.cliName)
        : JS_CLI_CONTENTS(args.cliName)
    );
    const installCommand = existsSync(join(args.output, 'yarn.lock'))
      ? 'yarn'
      : existsSync(join(args.output, 'pnpm-lock.yaml'))
      ? 'pnpm'
      : existsSync(join(args.output, 'bun.lockb'))
      ? 'bun'
      : 'npm';

    execSync(`${installCommand} install`);
  },
});

const COMMON_CONTENTS = (name: string) => `const myCLI = cli('${name}')
  .command('hello', {
    builder: (args) => args.positional('name', {type: 'string'}),
    handler: (args) => {
      console.log('hello', args.name);
    }
  })`;

const JS_CLI_CONTENTS = (name: string) => `const { cli } = require('cli-forge');

${COMMON_CONTENTS(name)}

module.exports = myCLI;

if (require.main === module) {
  myCLI.forge();
}
`;

const TS_CLI_CONTENTS = (name: string) => `import { cli } from 'cli-forge';

${COMMON_CONTENTS(name)}

export default myCLI;

if (require.main === module) {
  myCLI.forge();
}
`;

function readJsonOr<T>(filePath: string, alt: T): T {
  try {
    const contents = readFileSync(filePath, 'utf-8');
    return JSON.parse(contents);
  } catch {
    return alt;
  }
}
