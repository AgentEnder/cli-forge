import { cli } from './cli-forge';

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

describe('cliForge', () => {
  afterEach(() => {
    // Tests that contain handlers which fail
    // set process.exitCode to 1
    process.exitCode = undefined;

    // Restore console.log
    console.log = ORIGINAL_CONSOLE_LOG;
  });

  it('typings should work', async () => {
    await cli('test cli')
      .option('foo', { type: 'string' })
      .command('bar', {
        builder: (argv) => argv.option('baz', { type: 'number' }),
        handler: (args) => {
          // baz should be a number
          args.baz.toFixed();

          // foo should be a string
          args.foo.concat('bar');
        },
      })
      .forge(['--foo', 'hello', 'bar', '--baz', '42']);
  });

  it('should run commands', async () => {
    let ran = false;
    let bar;
    await cli('test')
      .command('foo', {
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: (args) => {
          ran = true;
          bar = args.bar;
        },
      })
      .forge(['foo', '--bar', 'baz']);
    expect(ran).toBe(true);
    expect(bar).toBe('baz');
  });

  it('should run parent command if no subcommand is given', () => {
    const ran = { foo: false, bar: false };
    cli('test')
      .command('$0', {
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: () => {
          ran.foo = true;
        },
      })
      .command('bar', {
        builder: (argv) => argv.option('baz', { type: 'string' }),
        handler: () => {
          ran.bar = true;
        },
      })
      .forge(['something']);
    expect(ran.foo).toBe(true);
  });

  it('should be able to run subcommands', () => {
    const ran = { format: false, formatCheck: false };
    cli('test')
      .option('baz', { type: 'string' })
      .command('format', {
        builder: (argv) =>
          argv.option('bar', { type: 'string' }).command('check', {
            builder: (argv) => argv.option('foo', { type: 'string' }),
            handler: (argv) => {
              // Checks that all parent command options are available on
              // subcommands.
              argv.bar;
              argv.foo;
              argv.baz;
              ran.formatCheck = true;
            },
          }),
        handler: () => {
          ran.format = true;
        },
      })
      .forge(['format', 'check']);
    expect(ran).toMatchInlineSnapshot(`
      {
        "format": false,
        "formatCheck": true,
      }
    `);
  });

  it('should generate help text', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('baz', { type: 'string', choices: ['a', 'b'] })
      .option('qux', {
        type: 'string',
        required: true,
      })
      .option('quux', {
        type: 'string',
        default: 'a',
      })
      .command('format', {
        builder: (argv) =>
          argv.option('bar', { type: 'string' }).command('check', {
            builder: (argv) => argv.option('foo', { type: 'string' }),
            handler: () => {
              // No side effect needed.
            },
          }),
        handler: () => {
          // Not invoked.
        },
      })
      .forge(['--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Commands:
        format

      Options:
      --help - Show help for the current command
      --baz  - (a, b)                           
      --qux  - [required]                       
      --quux - [default: a]                     
       
      Run \`test [command] --help\` for more information on a command"
    `);
  });

  it('should generate help text for subcommands', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('baz', { type: 'string' })
      .command('format', {
        builder: (argv) =>
          argv.option('bar', { type: 'string' }).command('check', {
            builder: (argv) => {
              return argv.option('foo', { type: 'string' });
            },
            handler: () => {
              // No side effect needed.
            },
          }),
        handler: () => {
          // Not invoked.
        },
      })
      .forge(['format', 'check', '--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test format check

      Options:
      --help - Show help for the current command
      --baz 
      --bar 
      --foo "
    `);
  });

  it('should print help if command throws', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .command('foo', {
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: () => {
          throw new Error('test');
        },
      })
      .forge(['foo']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test foo

      Options:
      --help - Show help for the current command
      --bar "
    `);
    expect(process.exitCode).toBe(1);
  });

  it('should support async handlers', async () => {
    let ran = false;
    await cli('test')
      .command('foo', {
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          ran = true;
        },
      })
      .forge(['foo']);
    expect(ran).toBe(true);
  });

  it('should support requiring subcommands', async () => {
    let ran = false;
    await cli('test')
      .command('foo', {
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: () => {
          ran = true;
        },
      })
      .command('$0', {
        handler: () => {
          ran = true;
        },
      })
      .demandCommand()
      .forge([]);

    // With `demandCommand`, no command should be ran. Instead, the help text should be printed.
    expect(ran).toBe(false);
    expect(process.exitCode).toBe(1);
  });
});
