// Bun.build() is a Bun-runtime API. This script shells out to
// the bun CLI to stay compatible with the Node-based test runner.
import { execSync } from 'child_process';

execSync('bun build cli.ts --outfile dist/esm/bun.mjs --target node --format esm', {
  stdio: 'inherit',
});
