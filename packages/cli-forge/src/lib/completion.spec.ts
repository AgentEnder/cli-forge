import { afterEach, describe, expect, it } from 'vitest';
import { cli } from './public-api';

const ORIGINAL_CONSOLE_LOG = console.log;

function mockConsoleLog() {
  const lines: string[] = [];
  console.log = (...contents) =>
    lines.push(
      contents
        .map((s) => (typeof s === 'string' ? s : JSON.stringify(s)))
        .join(' ')
    );
  return {
    getLines: () => lines,
    getOutput: () => lines.join('\n'),
    restore: () => {
      console.log = ORIGINAL_CONSOLE_LOG;
    },
  };
}

describe('shell completion', () => {
  afterEach(() => {
    process.exitCode = undefined;
    console.log = ORIGINAL_CONSOLE_LOG;
  });

  it('should return subcommand names and flags as default completions', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion()
      .option('verbose', { type: 'boolean' })
      .command('build', { builder: (a) => a, handler: () => {} })
      .command('serve', { builder: (a) => a, handler: () => {} })
      .forge(['--get-completions']);
    mock.restore();
    const output = mock.getOutput();
    expect(output).toContain('build');
    expect(output).toContain('serve');
    expect(output).toContain('--verbose');
  });

  it('should exclude hidden commands and options', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion()
      .option('secret', { type: 'string', hidden: true })
      .command('internal', {
        hidden: true,
        builder: (a) => a,
        handler: () => {},
      })
      .command('public', { builder: (a) => a, handler: () => {} })
      .forge(['--get-completions']);
    mock.restore();
    const output = mock.getOutput();
    expect(output).not.toContain('--secret');
    expect(output).not.toContain('internal');
    expect(output).toContain('public');
  });

  it('should return choices when completing an option value', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion()
      .option('env', {
        type: 'string',
        choices: ['production', 'staging', 'development'] as const,
      })
      .command('$0', { handler: () => {} })
      .forge(['--get-completions', '--env', '']);
    mock.restore();
    const output = mock.getOutput();
    expect(output).toContain('production');
    expect(output).toContain('staging');
    expect(output).toContain('development');
  });

  it('should use per-option completion callback', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion()
      .option('runner', {
        type: 'string',
        completion: () => ['jest', 'vitest', 'mocha'],
      })
      .command('$0', { handler: () => {} })
      .forge(['--get-completions', '--runner', '']);
    mock.restore();
    const output = mock.getOutput();
    expect(output).toContain('jest');
    expect(output).toContain('vitest');
    expect(output).toContain('mocha');
  });

  it('should use command-level completion callback', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion(({ defaultCompletions }) => [
        ...defaultCompletions,
        'custom-suggestion',
      ])
      .command('$0', { handler: () => {} })
      .forge(['--get-completions']);
    mock.restore();
    const output = mock.getOutput();
    expect(output).toContain('custom-suggestion');
  });

  it('should resolve deepest command completion callback', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion(() => ['root-suggestion'])
      .command('sub', {
        builder: (a) =>
          a.completion(() => ['sub-suggestion']),
        handler: () => {},
      })
      .forge(['--get-completions', 'sub']);
    mock.restore();
    const lines = mock.getLines();
    expect(lines).toContain('sub-suggestion');
    expect(lines).not.toContain('root-suggestion');
  });

  it('should not register completion subcommand on non-root CLI', async () => {
    let completionAvailable = false;
    await cli('test')
      .command('child', {
        builder: (a) => {
          const withCompletion = a.completion();
          // Check if 'completion' was registered as a subcommand
          completionAvailable =
            'completion' in
            (withCompletion as any).registeredCommands;
          return withCompletion.command('$0', { handler: () => {} });
        },
        handler: () => {},
      })
      .forge(['child']);
    // The child command has a parent, so completion subcommand should NOT be registered
    expect(completionAvailable).toBe(false);
  });

  it('should show long-form aliases but not single-char shortflags', async () => {
    const mock = mockConsoleLog();
    await cli('test')
      .completion()
      .option('verbose', { type: 'boolean', alias: ['v', 'debug'] })
      .command('$0', { handler: () => {} })
      .forge(['--get-completions']);
    mock.restore();
    const lines = mock.getLines();
    expect(lines).toContain('--verbose');
    expect(lines).toContain('--debug');
    expect(lines).not.toContain('-v');
  });
});
