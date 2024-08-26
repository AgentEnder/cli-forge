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
          [
            'docs',
            join('docs', 'my-cli', 'index.md'),
            join('docs', 'my-cli', 'hello.md'),
          ].map((f) => join(e2eSubDir, f))
        )
      ).not.toThrow();
    });
  });
});
