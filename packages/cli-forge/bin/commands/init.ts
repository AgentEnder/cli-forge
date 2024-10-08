import type { ParsedArgs } from '@cli-forge/parser';

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import * as CLI_FORGE_PACKAGE_JSON from '../../package.json';
import cli, { CLI } from '../../src';
// import { CLI } from '../../src/lib/cli-forge';
import { ensureDirSync } from '../utils/fs';

const CLI_FORGE_VERSION = CLI_FORGE_PACKAGE_JSON.version;

/**
 * These are peer dependencies that **we** will call require/import on,
 * but are not actually required at runtime. These are mostly optional,
 * and used when running `cli-forge` commands rather than the user's CLI.
 */
const DEV_PEER_DEPS = Object.entries(
  CLI_FORGE_PACKAGE_JSON.peerDependencies
).reduce((acc, [dep, version]) => {
  if (
    // The dev prop doesn't actually do anything for npm/pnpm/yarn,
    // but we are using it to mark when a peer dep is only used at dev time.
    // In these cases, we can safely add them to the devDependencies of the
    // generated CLI.
    CLI_FORGE_PACKAGE_JSON.peerDependenciesMeta[
      dep as keyof typeof CLI_FORGE_PACKAGE_JSON.peerDependenciesMeta
    ]?.dev
  ) {
    acc[dep] = version;
  }
  return acc;
}, {} as Record<string, string>);

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
      description: 'What format should the CLI be in?',
      choices: ['js', 'ts'],
    })
    .option('initialVersion', {
      type: 'string',
      default: '0.0.1',
      description:
        'Initial version used when creating the package.json for the new CLI.',
    });
}

export const initCommand = cli('init', {
  description: 'Generate a new CLI',
  builder: (b) => withInitArgs(b),
  handler: async (args) => {
    args.output ??= join(process.cwd(), args.cliName);
    ensureDirSync(args.output);
    const packageJsonPath = join(args.output, 'package.json');
    const cliPathWithoutExtension = join(args.output, 'bin', `${args.cliName}`);
    const cliPath = [cliPathWithoutExtension, args.format].join('.');

    let packageJsonContent: PackageJson = readJsonOr(packageJsonPath, {
      name: args.cliName,
      version: args.initialVersion,
    });
    packageJsonContent = mergePackageJsonContents(packageJsonContent, {
      name: args.cliName,
      version: args.initialVersion,
      bin: {
        [args.cliName]: relative(args.output, cliPathWithoutExtension),
      },
      dependencies: {
        'cli-forge': CLI_FORGE_VERSION,
      },
    });
    if (args.format === 'ts') {
      const latestTypescriptVersion = execSync('npm show typescript version')
        .toString()
        .trim();
      const latestTsConfigNodeVersion = execSync(
        'npm show @tsconfig/node-lts version'
      )
        .toString()
        .trim();
      packageJsonContent = mergePackageJsonContents(packageJsonContent, {
        scripts: {
          build: 'tsx scripts/build.ts',
        },
        devDependencies: Object.fromEntries(
          Object.entries({
            typescript: latestTypescriptVersion,
            '@tsconfig/node-lts': latestTsConfigNodeVersion,
            ...DEV_PEER_DEPS,
          }).sort(([a], [b]) => a.localeCompare(b))
        ),
      });
      ensureDirSync(join(args.output, 'scripts'));
      writeFileSync(
        join(args.output, 'scripts/build.ts'),
        `import { execSync } from 'node:child_process';
import { cpSync } from 'node:fs';

execSync('tsc --build tsconfig.json', { stdio: 'inherit' });
cpSync('package.json', 'dist/package.json');
        `
      );
      writeFileSync(
        join(args.output, 'tsconfig.json'),
        JSON.stringify(
          {
            extends: '@tsconfig/node-lts',
            compilerOptions: {
              rootDir: '.',
              outDir: 'dist',
              strict: true,
            },
            include: ['src/**/*.ts', 'bin/**/*.ts'],
            exclude: ['**/*.{spec,test}.ts'],
          },
          null,
          2
        )
      );
    }
    writeFileSync(
      packageJsonPath,
      JSON.stringify(
        orderKeysInJson(packageJsonContent, [
          'name',
          'version',
          'scripts',
          'bin',
          'dependencies',
          'devDependencies',
        ]),
        null,
        2
      )
    );
    ensureDirSync(dirname(cliPath));
    writeFileSync(
      cliPath,
      args.format === 'ts'
        ? TS_CLI_CONTENTS(args.cliName)
        : JS_CLI_CONTENTS(args.cliName)
    );
    writeFileSync(
      join(args.output, 'README.md'),
      README_CONTENTS(args.cliName, args.format)
    );
    const installCommand = existsSync(join(args.output, 'yarn.lock'))
      ? 'yarn'
      : existsSync(join(args.output, 'pnpm-lock.yaml'))
      ? 'pnpm'
      : existsSync(join(args.output, 'bun.lockb'))
      ? 'bun'
      : 'npm';

    execSync(`${installCommand} install`, {
      cwd: args.output,
    });
  },
});

const COMMON_CONTENTS = (name: string) => `const myCLI = cli('${name}')
  .command('hello', {
    builder: (args) => args.positional('name', {type: 'string'}),
    handler: (args) => {
      console.log('hello', args.name);
    }
  })`;

const README_CONTENTS = (name: string, format: 'js' | 'ts') => `# ${name}

${
  format === 'ts' ? 'TypeScript' : 'JavaScript'
} CLI generated by [cli-forge](https://craigory.dev/cli-forge)

## Usage

// Fill this in with usage instructions

## Development

${format === 'ts' ? 'To build the CLI, run `npm run build`' : ''}

To run the CLI, use the following command:

\`\`\`shell
${
  format === 'ts' ? 'npm run build && node ./dist/bin' : 'node ./bin'
}/${name} hello world
\`\`\`

${
  format === 'ts'
    ? `> Hint: you can also use \`npx tsx ./bin/${name} hello world\` to run the CLI without building it first`
    : ''
}
`;

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

type PackageJson = {
  name: string;
  version?: string;
  bin?: {
    [cmd: string]: string;
  };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function mergePackageJsonContents(
  original: PackageJson,
  updates: Partial<PackageJson>,
  overwriteExistingValues = false
): PackageJson {
  const first = overwriteExistingValues ? original : updates;
  const second = overwriteExistingValues ? updates : original;

  const merged: PackageJson = {
    name: original.name ?? updates.name,
    ...first,
    ...second,
  };

  if (first.bin && second.bin) {
    merged.bin = {
      ...first.bin,
      ...second.bin,
    };
  }

  if (first.dependencies && second.dependencies) {
    merged.dependencies = {
      ...first.dependencies,
      ...second.dependencies,
    };
  }

  if (first.devDependencies && second.devDependencies) {
    merged.devDependencies = {
      ...first.devDependencies,
      ...second.devDependencies,
    };
  }

  return merged;
}

function orderKeysInJson<T extends Record<string, unknown>>(
  obj: T,
  order: Array<keyof T & string>
): T {
  const values = new Map(Object.entries(obj));
  const keys = new Set(Object.keys(obj));
  const returnObj = {} as T;

  for (const key of order) {
    const value = values.get(key);
    if (value !== undefined) {
      returnObj[key] = value as T[typeof key];
      keys.delete(key);
    }
  }

  for (const key of keys) {
    (returnObj as any)[key] = values.get(key) as T[typeof key];
  }

  return returnObj;
}
