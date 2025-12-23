import { describe, it, expect, afterEach } from 'vitest';
import { cli } from './public-api';
import { TestHarness } from './test-harness';
import type { LocalizationDictionary } from '@cli-forge/parser';

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
    getOutput: () => lines.join('\n'),
    restore: () => {
      console.log = ORIGINAL_CONSOLE_LOG;
    },
  };
}

describe('CLI localization', () => {
  afterEach(() => {
    console.log = ORIGINAL_CONSOLE_LOG;
    process.exitCode = undefined;
  });

  const dictionary: LocalizationDictionary = {
    name: {
      default: 'name',
      'es-ES': 'nombre',
    },
    port: {
      default: 'port',
      'es-ES': 'puerto',
    },
    serve: {
      default: 'serve',
      'es-ES': 'servir',
    },
  };

  it('should accept localized option keys', async () => {
    const testCli = cli('test')
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('$0', {
        handler: () => {},
      });

    const harness = new TestHarness(testCli);
    const { args } = await harness.parse(['--nombre', 'test', '--puerto', '8080']);

    expect(args.name).toBe('test');
    expect(args.port).toBe(8080);
  });

  it('should accept default option keys as aliases', async () => {
    const testCli = cli('test')
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('$0', {
        handler: () => {},
      });

    const harness = new TestHarness(testCli);
    const { args } = await harness.parse(['--name', 'test', '--port', '8080']);

    expect(args.name).toBe('test');
    expect(args.port).toBe(8080);
  });

  it('should display localized keys in help text', async () => {
    const mock = mockConsoleLog();
    try {
      await cli('test')
        .localize(dictionary, 'es-ES')
        .option('name', { type: 'string', description: 'Name option' })
        .option('port', { type: 'number', description: 'Port option' })
        .forge(['--help']);

      const output = mock.getOutput();
      expect(output).toContain('--nombre');
      expect(output).toContain('--puerto');
      expect(output).not.toContain('--name '); // Should not show as primary
      expect(output).not.toContain('--port '); // Should not show as primary
    } finally {
      mock.restore();
    }
  });

  it('should display localized command names in help text', async () => {
    const mock = mockConsoleLog();
    try {
      await cli('test')
        .localize(dictionary, 'es-ES')
        .command('serve', {
          builder: (cmd) => cmd,
          handler: () => {},
          description: 'Start the server',
        })
        .forge(['--help']);

      const output = mock.getOutput();
      expect(output).toContain('servir');
      expect(output).toContain('Start the server');
    } finally {
      mock.restore();
    }
  });

  it('should work with subcommands', async () => {
    const testCli = cli('test')
      .localize(dictionary, 'es-ES')
      .command('serve', {
        builder: (cmd) =>
          cmd
            .option('port', { type: 'number' })
            .option('name', { type: 'string' }),
        handler: () => {},
      });

    const harness = new TestHarness(testCli);
    const { args, commandChain } = await harness.parse(['servir', '--puerto', '8080', '--nombre', 'test']);

    expect(args.port).toBe(8080);
    expect(args.name).toBe('test');
    expect(commandChain).toEqual(['servir']);
  });

  it('should work without localization', async () => {
    const testCli = cli('test')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('$0', {
        handler: () => {},
      });

    const harness = new TestHarness(testCli);
    const { args } = await harness.parse(['--name', 'test', '--port', '8080']);

    expect(args.name).toBe('test');
    expect(args.port).toBe(8080);
  });

  it('should chain localize with other builder methods', async () => {
    const testCli = cli('test')
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .env('TEST')
      .command('$0', {
        handler: () => {},
      });

    const harness = new TestHarness(testCli);
    const { args } = await harness.parse(['--nombre', 'test', '--puerto', '8080']);

    expect(args.name).toBe('test');
    expect(args.port).toBe(8080);
  });

  it('should work with localization function', async () => {
    const localizer = (key: string) => {
      const translations: Record<string, string> = {
        name: 'nombre',
        port: 'puerto',
        serve: 'servir',
      };
      return translations[key] || key;
    };

    const testCli = cli('test')
      .localize(localizer)
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('serve', {
        builder: (cmd) => cmd,
        handler: () => {},
      });

    const harness = new TestHarness(testCli);

    // Test options with localized keys
    const { args: args1 } = await harness.parse(['--nombre', 'test', '--puerto', '8080']);
    expect(args1.name).toBe('test');
    expect(args1.port).toBe(8080);

    // Test command with localized name
    const { commandChain } = await harness.parse(['servir']);
    expect(commandChain).toEqual(['servir']);
  });
});
