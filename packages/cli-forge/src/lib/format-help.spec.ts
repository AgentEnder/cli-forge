import { describe, it, expect } from 'vitest';
import { formatHelp } from './format-help';
import cli from './public-api';
import { InternalCLI } from './internal-cli';

describe('formatHelp', () => {
  it('should show configOnly options in a separate Configuration Options section', () => {
    const testCli = cli('test')
      .option('verbose', { type: 'boolean', description: 'Enable verbose output' })
      .option('logLevel', {
        type: 'string',
        configOnly: true,
        description: 'Set the log level',
      }) as unknown as InternalCLI;

    const help = formatHelp(testCli);

    // Regular options section should contain verbose but not logLevel
    const optionsSection = help.split('Configuration Options:')[0];
    expect(optionsSection).toContain('--verbose');
    expect(optionsSection).not.toContain('--logLevel');

    // Configuration Options section should contain logLevel
    expect(help).toContain('Configuration Options:');
    expect(help.split('Configuration Options:')[1]).toContain('--logLevel');
  });

  it('should not show Configuration Options section when no configOnly options exist', () => {
    const testCli = cli('test')
      .option('verbose', { type: 'boolean' }) as unknown as InternalCLI;

    const help = formatHelp(testCli);
    expect(help).not.toContain('Configuration Options:');
  });

  it('should not show configOnly options that are also hidden', () => {
    const testCli = cli('test')
      .option('secret', {
        type: 'string',
        configOnly: true,
        hidden: true,
        description: 'A hidden config field',
      }) as unknown as InternalCLI;

    const help = formatHelp(testCli);
    expect(help).not.toContain('Configuration Options:');
    expect(help).not.toContain('--secret');
  });
});
