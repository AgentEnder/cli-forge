import { describe, it, expect, afterEach } from 'vitest';
import { cli } from './public-api';
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
    let capturedArgs: any;
    await cli('test')
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('$0', {
        handler: (args) => {
          capturedArgs = args;
        },
      })
      .forge(['--nombre', 'test', '--puerto', '8080']);

    expect(capturedArgs.name).toBe('test');
    expect(capturedArgs.port).toBe(8080);
  });

  it('should accept default option keys as aliases', async () => {
    let capturedArgs: any;
    await cli('test')
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('$0', {
        handler: (args) => {
          capturedArgs = args;
        },
      })
      .forge(['--name', 'test', '--port', '8080']);

    expect(capturedArgs.name).toBe('test');
    expect(capturedArgs.port).toBe(8080);
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

  it('should work with subcommands', async () => {
    let capturedArgs: any;
    await cli('test')
      .localize(dictionary, 'es-ES')
      .command('serve', {
        builder: (cmd) =>
          cmd
            .option('port', { type: 'number' })
            .option('name', { type: 'string' }),
        handler: (args) => {
          capturedArgs = args;
        },
      })
      .forge(['serve', '--puerto', '8080', '--nombre', 'test']);

    expect(capturedArgs.port).toBe(8080);
    expect(capturedArgs.name).toBe('test');
  });

  it('should work without localization', async () => {
    let capturedArgs: any;
    await cli('test')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .command('$0', {
        handler: (args) => {
          capturedArgs = args;
        },
      })
      .forge(['--name', 'test', '--port', '8080']);

    expect(capturedArgs.name).toBe('test');
    expect(capturedArgs.port).toBe(8080);
  });

  it('should chain localize with other builder methods', async () => {
    let capturedArgs: any;
    await cli('test')
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' })
      .env('TEST')
      .command('$0', {
        handler: (args) => {
          capturedArgs = args;
        },
      })
      .forge(['--nombre', 'test', '--puerto', '8080']);

    expect(capturedArgs.name).toBe('test');
    expect(capturedArgs.port).toBe(8080);
  });
});
