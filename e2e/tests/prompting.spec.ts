import { join } from 'node:path';
import { runCommand } from '../utils/child_process';
import { renderTerminalOutput } from '../utils/strip-ansi';

const repoRoot = join(__dirname, '../..');
const examplesDir = join(repoRoot, 'examples');
const fixturesDir = join(__dirname, '../fixtures');

/**
 * Helper to run the readline-based prompting example.
 *
 * @param cliArgs  CLI flags (e.g. `--name Ada --age 42`)
 * @param stdin    Optional string piped to the process's stdin
 */
function runPromptingExample(cliArgs: string, stdin?: string) {
  const command = [
    'npx tsx --no-cache',
    `--tsconfig ${examplesDir}/tsconfig.json`,
    `${examplesDir}/prompting.ts`,
    cliArgs,
  ].join(' ');

  return runCommand(command, [], { cwd: repoRoot, stdin });
}

/**
 * Helper to run the clack provider e2e fixture.
 * Returns stdout (handler output) and the rendered TUI (from stderr).
 *
 * @param cliArgs  CLI arguments passed to forge()
 * @param inputs   Values pushed to the fake TTY stream (one per prompt)
 */
async function runClackFixture(cliArgs: string[], inputs: string[]) {
  const config = JSON.stringify({ cliArgs, inputs });
  const command = `npx tsx --no-cache ${fixturesDir}/clack-prompting.ts`;
  const { stdout, stderr } = await runCommand(command, [], {
    cwd: repoRoot,
    env: { ...process.env, CLACK_FIXTURE_CONFIG: config },
  });
  return { stdout, tui: renderTerminalOutput(stderr) };
}

describe('prompting (readline provider)', () => {
  it('should skip prompts when all required args are provided', async () => {
    const { stdout } = await runPromptingExample(
      '--name Craigory --greeting Hey --age 30'
    );
    expect(stdout).toContain('Hey, Craigory! You are 30 years old.');
  });

  it('should use default greeting when not specified', async () => {
    const { stdout } = await runPromptingExample('--name World --age 25');
    expect(stdout).toContain('Hello, World! You are 25 years old.');
  });

  it('should prompt for all missing required args via piped stdin', async () => {
    // No CLI args provided → name and age are prompted.
    // The readline provider reads line-by-line:
    //   line 1 → name ("Craigory")
    //   line 2 → age  ("25")
    const { stdout } = await runPromptingExample(
      '',
      'Craigory\n25\n'
    );
    expect(stdout).toContain('Hello, Craigory! You are 25 years old.');
  });

  it('should prompt only for the remaining missing arg', async () => {
    // name provided on CLI, age missing → only age is prompted
    const { stdout } = await runPromptingExample('--name Ada', '42\n');
    expect(stdout).toContain('Hello, Ada! You are 42 years old.');
  });

  it('should prompt only for name when age is provided', async () => {
    // age provided on CLI, name missing → only name is prompted
    const { stdout } = await runPromptingExample('--age 99', 'Zara\n');
    expect(stdout).toContain('Hello, Zara! You are 99 years old.');
  });
});

describe('prompting (clack provider)', () => {
  it('should skip prompts when all required args are provided', async () => {
    const { stdout, tui } = await runClackFixture(
      ['--name', 'Craigory', '--greeting', 'Hey', '--age', '30'],
      []
    );
    expect(stdout).toContain('Hey, Craigory! You are 30 years old.');
    expect(tui).toMatchSnapshot('tui: no prompts');
  });

  it('should use default greeting when not specified', async () => {
    const { stdout, tui } = await runClackFixture(
      ['--name', 'World', '--age', '25'],
      []
    );
    expect(stdout).toContain('Hello, World! You are 25 years old.');
    expect(tui).toMatchSnapshot('tui: no prompts (default greeting)');
  });

  it('should prompt for all missing required args via fake TTY', async () => {
    const { stdout, tui } = await runClackFixture([], ['Craigory', '25']);
    expect(stdout).toContain('Hello, Craigory! You are 25 years old.');
    expect(tui).toMatchSnapshot('tui: prompt name and age');
  });

  it('should prompt only for the remaining missing arg', async () => {
    const { stdout, tui } = await runClackFixture(['--name', 'Ada'], ['42']);
    expect(stdout).toContain('Hello, Ada! You are 42 years old.');
    expect(tui).toMatchSnapshot('tui: prompt age only');
  });

  it('should prompt only for name when age is provided', async () => {
    const { stdout, tui } = await runClackFixture(['--age', '99'], ['Zara']);
    expect(stdout).toContain('Hello, Zara! You are 99 years old.');
    expect(tui).toMatchSnapshot('tui: prompt name only');
  });
});
