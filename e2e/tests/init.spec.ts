import { join } from 'node:path';

import {
  e2eProjectDir,
  e2eSubDir,
  ensureCleanWorkingDirectory,
  setProjectDir,
} from '../utils/setup';
import { runCommand } from '../utils/child_process';
import { checkFilesExist } from '../utils/fs';
import { execSync } from 'node:child_process';

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
      setProjectDir('my-cli');
      expect(() =>
        checkFilesExist(
          ['package.json', join('bin', 'my-cli.' + format)].map((f) =>
            join(e2eProjectDir, f)
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

      await runCommand(
        'npx cli-forge generate-documentation ./bin/my-cli',
        [],
        {}
      );

      expect(() =>
        checkFilesExist(
          ['docs', join('docs', 'index.md'), join('docs', 'hello.md')].map(
            (f) => join(e2eProjectDir, f)
          )
        )
      ).not.toThrow();

      if (format === 'ts') {
        expect(() =>
          checkFilesExist(
            ['tsconfig.json', 'scripts/build.ts'].map((f) =>
              join(e2eProjectDir, f)
            )
          )
        ).not.toThrow();

        // We are really just testing that the build script works here
        ({ stdout } = await runCommand('npm run build', [], {}));
        expect(stdout).toBeTruthy();
        ({ stdout } = await runCommand('node dist/bin/my-cli --help', [], {}));
        expect(stdout).toBeTruthy();
      }
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
      setProjectDir('my-cli');
      const packageJson = require(join(e2eProjectDir, 'package.json'));
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
