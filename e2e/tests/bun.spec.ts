import { execSync } from 'node:child_process';

import { ensureCleanWorkingDirectory, setProjectDir } from '../utils/setup';
import { runCommand } from '../utils/child_process';

const hasBun = (() => {
  try {
    execSync('bun --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

(hasBun ? describe : describe.skip)('bun compatibility', () => {
  beforeEach(() => {
    ensureCleanWorkingDirectory();
  });

  it('runs generated CLI commands with bun', async () => {
    await runCommand(
      'npx cli-forge@e2e init bun-cli --format ts --module-type esm',
      [],
      {}
    );

    setProjectDir('bun-cli');

    let result = await runCommand(
      'bunx --bun tsx ./bin/bun-cli hello bun',
      [],
      {}
    );
    expect(result.stdout).toContain('hello bun');

    await runCommand('bun run build', [], {});

    result = await runCommand('bun ./dist/bin/bun-cli.js --help', [], {});
    expect(result.stdout).toContain('Commands:');
  });
});
