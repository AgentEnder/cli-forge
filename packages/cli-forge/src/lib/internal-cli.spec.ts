import { afterEach, describe, expect, it } from 'vitest';
import { InternalCLI } from './internal-cli';
import { cli } from './public-api';
import type { PromptProvider } from './prompt-types';

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
      }) as Partial<InternalCLI>;
    await test.clone?.().forge(['f']);
    await test.clone?.().forge(['foo']);
    await test.clone?.().forge(['bar']);
    await test.clone?.().forge([]);
    expect(ran).toMatchInlineSnapshot(`
      {
        "bar": 2,
        "foo": 2,
      }
    `);
  });

  it('should parse positional args when command is invoked via $0 alias', async () => {
    // When a parent CLI has options and a subcommand uses alias: ['$0'],
    // invoking without the subcommand name should still parse positionals
    // defined by the subcommand's builder.
    let receivedArgs: any;
    await cli('test', {
      builder: (args) =>
        args.option('url', { type: 'string' }).command('search', {
          alias: ['$0'],
          builder: (c) =>
            c.positional('query', { type: 'string', required: true }),
          handler: (handlerArgs) => {
            receivedArgs = handlerArgs;
          },
        }),
    }).forge(['hello']);
    expect(receivedArgs.query).toBe('hello');
    expect(receivedArgs.unmatched).toEqual([]);
  });

  it('should not run subcommand builder twice when aliased to $0', async () => {
    let builderCallCount = 0;
    await cli('test')
      .command('search', {
        alias: ['$0'],
        builder: (c) => {
          builderCallCount++;
          return c.positional('query', { type: 'string', required: true });
        },
        handler: () => {
          // noop
        },
      })
      .forge(['search', 'hello']);
    expect(builderCallCount).toBe(1);
  });

  it('should not run subcommand builder thats aliased to $0 when executing other command', async () => {
    await cli('test')
      .command('search', {
        alias: ['$0'],
        builder: () => {
          throw new Error('should not run builder');
        },
        handler: () => {
          throw new Error('should not run handler');
        },
      })
      .command('other', {
        builder: (c) => c,
        handler: () => {
          /* noop */
        },
      })
      .forge(['other']);
    // Would have thrown  if the search command's builder had been run,
    // but typed as Promise<T> | T, this one is static, so .resolves fails because
    // its not a promise, but we can still assert that it ran without error by reaching this line.
    expect(true).toBe(true);
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
        --help, -h - Show help for the current command  
        --version  - Show the version number for the CLI
        --baz      - (a, b)                             
        --qux      - [required]                         
        --quux     - [default: a]                       
       
      Run \`test [command] --help\` for more information on a command"
    `);
  });

  it('should not show hidden subcommands in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .command('visible', {
        handler: () => {
          // Not invoked.
        },
      })
      .command('secret', {
        hidden: true,
        handler: () => {
          // Not invoked.
        },
      })
      .forge(['--help']);

    const output = getOutput();
    expect(output).toContain('Commands:\n  visible');
    expect(output).not.toContain('secret');
  });

  it('should omit command help section when all subcommands are hidden', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .command('secret', {
        hidden: true,
        handler: () => {
          // Not invoked.
        },
      })
      .forge(['--help']);

    const output = getOutput();
    expect(output).not.toContain('\nCommands:\n');
    expect(output).not.toContain('[command] --help');
  });

  it('should support fluent .hidden() when composing a sub-CLI before registering it', async () => {
    const { getOutput } = mockConsoleLog();
    const secretCommand = cli('secret')
      .hidden()
      .command('$0', {
        handler: () => {
          // Not invoked.
        },
      });
    await cli('test')
      .command('visible', {
        handler: () => {
          // Not invoked.
        },
      })
      .command(secretCommand as any)
      .forge(['--help']);

    const output = getOutput();
    expect(output).toContain('Commands:\n  visible');
    expect(output).not.toContain('secret');
  });

  it('should allow .hidden(false) to unhide a previously hidden command', async () => {
    const { getOutput } = mockConsoleLog();
    const exposed = cli('exposed')
      .hidden()
      .hidden(false)
      .command('$0', {
        handler: () => {
          // Not invoked.
        },
      });
    await cli('test').command(exposed as any).forge(['--help']);

    expect(getOutput()).toContain('Commands:\n  exposed');
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
        --help, -h - Show help for the current command  
        --version  - Show the version number for the CLI
        --baz     
        --bar     
        --foo     "
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
        --help, -h - Show help for the current command  
        --version  - Show the version number for the CLI
        --bar     "
    `);
    expect(process.exitCode).toBe(1);
  });

  it('should support subcommands with positional args', async () => {
    const args = await cli('test')
      .command(
        cli('sub', {
          builder: (argv) => argv.positional('name', { type: 'string' }),
          handler: (args) => args,
        })
      )
      .forge(['sub', 'example', 'fred']);
    expect(args).toMatchInlineSnapshot(`
      {
        "name": "example",
        "unmatched": [
          "fred",
        ],
      }
    `);
  });

  it('should support fluent .handler() method', async () => {
    let receivedArgs: any;
    await cli('test')
      .option('name', { type: 'string' })
      .handler((args) => {
        receivedArgs = args;
      })
      .forge(['--name', 'world']);
    expect(receivedArgs.name).toBe('world');
  });

  it('should pass context to fluent .handler()', async () => {
    let receivedCtx: any;
    await cli('test')
      .handler((_, ctx) => {
        receivedCtx = ctx;
      })
      .forge([]);
    expect(receivedCtx.command).toBeDefined();
  });

  it('should support async fluent .handler()', async () => {
    let ran = false;
    await cli('test')
      .handler(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        ran = true;
      })
      .forge([]);
    expect(ran).toBe(true);
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
        --help, -h - Show help for the current command  
        --version  - Show the version number for the CLI
        --quux    

      Advanced:
        --baz
        --qux

      Basic:
        --foo"
    `);
  });

  it('should display option aliases in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('verbose', {
        type: 'boolean',
        alias: ['v'],
        description: 'Enable verbose output',
      })
      .option('output', {
        type: 'string',
        alias: ['o', 'out'],
        description: 'Output path',
      })
      .option('silent', { type: 'boolean' })
      .forge(['--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Options:
        --help, -h          - Show help for the current command  
        --version           - Show the version number for the CLI
        --verbose, -v       - Enable verbose output              
        --output, -o, --out - Output path                        
        --silent           "
    `);
  });

  it('should not show strip-dashed auto aliases in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('my-flag', {
        type: 'boolean',
        description: 'A flag',
      })
      .forge(['--help']);
    const output = getOutput();
    expect(output).toContain('--my-flag');
    expect(output).not.toContain('--myFlag');
  });

  it('should hide aliases marked with { hidden: true } in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('verbose', {
        type: 'boolean',
        alias: ['v', { name: 'loud', hidden: true }],
        description: 'Enable verbose output',
      })
      .forge(['--help']);
    const output = getOutput();
    expect(output).toContain('--verbose');
    expect(output).toContain('-v');
    expect(output).not.toContain('--loud');
  });

  it('should still accept a hidden alias at the argument level', async () => {
    let verbose: boolean | undefined;
    await cli('test')
      .option('verbose', {
        type: 'boolean',
        alias: [{ name: 'loud', hidden: true }],
      })
      .command('$0', {
        handler: (args) => {
          verbose = args.verbose;
        },
      })
      .forge(['--loud']);
    expect(verbose).toBe(true);
  });

  it('should display object option property details in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('config', {
        type: 'object',
        description: 'App configuration',
        properties: {
          host: {
            type: 'string',
            description: 'Server hostname',
            default: 'localhost',
          },
          port: {
            type: 'number',
            description: 'Server port',
            required: true,
          },
        },
      })
      .forge(['--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Options:
        --help, -h      - Show help for the current command  
        --version       - Show the version number for the CLI
        --config        - App configuration                  
          --config.host - Server hostname                     [default: localhost]
          --config.port - Server port                         [required]          "
    `);
  });

  it('should display nested object property details in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('config', {
        type: 'object',
        description: 'App configuration',
        properties: {
          server: {
            type: 'object',
            description: 'Server settings',
            properties: {
              host: {
                type: 'string',
                description: 'Hostname',
                default: 'localhost',
              },
              port: {
                type: 'number',
                description: 'Port number',
              },
            },
          },
          debug: {
            type: 'boolean',
            description: 'Enable debug mode',
          },
        },
      })
      .forge(['--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Options:
        --help, -h             - Show help for the current command  
        --version              - Show the version number for the CLI
        --config               - App configuration                  
          --config.server      - Server settings                    
          --config.server.host - Hostname                            [default: localhost]
          --config.server.port - Port number                        
          --config.debug       - Enable debug mode                  "
    `);
  });

  it('should display oneOf object property sub-properties in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('filter', {
        type: 'object',
        description: 'Filter criteria',
        properties: {
          prs: {
            type: 'oneOf',
            description: 'PR count filter',
            valueTypes: [
              {
                type: 'object',
                properties: {
                  min: { type: 'number', description: 'Minimum PRs' },
                  max: { type: 'number', description: 'Maximum PRs' },
                },
              },
              { type: 'string' },
            ],
          } as any,
        },
      })
      .forge(['--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Options:
        --help, -h         - Show help for the current command  
        --version          - Show the version number for the CLI
        --filter           - Filter criteria                    
          --filter.prs     - PR count filter                     [object|string]
          --filter.prs.min - Minimum PRs                        
          --filter.prs.max - Maximum PRs                        "
    `);
  });

  it('should display top-level oneOf with object valueType properties in help', async () => {
    const { getOutput } = mockConsoleLog();
    await cli('test')
      .option('value', {
        type: 'oneOf',
        description: 'A flexible value',
        valueTypes: [
          {
            type: 'object',
            properties: {
              host: { type: 'string', description: 'Hostname' },
              port: { type: 'number', description: 'Port', default: 8080 },
            },
          },
          { type: 'string' },
        ],
      } as any)
      .forge(['--help']);
    expect(getOutput()).toMatchInlineSnapshot(`
      "Usage: test

      Options:
        --help, -h     - Show help for the current command  
        --version      - Show the version number for the CLI
        --value        - A flexible value                    [object|string]
          --value.host - Hostname                           
          --value.port - Port                                [default: 8080]"
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

  it('should run root command builder before child command handlers', async () => {
    let ran = false;
    const parsed = await cli('test', {
      builder: (argv) => {
        ran = true;
        return argv
          .option('boo', {
            type: 'boolean',
          })
          .middleware((args) => {
            return { ...args, injected: 'from-root-builder' };
          });
      },
      handler: () => {
        // No-op
      },
    })
      .command('foo', {
        handler: (args) => {
          // The root command's builder middleware should have run,
          // injecting the 'injected' property.
          expect(args.injected).toBe('from-root-builder');
        },
      })
      .forge(['foo']);

    expect(ran).toBe(true);
    expect(parsed.injected).toBe('from-root-builder');
  });

  it('should support strict mode', async () => {
    const mock = mockConsoleLog();

    try {
      await cli('test')
        .strict()
        .option('foo', { type: 'string' })
        .forge(['--foo', 'hello', '--unknown', 'arg']);
    } catch {
      // Expected to throw
    }

    const output = mock.getOutput();
    expect(output).toContain('Unknown argument: --unknown');
    expect(output).toContain('Unknown argument: arg');
    mock.restore();
  });

  it('should suggest the closest subcommand for a typoed positional in strict mode', async () => {
    const mock = mockConsoleLog();

    try {
      await cli('test')
        .strict()
        .command('serve', {
          builder: (argv) => argv,
          handler: () => {
            // noop
          },
        })
        .command('build', {
          builder: (argv) => argv,
          handler: () => {
            // noop
          },
        })
        .forge(['sevre']);
    } catch {
      // Expected to throw
    }

    const output = mock.getOutput();
    expect(output).toContain('Unknown argument: sevre');
    expect(output).toContain("did you mean 'serve'");
    mock.restore();
  });

  it('should suggest closest subcommand at nested command level', async () => {
    const mock = mockConsoleLog();

    try {
      await cli('test')
        .strict()
        .command('db', {
          builder: (argv) =>
            argv
              .command('migrate', {
                builder: (a) => a,
                handler: () => {
                  // noop
                },
              })
              .command('seed', {
                builder: (a) => a,
                handler: () => {
                  // noop
                },
              }),
          handler: () => {
            // noop
          },
        })
        .forge(['db', 'migrat']);
    } catch {
      // Expected to throw
    }

    const output = mock.getOutput();
    expect(output).toContain('Unknown argument: migrat');
    expect(output).toContain("did you mean 'migrate'");
    mock.restore();
  });

  it('should suggest the closest option for an unknown flag', async () => {
    const mock = mockConsoleLog();

    try {
      await cli('test')
        .strict()
        .command('serve', {
          builder: (argv) => argv.option('port', { type: 'number' }),
          handler: () => {
            // noop
          },
        })
        .forge(['serve', '--prt']);
    } catch {
      // Expected to throw
    }

    const output = mock.getOutput();
    expect(output).toContain('Unknown argument: --prt');
    expect(output).toContain("did you mean '--port'");
    mock.restore();
  });

  it('should allow disabling strict mode via .strict(false)', async () => {
    let captured: any;

    await cli('test')
      .strict(false)
      .option('foo', { type: 'string' })
      .command('$0', {
        builder: (args) => args,
        handler: (args) => {
          captured = args;
        },
      })
      .forge(['--foo', 'hello', '--unknown', 'arg']);

    expect(captured.foo).toBe('hello');
    expect(captured.unmatched).toEqual(['--unknown', 'arg']);
  });

  it('should run parent middleware before evaluating child command handler', async () => {
    const executionOrder: string[] = [];
    let handlerArgs: any;

    await cli('test')
      .option('count', { type: 'number' })
      .middleware((args) => {
        executionOrder.push('parent middleware');
        return { ...args, injected: 'from-parent' };
      })
      .command('child', {
        builder: (argv) =>
          argv.option('name', { type: 'string' }).middleware((args) => {
            executionOrder.push('child middleware');
            return args;
          }),
        handler: (args) => {
          executionOrder.push('child handler');
          handlerArgs = args;
        },
      })
      .forge(['child', '--name', 'test', '--count', '5']);

    expect(executionOrder).toEqual([
      'parent middleware',
      'child middleware',
      'child handler',
    ]);
    // Parent middleware's injected value should be visible to the child handler
    expect(handlerArgs.injected).toBe('from-parent');
    expect(handlerArgs.name).toBe('test');
    expect(handlerArgs.count).toBe(5);
  });

  it('should run parent middleware before deeply nested child commands', async () => {
    const executionOrder: string[] = [];

    await cli('test')
      .middleware((args) => {
        executionOrder.push('root middleware');
        return args;
      })
      .command('parent', {
        builder: (argv) =>
          argv
            .middleware((args) => {
              executionOrder.push('parent middleware');
              return args;
            })
            .command('child', {
              builder: (argv) =>
                argv.middleware((args) => {
                  executionOrder.push('child middleware');
                  return args;
                }),
              handler: () => {
                executionOrder.push('child handler');
              },
            }),
        handler: () => {
          executionOrder.push('parent handler');
        },
      })
      .forge(['parent', 'child']);

    expect(executionOrder).toEqual([
      'root middleware',
      'parent middleware',
      'child middleware',
      'child handler',
    ]);
  });

  it('should support async middleware and await it before proceeding', async () => {
    const executionOrder: string[] = [];
    let handlerArgs: any;

    await cli('test')
      .option('name', { type: 'string' })
      .middleware(async (args) => {
        // Simulate an async operation (e.g., fetching config, validating tokens)
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionOrder.push('async root middleware');
        return { ...args, token: 'resolved-token' };
      })
      .command('run', {
        builder: (argv) =>
          argv.middleware(async (args) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionOrder.push('async child middleware');
            return { ...args, session: 'resolved-session' };
          }),
        handler: (args) => {
          executionOrder.push('handler');
          handlerArgs = args;
        },
      })
      .forge(['run', '--name', 'test']);

    expect(executionOrder).toEqual([
      'async root middleware',
      'async child middleware',
      'handler',
    ]);
    expect(handlerArgs.name).toBe('test');
    expect(handlerArgs.token).toBe('resolved-token');
    expect(handlerArgs.session).toBe('resolved-session');
  });

  it('should not run coerce for flags that are not passed', async () => {
    const coerceCalls: string[] = [];
    let handlerArgs: any;

    await cli('test')
      .command('$0', {
        builder: (argv) =>
          argv
            .option('provided', {
              type: 'string',
              coerce: (val) => {
                console.trace();
                coerceCalls.push('provided');
                return val.toUpperCase();
              },
            })
            .option('omitted', {
              type: 'string',
              coerce: (val) => {
                coerceCalls.push('omitted');
                return val.toUpperCase();
              },
            }),
        handler: (args) => {
          handlerArgs = args;
        },
      })
      .forge(['--provided', 'hello']);

    // Only the provided flag should have its coerce function called
    expect(coerceCalls).toEqual(['provided']);
    expect(handlerArgs.provided).toBe('HELLO');
    expect(handlerArgs.omitted).toBeUndefined();
  });

  it('should not run coerce on default values for non-object options', async () => {
    const coerceCalls: string[] = [];
    let handlerArgs: any;

    await cli('test')
      .command('$0', {
        builder: (argv) =>
          argv.option('flag', {
            type: 'string',
            default: 'default-value',
            coerce: (val) => {
              coerceCalls.push(val);
              return val.toUpperCase();
            },
          }),
        handler: (args) => {
          handlerArgs = args;
        },
      })
      .forge([]);

    // Coerce should not be called when the flag falls back to its default
    expect(coerceCalls).toEqual([]);
    // The default value should be used as-is, without coercion
    expect(handlerArgs.flag).toBe('default-value');
  });

  describe('init hooks', () => {
    it('should run init hook before command resolution', async () => {
      let handlerCalled = false;
      await cli('test')
        .option('config', { type: 'string' })
        .init(async (app, args) => {
          expect(args.config).toBe('test.json');
          app.command('serve', {
            handler: () => {
              handlerCalled = true;
            },
          });
        })
        .forge(['--config', 'test.json', 'serve']);
      expect(handlerCalled).toBe(true);
    });

    it('should run multiple init hooks sequentially', async () => {
      const order: number[] = [];
      await cli('test')
        .option('config', { type: 'string' })
        .init(async (app) => {
          order.push(1);
          app.command('first', {
            handler: () => {
              /* noop */
            },
          });
        })
        .init(async (app) => {
          order.push(2);
          app.command('second', {
            handler: () => {
              /* noop */
            },
          });
        })
        .forge(['first']);
      expect(order).toEqual([1, 2]);
    });

    it('should skip init phase when no init hooks are registered', async () => {
      let handlerCalled = false;
      await cli('test')
        .option('name', { type: 'string' })
        .command('$0', {
          handler: (args) => {
            handlerCalled = true;
            expect(args.name).toBe('world');
          },
        })
        .forge(['--name', 'world']);
      expect(handlerCalled).toBe(true);
    });

    it('should support async init hooks', async () => {
      let resolved = false;
      await cli('test')
        .init(async (app) => {
          await new Promise((r) => setTimeout(r, 10));
          resolved = true;
          app.command('run', {
            handler: () => {
              /* noop */
            },
          });
        })
        .forge(['run']);
      expect(resolved).toBe(true);
    });

    it('should handle init hook errors through error handler', async () => {
      let caughtError: any;
      try {
        await cli('test')
          .errorHandler((e) => {
            caughtError = e;
          })
          .init(async () => {
            throw new Error('init failed');
          })
          .forge([]);
      } catch {
        // withErrorHandlers re-throws after invoking handlers
      }
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toBe('init failed');
    });

    it('should be able to be specified in `builder`', async () => {
      let initRan = false;
      const app = cli('foo', {
        builder: (cli) =>
          cli.init(() => {
            initRan = true;
          }),
        handler: () => {
          /* noop */
        },
      });
      await app.forge();
      expect(initRan).toBeTruthy();
    });

    it('should run middleware before init hooks', async () => {
      let initReceivedArgs: any;
      let handlerArgs: any;
      await cli('app')
        .option('env', { type: 'string' })
        .middleware((args: any) => ({
          ...args,
          computed: `${args.env}-computed`,
        }))
        .init((app, args: any) => {
          initReceivedArgs = { ...args };
          if (args.computed === 'prod-computed') {
            app.command('deploy', {
              handler: (a) => {
                handlerArgs = a;
              },
            });
          }
        })
        .forge(['--env', 'prod', 'deploy']);

      expect(initReceivedArgs.computed).toBe('prod-computed');
      expect(handlerArgs).toBeDefined();
      expect(handlerArgs.env).toBe('prod');
    });

    it('should work after async middleware', async () => {
      const app = cli('foo', {
        builder: (argv) =>
          argv
            .middleware(async (args) => {
              const newPromise = new Promise((res) => setImmediate(res));
              await newPromise;
              (args as any)['middleware-ran'] = true;
            })
            .init((cli) => {
              cli.option('bar', {
                type: 'boolean',
              });
            }),
      });
      const parsed = await app.forge(['--bar']);
      expect(parsed).toMatchInlineSnapshot(`
        {
          "bar": true,
          "middleware-ran": true,
          "unmatched": [],
        }
      `);
    });
  });

  describe('subcommand init hooks', () => {
    it('should run init hooks registered in a subcommand builder', async () => {
      let initRan = false;
      const parsed = await cli('app')
        .command('serve', {
          builder: (cmd) =>
            cmd.option('port', { type: 'number' }).init((subcli) => {
              initRan = true;
              subcli.option('dynamic', { type: 'string' });
            }),
          handler: () => {
            // noop
          },
        })
        .forge(['serve', '--port', '8080', '--dynamic', 'hello']);

      expect(initRan).toBe(true);
      // parsed's typing is missing these flags since they
      // are not on the root path, but they should be returned nonetheless
      expect((parsed as unknown as { port: number }).port).toBe(8080);
      expect((parsed as unknown as { dynamic: string }).dynamic).toBe('hello');
    });

    it('should pass current parsed args to subcommand init hooks', async () => {
      let initArgs: any;
      await cli('app')
        .option('verbose', { type: 'boolean' })
        .command('deploy', {
          builder: (cmd) =>
            cmd.option('target', { type: 'string' }).init((_cli, args) => {
              initArgs = { ...args };
            }),
          handler: () => {
            /* noop */
          },
        })
        // Note: command name must come before boolean flags to avoid
        // the boolean parser consuming it as a value
        .forge(['deploy', '--verbose', '--target', 'aws']);

      expect(initArgs.verbose).toBe(true);
      expect(initArgs.target).toBe('aws');
    });

    it('should support nested subcommand init hooks', async () => {
      const hookOrder: string[] = [];
      let handlerArgs: any;
      await cli('app')
        .command('db', {
          builder: (cmd) =>
            cmd
              .init(() => {
                hookOrder.push('db');
              })
              .command('migrate', {
                builder: (sub) =>
                  sub.option('direction', { type: 'string' }).init((subcli) => {
                    hookOrder.push('migrate');
                    subcli.option('dry-run', { type: 'boolean' });
                  }),
                handler: (args) => {
                  handlerArgs = args;
                },
              }),
          handler: () => {
            /* noop */
          },
        })
        .forge(['db', 'migrate', '--direction', 'up', '--dry-run']);

      expect(hookOrder).toEqual(['db', 'migrate']);
      expect(handlerArgs.direction).toBe('up');
      expect(handlerArgs['dry-run']).toBe(true);
    });

    it('should work when both root and subcommand have init hooks', async () => {
      const hookOrder: string[] = [];
      let handlerArgs: any;
      await cli('app')
        .option('config', { type: 'string' })
        .init((app) => {
          hookOrder.push('root');
          app.command('serve', {
            builder: (cmd) =>
              cmd.option('port', { type: 'number' }).init((subcli) => {
                hookOrder.push('serve');
                subcli.option('hot-reload', { type: 'boolean' });
              }),
            handler: (args) => {
              handlerArgs = args;
            },
          });
        })
        .forge([
          '--config',
          'app.json',
          'serve',
          '--port',
          '3000',
          '--hot-reload',
        ]);

      expect(hookOrder).toEqual(['root', 'serve']);
      expect(handlerArgs.config).toBe('app.json');
      expect(handlerArgs.port).toBe(3000);
      expect(handlerArgs['hot-reload']).toBe(true);
    });
  });

  describe('middleware deduplication', () => {
    it('should not run the same middleware twice when registered with same reference', async () => {
      let callCount = 0;
      const mw = (args: any) => {
        callCount++;
        return args;
      };
      await cli('test')
        .middleware(mw)
        .middleware(mw)
        .command('run', {
          handler: () => {
            /* noop */
          },
        })
        .forge(['run']);
      expect(callCount).toBe(1);
    });

    it('should run different middleware functions even with same body', async () => {
      const calls: string[] = [];
      const mw1 = (args: any) => {
        calls.push('mw1');
        return args;
      };
      const mw2 = (args: any) => {
        calls.push('mw2');
        return args;
      };
      await cli('test')
        .middleware(mw1)
        .middleware(mw2)
        .command('run', {
          handler: () => {
            /* noop */
          },
        })
        .forge(['run']);
      expect(calls).toEqual(['mw1', 'mw2']);
    });

    it('should preserve middleware insertion order', async () => {
      const order: number[] = [];
      const mw1 = (args: any) => {
        order.push(1);
        return args;
      };
      const mw2 = (args: any) => {
        order.push(2);
        return args;
      };
      const mw3 = (args: any) => {
        order.push(3);
        return args;
      };
      await cli('test')
        .middleware(mw1)
        .middleware(mw2)
        .middleware(mw3)
        .middleware(mw1) // duplicate — should not change order
        .command('run', {
          handler: () => {
            /* noop */
          },
        })
        .forge(['run']);
      expect(order).toEqual([1, 2, 3]);
    });

    it('should deduplicate middleware across parent and child commands', async () => {
      let callCount = 0;
      const sharedMw = (args: any) => {
        callCount++;
        return args;
      };
      await cli('test')
        .middleware(sharedMw)
        .command('child', {
          builder: (cmd) => cmd.middleware(sharedMw),
          handler: () => {
            /* noop */
          },
        })
        .forge(['child']);
      expect(callCount).toBe(1);
    });
  });

  describe('integration: init hooks + composable builders + middleware dedup', () => {
    it('should support the full plugin loading pattern', async () => {
      // Simulates: my-app --config with-plugins plugin-cmd --watch --verbose
      // 1. Lenient parse matches --config and --verbose (registered on parent)
      // 2. Init hook reads config, registers plugin-cmd
      // 3. Re-parse resolves 'plugin-cmd --watch' from unmatched tokens
      let handlerArgs: any;
      let mwCallCount = 0;
      const sharedMw = (args: any) => {
        mwCallCount++;
        return args;
      };

      await cli('app')
        .option('config', { type: 'string' })
        .option('verbose', { type: 'boolean', alias: ['v'] })
        .middleware(sharedMw)
        .init(async (app, args) => {
          expect(args.config).toBe('with-plugins');
          expect(args.verbose).toBe(true);
          // Plugin commands register options via builder so they work with
          // the shared parser during command resolution
          app.command('plugin-cmd', {
            builder: (cmd) =>
              cmd.middleware(sharedMw).option('watch', { type: 'boolean' }),
            handler: (a) => {
              handlerArgs = a;
            },
          });
        })
        .forge([
          '--config',
          'with-plugins',
          'plugin-cmd',
          '--watch',
          '--verbose',
        ]);

      expect(handlerArgs).toBeDefined();
      expect(handlerArgs.config).toBe('with-plugins');
      expect(handlerArgs.verbose).toBe(true);
      expect(handlerArgs.watch).toBe(true);
      // Shared middleware should only run once despite being on parent and plugin
      expect(mwCallCount).toBe(1);
    });

    it('should handle init hooks that register options consumed in re-parse', async () => {
      let handlerArgs: any;
      await cli('app')
        .option('config', { type: 'string' })
        .init(async (app) => {
          // Init hook adds a new option that was previously unmatched
          app.option('extra', { type: 'string' });
        })
        .command('$0', {
          handler: (a) => {
            handlerArgs = a;
          },
        })
        .forge(['--config', 'test.json', '--extra', 'bonus']);

      expect(handlerArgs.config).toBe('test.json');
      expect(handlerArgs.extra).toBe('bonus');
    });

    it('should pass only matched args to init hooks, not unmatched tokens', async () => {
      let initArgs: any;
      await cli('app')
        .option('config', { type: 'string' })
        .init(async (app, args) => {
          initArgs = { ...args };
          app.command('deploy', {
            builder: (cmd) => cmd.option('target', { type: 'string' }),
            handler: () => {
              /* noop */
            },
          });
        })
        .forge(['--config', 'prod.json', 'deploy', '--target', 'aws']);

      expect(initArgs.config).toBe('prod.json');
      // 'deploy' and '--target' should be in unmatched, not as parsed args
      expect(initArgs.target).toBeUndefined();
    });

    it('should merge env/default values from lenient parse with re-parse results', async () => {
      let handlerArgs: any;
      process.env['APP_VERBOSE'] = 'true';
      process.env['APP_CONFIG'] = 'from-env.json';
      try {
        await cli('app')
          .env('APP')
          .option('verbose', { type: 'boolean' })
          .option('config', { type: 'string' })
          .init(async (app, args) => {
            // env vars should be populated even in lenient parse
            expect(args.verbose).toBe(true);
            expect(args.config).toBe('from-env.json');
            app.command('run', {
              handler: (a) => {
                handlerArgs = a;
              },
            });
          })
          .forge(['run']);
      } finally {
        delete process.env['APP_VERBOSE'];
        delete process.env['APP_CONFIG'];
      }

      expect(handlerArgs.verbose).toBe(true);
      expect(handlerArgs.config).toBe('from-env.json');
    });

    it('should merge default values from lenient parse with re-parse results', async () => {
      let handlerArgs: any;
      await cli('app')
        .option('verbose', { type: 'boolean', default: false })
        .option('config', { type: 'string', default: 'default.json' })
        .init(async (app, args) => {
          expect(args.verbose).toBe(false);
          expect(args.config).toBe('default.json');
          app.command('run', {
            handler: (a) => {
              handlerArgs = a;
            },
          });
        })
        .forge(['run']);

      expect(handlerArgs.verbose).toBe(false);
      expect(handlerArgs.config).toBe('default.json');
    });
  });

  describe('positional arguments with subcommands', () => {
    // CLI shape: app [file] <lint|test>
    // The parser tries subcommand lookup (via unmatchedParser) before
    // consuming tokens as positional arguments. This allows subcommand
    // names to take priority, with non-matching tokens falling through
    // to positional matching.

    function buildTestCli() {
      return cli('app')
        .positional('file', { type: 'string' })
        .command('lint', {
          builder: (cmd) =>
            cmd.option('fix', { type: 'boolean', default: false }),
          handler: (args) => args,
        })
        .command('test', {
          builder: (cmd) =>
            cmd.option('watch', { type: 'boolean', default: false }),
          handler: (args) => args,
        });
    }

    it('should run subcommand when only subcommand name is given: `app lint`', async () => {
      // `app lint` → 'lint' recognized as subcommand, file stays undefined
      const result = (await buildTestCli().forge(['lint'])) as any;
      expect(result.file).toBeUndefined();
      expect(result.fix).toBe(false);
    });

    it('should run subcommand when positional follows it: `app lint myfile`', async () => {
      // `app lint myfile` → 'lint' recognized as subcommand,
      // 'myfile' consumed as file positional
      const result = (await buildTestCli().forge(['lint', 'myfile'])) as any;
      expect(result.file).toBe('myfile');
      expect(result.fix).toBe(false);
    });

    it('should run subcommand with its own flags: `app test --watch`', async () => {
      // `app test --watch` → 'test' recognized as subcommand,
      // --watch parsed by the test subcommand
      const result = (await buildTestCli().forge(['test', '--watch'])) as any;
      expect(result.watch).toBe(true);
      expect(result.file).toBeUndefined();
    });

    it('should run subcommand when string flags precede it: `app --config x lint`', async () => {
      // `app --config x lint` → --config parsed as flag consuming 'x',
      // 'lint' recognized as subcommand (not consumed by positional)
      const result = (await cli('app')
        .option('config', { type: 'string' })
        .positional('file', { type: 'string' })
        .command('lint', {
          builder: (cmd) =>
            cmd.option('fix', { type: 'boolean', default: false }),
          handler: (args) => args,
        })
        .forge(['--config', 'app.json', 'lint'])) as any;

      expect(result.config).toBe('app.json');
      expect(result.fix).toBe(false);
      expect(result.file).toBeUndefined();
    });

    it('should run subcommand when boolean flags precede it: `app --verbose lint`', async () => {
      // `app --verbose lint` → --verbose set to true (no value consumed),
      // 'lint' recognized as subcommand
      const result = (await cli('app')
        .option('verbose', { type: 'boolean', default: false })
        .positional('file', { type: 'string' })
        .command('lint', {
          builder: (cmd) =>
            cmd.option('fix', { type: 'boolean', default: false }),
          handler: (args) => args,
        })
        .forge(['--verbose', 'lint'])) as any;

      expect(result.verbose).toBe(true);
      expect(result.fix).toBe(false);
      expect(result.file).toBeUndefined();
    });

    it('should parse positional before subcommand: `app myfile lint`', async () => {
      // `app myfile lint` → 'myfile' not a subcommand, consumed as file,
      // 'lint' recognized as subcommand
      const result = (await buildTestCli().forge(['myfile', 'lint'])) as any;
      expect(result.file).toBe('myfile');
      expect(result.fix).toBe(false);
    });

    it('should parse positional and subcommand with flags: `app myfile test --watch`', async () => {
      // `app myfile test --watch` → 'myfile' consumed as file,
      // 'test' recognized as subcommand, --watch parsed by test
      const result = (await buildTestCli().forge([
        'myfile',
        'test',
        '--watch',
      ])) as any;
      expect(result.file).toBe('myfile');
      expect(result.watch).toBe(true);
    });
  });

  describe('prompt providers', () => {
    it('should register a prompt provider via withPromptProvider', () => {
      const provider: PromptProvider = {
        prompt: async () => 'test-value',
      };
      const app = cli('test').withPromptProvider(provider);
      // Should return CLI for chaining
      expect(app).toBeDefined();
    });

    it('should throw if provider has neither prompt nor promptBatch', () => {
      expect(() => {
        cli('test').withPromptProvider({} as any);
      }).toThrow(/must implement at least one of/);
    });

    it('should store prompt config from option registration', () => {
      const app = cli('test')
        .option('name', { type: 'string', prompt: true })
        .option('age', { type: 'number', prompt: 'How old are you?' })
        .option('debug', { type: 'boolean' });

      const internal = app as unknown as InternalCLI;
      expect(internal.promptConfigs.get('name')).toBe(true);
      expect(internal.promptConfigs.get('age')).toBe('How old are you?');
      expect(internal.promptConfigs.has('debug')).toBe(false);
    });

    it('should store prompt config from positional registration', () => {
      const app = cli('test')
        .positional('file', { type: 'string', prompt: 'Which file?' });

      const internal = app as unknown as InternalCLI;
      expect(internal.promptConfigs.get('file')).toBe('Which file?');
    });

    it('should not store prompt config when prompt is not provided', () => {
      const app = cli('test')
        .option('name', { type: 'string' });

      const internal = app as unknown as InternalCLI;
      expect(internal.promptConfigs.size).toBe(0);
    });

    it('should store prompt callback config', () => {
      const promptFn = () => 'Enter value';
      const app = cli('test')
        .option('token', { type: 'string', prompt: promptFn });

      const internal = app as unknown as InternalCLI;
      expect(internal.promptConfigs.get('token')).toBe(promptFn);
    });

    it('should propagate prompt providers to subcommands', async () => {
      const prompted: string[] = [];
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return 'value';
        },
      };

      const app = cli('test')
        .withPromptProvider(provider)
        .command('sub', {
          builder: (cmd) =>
            cmd.option('name', { type: 'string', required: true }),
          handler: () => {},
        });

      await app.forge(['sub']);
      expect(prompted).toContain('name');
    });
  });

  describe('prompt resolution in forge', () => {
    it('should prompt for required options with no value when provider exists', async () => {
      const prompted: string[] = [];
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return option.name === 'name' ? 'Alice' : 42;
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('name', { type: 'string', required: true })
        .option('age', { type: 'number', required: true })
        .withPromptProvider(provider);

      await app.forge([]);
      expect(prompted).toContain('name');
      expect(prompted).toContain('age');
    });

    it('should not prompt for options with values already provided', async () => {
      const prompted: string[] = [];
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return 'value';
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('name', { type: 'string', required: true })
        .withPromptProvider(provider);

      await app.forge(['--name', 'Bob']);
      expect(prompted).not.toContain('name');
    });

    it('should prompt when prompt is true even if not required', async () => {
      const prompted: string[] = [];
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return 'value';
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('name', { type: 'string', prompt: true })
        .withPromptProvider(provider);

      await app.forge([]);
      expect(prompted).toContain('name');
    });

    it('should still prompt when prompt is true even if value already provided', async () => {
      const prompted: string[] = [];
      let handlerArgs: any;
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return 'prompted-value';
        },
      };

      const app = cli('test', {
        handler: (args) => {
          handlerArgs = args;
        },
      })
        .option('name', { type: 'string', prompt: true })
        .withPromptProvider(provider);

      await app.forge(['--name', 'cli-value']);
      expect(prompted).toContain('name');
      expect(handlerArgs.name).toBe('prompted-value');
    });

    it('should not prompt when prompt is false even if required', async () => {
      const prompted: string[] = [];
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return 'value';
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('name', { type: 'string', required: true, prompt: false })
        .withPromptProvider(provider);

      // This will throw due to required validation, but should not prompt
      await expect(app.forge([])).rejects.toThrow();
      expect(prompted).not.toContain('name');
    });

    it('should use prompt callback to resolve config', async () => {
      const prompted: string[] = [];
      const provider: PromptProvider = {
        prompt: async (option) => {
          prompted.push(option.name);
          return 'value';
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('token', {
          type: 'string',
          prompt: (args: any) => (args.authFile ? false : 'Enter token'),
        })
        .withPromptProvider(provider);

      await app.forge([]);
      expect(prompted).toContain('token');
    });

    it('should throw when prompting needed but no provider registered', async () => {
      const app = cli('test', {
        handler: () => {},
      })
        .option('name', { type: 'string', prompt: true });

      await expect(app.forge([])).rejects.toThrow(/no prompt provider/i);
    });

    it('should use filtered providers before fallback providers', async () => {
      const calls: Array<{ provider: string; option: string }> = [];
      const filteredProvider: PromptProvider = {
        filter: (name) => name === 'secret',
        prompt: async (option) => {
          calls.push({ provider: 'filtered', option: option.name });
          return 'secret-value';
        },
      };
      const fallbackProvider: PromptProvider = {
        prompt: async (option) => {
          calls.push({ provider: 'fallback', option: option.name });
          return 'fallback-value';
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('name', { type: 'string', prompt: true })
        .option('secret', { type: 'string', prompt: true })
        .withPromptProvider(filteredProvider)
        .withPromptProvider(fallbackProvider);

      await app.forge([]);
      expect(calls).toContainEqual({ provider: 'filtered', option: 'secret' });
      expect(calls).toContainEqual({ provider: 'fallback', option: 'name' });
    });

    it('should prefer promptBatch over prompt when available', async () => {
      let batchCalled = false;
      const provider: PromptProvider = {
        promptBatch: async (options) => {
          batchCalled = true;
          const result: Record<string, unknown> = {};
          for (const opt of options) {
            result[opt.name] = 'batch-value';
          }
          return result;
        },
        prompt: async () => {
          throw new Error('Should not be called when promptBatch exists');
        },
      };

      const app = cli('test', {
        handler: () => {},
      })
        .option('a', { type: 'string', prompt: true })
        .option('b', { type: 'string', prompt: true })
        .withPromptProvider(provider);

      await app.forge([]);
      expect(batchCalled).toBe(true);
    });

    it('should prompt, inject values, and pass validation', async () => {
      let handlerArgs: any;
      const provider: PromptProvider = {
        promptBatch: async (options) => {
          const results: Record<string, unknown> = {};
          for (const opt of options) {
            if (opt.config.type === 'number') {
              results[opt.name] = 42;
            } else {
              results[opt.name] = 'prompted-' + opt.name;
            }
          }
          return results;
        },
      };

      const app = cli('test', {
        handler: (args) => {
          handlerArgs = args;
        },
      })
        .option('name', { type: 'string', required: true })
        .option('port', { type: 'number', prompt: 'Which port?' })
        .option('verbose', { type: 'boolean', default: false })
        .withPromptProvider(provider);

      await app.forge([]);

      expect(handlerArgs.name).toBe('prompted-name');
      expect(handlerArgs.port).toBe(42);
      expect(handlerArgs.verbose).toBe(false); // default, not prompted
    });
  });

  describe('help customization', () => {
    it('should support disabling --help', async () => {
      const { getOutput } = mockConsoleLog();
      let handlerRan = false;
      await cli('test')
        .help(false)
        .command('$0', {
          handler: () => {
            handlerRan = true;
          },
        })
        .forge(['--help']);
      // When --help is disabled, the handler should run and --help should not produce help text
      expect(handlerRan).toBe(true);
      expect(getOutput()).toBe('');
    });

    it('should support custom help callback with object context', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .option('foo', { type: 'string' })
        .help(({ renderDefaultHelp }) => {
          return `CUSTOM HELP\n${renderDefaultHelp()}`;
        })
        .forge(['--help']);
      const output = getOutput();
      expect(output).toContain('CUSTOM HELP');
      expect(output).toContain('Usage: test');
    });

    it('should pass parsed args to help callback', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .option('verbose', { type: 'boolean', alias: ['v'] })
        .help(({ args, renderDefaultHelp }) => {
          if (args.verbose) {
            return `VERBOSE MODE\n${renderDefaultHelp()}`;
          }
          return renderDefaultHelp();
        })
        .forge(['--verbose', '--help']);
      const output = getOutput();
      expect(output).toContain('VERBOSE MODE');
    });

    it('should inherit help callback from parent command', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .help(({ renderDefaultHelp }) => {
          return `INHERITED HELP\n${renderDefaultHelp()}`;
        })
        .command('sub', {
          builder: (argv) => argv.option('bar', { type: 'string' }),
          handler: () => {
            // No side effect needed.
          },
        })
        .forge(['sub', '--help']);
      const output = getOutput();
      expect(output).toContain('INHERITED HELP');
    });

    it('should allow subcommand to override parent help callback', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .help(() => 'PARENT HELP')
        .command('sub', {
          builder: (argv) =>
            argv
              .help(() => 'CHILD HELP')
              .option('bar', { type: 'string' }),
          handler: () => {
            // No side effect needed.
          },
        })
        .forge(['sub', '--help']);
      expect(getOutput()).toBe('CHILD HELP');
    });

    it('should hide --help from help text when disabled', async () => {
      const app = cli('test')
        .help(false)
        .option('foo', { type: 'string' });
      const helpText = (app as any).formatHelp();
      expect(helpText).not.toContain('--help');
      expect(helpText).toContain('--version');
      expect(helpText).toContain('--foo');
    });

    it('should re-enable --help after .help(false) when callback is provided', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .help(false)
        .help(({ renderDefaultHelp }) => `RE-ENABLED\n${renderDefaultHelp()}`)
        .forge(['--help']);
      expect(getOutput()).toContain('RE-ENABLED');
      expect(getOutput()).toContain('--help');
    });

    it('should disable help on a subcommand while keeping it on root', async () => {
      const { getOutput } = mockConsoleLog();
      let handlerRan = false;
      await cli('test')
        .command('secret', {
          builder: (argv) =>
            argv
              .help(false)
              .option('key', { type: 'string' }),
          handler: () => {
            handlerRan = true;
          },
        })
        .forge(['secret', '--help']);
      // Help is disabled on the subcommand, so handler runs instead
      expect(handlerRan).toBe(true);
      expect(getOutput()).toBe('');
    });
  });

  describe('version customization', () => {
    it('should support disabling --version', async () => {
      const { getOutput } = mockConsoleLog();
      let handlerRan = false;
      await cli('test')
        .version(false)
        .command('$0', {
          handler: () => {
            handlerRan = true;
          },
        })
        .forge(['--version']);
      expect(handlerRan).toBe(true);
      expect(getOutput()).toBe('');
    });

    it('should support custom version callback with object context', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .version(({ renderDefaultVersion }) => {
          return `custom-app v${renderDefaultVersion()}`;
        })
        .forge(['--version']);
      const output = getOutput();
      expect(output).toContain('custom-app v');
    });

    it('should still support version string override', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test').version('1.2.3').forge(['--version']);
      expect(getOutput()).toBe('1.2.3');
    });
  });

  describe('per-option formatHelpText', () => {
    it('should use custom formatHelpText for an option', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .option('foo', {
          type: 'string',
          description: 'A foo option',
          formatHelpText: (_option, defaultText) => {
            return `${defaultText} [CUSTOM]`;
          },
        })
        .forge(['--help']);
      const output = getOutput();
      expect(output).toContain('[CUSTOM]');
      expect(output).toContain('A foo option');
    });
  });

  describe('help context options', () => {
    it('should provide options with renderHelpText in help callback', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .option('port', { type: 'number', description: 'Port number' })
        .option('host', { type: 'string', description: 'Hostname' })
        .help(({ options, renderDefaultHelp }) => {
          const optLines = options
            .filter((o) => o.key !== 'help' && o.key !== 'version')
            .map((o) => o.renderHelpText());
          return `Custom:\n${optLines.join('\n')}\n---\n${renderDefaultHelp()}`;
        })
        .forge(['--help']);
      const output = getOutput();
      expect(output).toContain('Custom:');
      expect(output).toContain('Port number');
      expect(output).toContain('Hostname');
      expect(output).toContain('---');
    });

    it('should respect per-option formatHelpText in renderHelpText', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .option('port', {
          type: 'number',
          description: 'Port',
          formatHelpText: (_opt, defaultText) => `${defaultText} [CUSTOM PORT]`,
        })
        .help(({ options }) => {
          return options.map((o) => o.renderHelpText()).join('\n');
        })
        .forge(['--help']);
      const output = getOutput();
      expect(output).toContain('[CUSTOM PORT]');
    });
  });

  describe('.catch() error handler', () => {
    it('should suppress error when handler returns normally', async () => {
      const { getOutput } = mockConsoleLog();
      let caughtError: unknown;
      // No try/catch — forge() should NOT throw since the handler suppresses.
      await cli('test')
        .option('name', { type: 'string', required: true })
        .catch((error) => {
          caughtError = error;
          console.log('CAUGHT');
        })
        .command('$0', {
          handler: () => {
            // should not run
          },
        })
        .forge([]);
      expect(caughtError).toBeDefined();
      expect(getOutput()).toBe('CAUGHT');
    });

    it('should propagate error when handler rethrows', async () => {
      let threw = false;
      try {
        await cli('test')
          .option('name', { type: 'string', required: true })
          .catch((error) => {
            throw error;
          })
          .command('$0', {
            handler: () => {
              // should not run
            },
          })
          .forge([]);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it('should provide renderDefaultHelp in catch context', async () => {
      const { getOutput } = mockConsoleLog();
      await cli('test')
        .option('name', { type: 'string', required: true })
        .catch((_error, { renderDefaultHelp }) => {
          console.log(`Error! ${renderDefaultHelp().split('\n')[0]}`);
        })
        .command('$0', {
          handler: () => {
            // should not run
          },
        })
        .forge([]);
      expect(getOutput()).toContain('Error! Usage: test');
    });
  });
});
