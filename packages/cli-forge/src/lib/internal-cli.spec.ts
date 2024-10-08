import { InternalCLI } from './internal-cli';
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
      .option('foo', { type: 'string', required: true })
      .command('bar', {
        builder: (argv) => argv.option('baz', { type: 'number' }),
        handler: (args) => {
          // baz should be a number
          args.baz?.toFixed();

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

  it('should run commands by alias', async () => {
    const ran: Record<string, number> = {};
    const makeHandler = (name: string) => () => {
      ran[name] = (ran[name] || 0) + 1;
    };

    const test = cli('test')
      .command('foo', {
        alias: ['f'],
        builder: (argv) => argv,
        handler: makeHandler('foo'),
      })
      .command('bar', {
        alias: ['$0'],
        builder: (argv) => argv,
        handler: makeHandler('bar'),
      }) as InternalCLI;
    await test.clone().forge(['f']);
    await test.clone().forge(['foo']);
    await test.clone().forge(['bar']);
    await test.clone().forge([]);
    expect(ran).toMatchInlineSnapshot(`
      {
        "bar": 2,
        "foo": 2,
      }
    `);
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
        --help    - Show help for the current command  
        --version - Show the version number for the CLI
        --baz     - (a, b)                             
        --qux     - [required]                         
        --quux    - [default: a]                       
       
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
        --help    - Show help for the current command  
        --version - Show the version number for the CLI
        --baz    
        --bar    
        --foo    "
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
        --help    - Show help for the current command  
        --version - Show the version number for the CLI
        --bar    "
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

  it('should support displaying grouped options in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('foo', { type: 'string', group: 'Basic' })
      .option('baz', { type: 'string' })
      .option('qux', { type: 'string' })
      .option('quux', { type: 'string' })
      .group('Advanced', ['baz', 'qux'])
      .forge(['--help']);

    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Options:
        --help    - Show help for the current command  
        --version - Show the version number for the CLI
        --quux   

      Advanced:
        --baz
        --qux

      Basic:
        --foo"
    `);
  });

  it('should run middlewares before command handlers', async () => {
    const executionOrder: string[] = [];
    await cli('test')
      .middleware((args) => {
        executionOrder.push('middleware1');
        return args;
      })
      .middleware((args) => {
        executionOrder.push('middleware2');
        return args;
      })
      .command('foo', {
        builder: (argv) =>
          argv.middleware((args) => {
            executionOrder.push('middleware3');
            return args;
          }),
        handler: () => {
          executionOrder.push('foo handler');
        },
      })
      .command('bar', {
        builder: (argv) =>
          argv.middleware((args) => {
            executionOrder.push('middleware4');
            return args;
          }),
        handler: () => {
          executionOrder.push('bar handler');
        },
      })
      .forge(['foo']);

    expect(executionOrder).toEqual([
      // middlewares first, only for the command being executed
      'middleware1',
      'middleware2',
      'middleware3',
      // then the handler
      'foo handler',

      // NO:
      // - middlewares for the 'bar' command
      // - 'bar' handler
    ]);
  });
});
