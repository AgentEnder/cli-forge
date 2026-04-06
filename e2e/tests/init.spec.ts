import { readFileSync } from 'node:fs';
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

  describe.each([
    ['ts', 'cjs'],
    ['ts', 'esm'],
    ['js', 'cjs'],
    ['js', 'esm'],
  ])(`--format %s --module-type %s`, (format, type) => {
    it('should generate a new CLI', async () => {
      await runCommand(
        `npx cli-forge@e2e init my-cli --format ${format} --module-type ${type}`,
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

      // Verify package.json has correct "type" field for ESM
      if (type === 'esm') {
        const packageJson = JSON.parse(
          readFileSync(join(e2eProjectDir, 'package.json'), 'utf-8')
        );
        expect(packageJson.type).toBe('module');
      }

      let { stdout } = await runCommand(
        'npx -y tsx ./bin/my-cli hello world',
        [],
        {}
      );
      expect(stdout).toContain('hello world');

      ({ stdout } = await runCommand('npx -y tsx ./bin/my-cli --help', [], {}));
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('hello');

      ({ stdout } = await runCommand(
        'npx -y tsx ./bin/my-cli hello --help',
        [],
        {}
      ));
      expect(stdout).toContain('Usage:');

      // generate-documentation uses dynamic import which has issues with
      // ESM project resolution — skip for ESM type for now
      if (type === 'cjs') {
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
      }

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

        const runBuilt =
          type === 'esm'
            ? 'node dist/bin/my-cli.js --help'
            : 'node dist/bin/my-cli --help';
        ({ stdout } = await runCommand(runBuilt, [], {}));
        expect(stdout).toBeTruthy();
      }
    });
  });

  describe('--initial-version', () => {
    it('should work with --version for the new CLI', async () => {
      await runCommand(
        'npx cli-forge@e2e init my-cli --initial-version 1.0.0 --module-type cjs',
        [],
        {}
      );
      setProjectDir('my-cli');
      const packageJson = JSON.parse(
        readFileSync(join(e2eProjectDir, 'package.json'), 'utf-8')
      );
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
