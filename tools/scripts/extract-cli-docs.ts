// There's an issue with using CLI Forge via TSX when generating its own
// documentation. The CLI object itself is stateful, so when navigating
// to the generate-docs command the CLI object's commandChain is set to
// [generate-docs] and the commandChain is not reset when the command is
// executed. As such, when generate-docs is actually ran, the commandChain
// doesn't start empty so invalid documentation is generated.
//
// This script works around the issue, by setting up a temporary directory
// with CLI Forge and its dependencies "installed" and then running the
// generate-documentation command from the CLI Forge bin script.

import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync } from 'fs';

try {
  mkdirSync('./tmp/extract-cli-docs/node_modules', { recursive: true });
} catch {}

execSync('git clean -fdX', {
  cwd: './docs-site/docs/cli',
});

cpSync(
  './dist/packages/cli-forge',
  './tmp/extract-cli-docs/node_modules/cli-forge',
  {
    recursive: true,
  }
);

cpSync(
  './dist/packages/parser',
  './tmp/extract-cli-docs/node_modules/@cli-forge/parser',
  {
    recursive: true,
  }
);

writeFileSync(
  './tmp/extract-cli-docs/tsconfig.json',
  JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
    },
    null,
    2
  )
);

execSync(
  'node ./node_modules/cli-forge/bin/cli.js generate-documentation ../../packages/cli-forge/bin/cli.ts --output ../../docs-site/docs/cli',
  {
    cwd: './tmp/extract-cli-docs',
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: './tmp/extract-cli-docs/node_modules',
    },
  }
);
