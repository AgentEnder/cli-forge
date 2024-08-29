import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync } from 'fs';

try {
  mkdirSync('./tmp/extract-cli-docs/node_modules', { recursive: true });
} catch {}

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
  'npx tsx node_modules/cli-forge/bin/cli.js generate-documentation ../../packages/cli-forge/bin/cli.ts --output ../../docs-site/docs/cli',
  {
    cwd: './tmp/extract-cli-docs',
    env: {
      ...process.env,
      NODE_PATH: './tmp/extract-cli-docs/node_modules',
    },
  }
);
