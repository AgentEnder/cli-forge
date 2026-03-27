import { join } from 'node:path';
import { spawn } from 'node:child_process';

const repoRoot = join(__dirname, '../..');
const examplesDir = join(repoRoot, 'examples');
const tsconfig = join(examplesDir, 'tsconfig.json');

/**
 * Runs a command and returns stdout/stderr.
 * Doesn't reject on non-zero exit — returns the code so tests can assert on it.
 */
function run(
  command: string,
  options?: { env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      stdio: 'pipe',
      cwd: examplesDir,
      env: { ...process.env, ...options?.env },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('exit', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

/** Run an example in CJS mode via tsx (the default). */
function runCjs(file: string, args: string, env?: Record<string, string>) {
  return run(
    `npx tsx --no-cache --tsconfig ${tsconfig} ${file} ${args}`,
    { env }
  );
}

/** Run an example in ESM mode via tsx. */
function runEsm(file: string, args: string, env?: Record<string, string>) {
  return run(
    `node --no-warnings --import tsx/esm --import tsx/cjs ${file} ${args}`,
    { env: { ...env, TSX_TSCONFIG_PATH: tsconfig } }
  );
}

describe('CJS / ESM compatibility', () => {
  describe.each([
    ['CJS', runCjs],
    ['ESM', runEsm],
  ])('%s', (_label, runner) => {
    it('runs a basic CLI with default values', async () => {
      const { stdout, code } = await runner(
        'default-values.ts',
        '--name World'
      );
      expect(code).toBe(0);
      expect(stdout).toContain('Hello, World!');
    });

    it('parses options with choices', async () => {
      const { stdout, code } = await runner(
        'choices.ts',
        'hello --name sir'
      );
      expect(code).toBe(0);
      expect(stdout).toContain('sir');
    });

    it('handles env variables', async () => {
      const { stdout, code } = await runner(
        'default-values.ts',
        '',
        { DEFAULT_VALUES_HELLO: 'Greetings' }
      );
      expect(code).toBe(0);
      expect(stdout).toContain('Greetings, World!');
    });

    it('runs middleware', async () => {
      const { stdout, code } = await runner(
        'middleware.ts',
        'hello --name Developer --greeting Hi'
      );
      expect(code).toBe(0);
      expect(stdout).toContain('DEVELOPER');
    });
  });
});
