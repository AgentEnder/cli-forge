import { join } from 'node:path';

import { e2eSubDir, ensureCleanWorkingDirectory } from '../utils/setup';
import { runCommand } from '../utils/child_process';
import { checkFilesExist } from '../utils/fs';

describe('init', () => {
  beforeEach(() => {
    ensureCleanWorkingDirectory();
  });

  describe.each([['ts'], ['js']])(`--format %s`, (format) => {
    it('should generate a new CLI', async () => {
      await runCommand(
        'npx cli-forge@e2e init my-cli --format ' + format,
        [],
        {}
      );
      expect(() =>
        checkFilesExist(
          ['package.json', join('bin', 'my-cli.' + format)].map((f) =>
            join(e2eSubDir, f)
          )
        )
      ).not.toThrow();

      let { stdout } = await runCommand(
        'npx -y tsx ./bin/my-cli hello world',
        [],
        {}
      );
      expect(stdout).toMatchSnapshot('command output');

      ({ stdout } = await runCommand('npx -y tsx ./bin/my-cli --help', [], {}));
      expect(stdout).toMatchSnapshot('help text');

      ({ stdout } = await runCommand(
        'npx -y tsx ./bin/my-cli hello --help',
        [],
        {}
      ));
      expect(stdout).toMatchSnapshot('subcommand help text');

      //
      if (format === 'js') {
        await runCommand(
          'npx cli-forge generate-documentation ./bin/my-cli',
          [],
          {}
        );
      } else {
        await runCommand(
          'npx tsx ./node_modules/.bin/cli-forge generate-documentation ./bin/my-cli',
          [],
          {}
        );
      }

      expect(() =>
        checkFilesExist(
          ['docs', join('docs', 'index.md'), join('docs', 'hello.md')].map(
            (f) => join(e2eSubDir, f)
          )
        )
      ).not.toThrow();
    });
  });

  describe('--initial-version', () => {
    it('should work with --version for the new CLI', async () => {
      await runCommand(
        // We are using --js here to avoid needing to invoke cli forge with tsx
        'npx cli-forge@e2e init my-cli --initial-version 1.0.0',
        [],
        {}
      );
      const packageJson = require(join(e2eSubDir, 'package.json'));
      expect(packageJson).toHaveProperty('version', '1.0.0');
      const { stdout } = await runCommand(
        'npx -y tsx ./bin/my-cli --version',
        [],
        {}
      );
      expect(stdout).toMatchInlineSnapshot(`
        "1.0.0
        "
      `);
    });
  });
});
