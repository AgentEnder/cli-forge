import { afterEach, describe, expect, it } from 'vitest';
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
        "name": "fred",
        "unmatched": [],
      }
    `);
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
    } catch (e) {
      // Expected to throw
    }

    const output = mock.getOutput();
    expect(output).toContain('Unknown argument: --unknown');
    expect(output).toContain('Unknown argument: arg');
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
          handler: () => {},
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
          handler: () => {},
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
        .command('run', { handler: () => {} })
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
          handler: () => {},
        })
        .forge(['child']);
      expect(callCount).toBe(1);
    });
  });
});
