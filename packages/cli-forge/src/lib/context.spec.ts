import { afterEach, describe, expect, it } from 'vitest';
import { cli } from './public-api';
import { getCommandContext } from './context';

afterEach(() => {
  // Reset exit code set by handlers that error
  process.exitCode = undefined;
});

describe('getCommandContext() via forge()', () => {
  it('provides args during handler execution', async () => {
    let capturedArgs: any;

    await cli('test', {
      builder: (cmd) => cmd.option('name', { type: 'string', default: 'world' }),
      handler: () => {
        const ctx = getCommandContext();
        capturedArgs = ctx.args;
      },
    }).forge(['--name', 'alice']);

    expect(capturedArgs.name).toBe('alice');
  });

  it('provides commandChain for root command', async () => {
    let capturedChain: string[] | undefined;

    await cli('my-app', {
      handler: () => {
        const ctx = getCommandContext();
        capturedChain = ctx.commandChain;
      },
    }).forge([]);

    expect(capturedChain).toEqual([]);
  });

  it('provides commandChain for subcommand', async () => {
    let capturedChain: string[] | undefined;

    await cli('my-app')
      .command('serve', {
        handler: () => {
          const ctx = getCommandContext();
          capturedChain = ctx.commandChain;
        },
      })
      .forge(['serve']);

    expect(capturedChain).toEqual(['serve']);
  });

  it('resolves eager providers via inject()', async () => {
    let injectedValue: unknown;

    await cli('test')
      .provide('greeting', 'hello from eager')
      .command('run', {
        handler: () => {
          const ctx = getCommandContext();
          injectedValue = ctx.inject('greeting');
        },
      })
      .forge(['run']);

    expect(injectedValue).toBe('hello from eager');
  });

  it('resolves executionScope factory providers with finalized args', async () => {
    let resolvedValue: unknown;

    await cli('test', {
      builder: (cmd) => cmd.option('prefix', { type: 'string', default: 'hi' }),
    })
      .provide('greeting', {
        factory: (args: Record<string, unknown>) => `${args['prefix']} world`,
        lifetime: 'executionScope',
      })
      .command('run', {
        handler: () => {
          const ctx = getCommandContext();
          resolvedValue = ctx.inject('greeting');
        },
      })
      .forge(['--prefix', 'hey', 'run']);

    expect(resolvedValue).toBe('hey world');
  });

  it('resolves global factory providers once and caches permanently', async () => {
    let callCount = 0;
    let first: unknown;
    let second: unknown;

    const app = cli('test')
      .provide('counter', {
        factory: () => {
          callCount++;
          return callCount;
        },
        lifetime: 'global',
      })
      .command('run', {
        handler: () => {
          const ctx = getCommandContext();
          first = ctx.inject('counter');
          second = ctx.inject('counter');
        },
      });

    await app.forge(['run']);

    // Factory called once per global lifetime (may be cached from previous runs
    // in the same process — that's the expected global behavior)
    expect(first).toBe(second);
    expect(typeof first).toBe('number');
  });

  it('throws for unregistered key without default', async () => {
    let thrownError: unknown;

    await cli('test', {
      handler: () => {
        const ctx = getCommandContext();
        try {
          ctx.inject('missing' as never);
        } catch (e) {
          thrownError = e;
        }
      },
    }).forge([]);

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toContain('missing');
  });

  it('returns default for unregistered key when default is provided', async () => {
    let result: unknown;

    await cli('test')
      .provide('db', { factory: () => 'real-db', lifetime: 'executionScope' })
      .command('run', {
        handler: () => {
          const ctx = getCommandContext();
          // 'db' is registered so inject works; we test an unregistered key
          // by using a CLI without the provider but passing a default
          result = (ctx as any).inject('nonexistent', 'fallback');
        },
      })
      .forge(['run']);

    expect(result).toBe('fallback');
  });

  it('throws when called outside a handler', () => {
    expect(() => getCommandContext()).toThrow(
      /No CLI context found/
    );
  });

  it('providers from parent commands are available in child command handlers', async () => {
    let injectedFromParent: unknown;

    await cli('app')
      .provide('logger', 'parent-logger')
      .command('build', {
        handler: () => {
          const ctx = getCommandContext();
          injectedFromParent = ctx.inject('logger');
        },
      })
      .forge(['build']);

    expect(injectedFromParent).toBe('parent-logger');
  });

  it('child provider overrides parent provider', async () => {
    let injected: unknown;

    const app = cli('app').provide('db', 'parent-db');
    app.command('build', {
      builder: (cmd) => cmd.provide('db', 'child-db'),
      handler: () => {
        const ctx = getCommandContext();
        injected = ctx.inject('db');
      },
    });

    await app.forge(['build']);

    expect(injected).toBe('child-db');
  });
});

describe('getCommandContext() via sdk()', () => {
  it('provides args during handler execution in SDK mode', async () => {
    let capturedArgs: any;

    const app = cli('test', {
      builder: (cmd) => cmd.option('name', { type: 'string', default: 'sdk-user' }),
      handler: () => {
        const ctx = getCommandContext();
        capturedArgs = ctx.args;
      },
    });

    await app.sdk()({ name: 'alice' });

    expect(capturedArgs.name).toBe('alice');
  });

  it('resolves eager providers in SDK mode', async () => {
    let injectedValue: unknown;

    const app = cli('test')
      .provide('greeting', 'sdk-hello')
      .command('run', {
        handler: () => {
          const ctx = getCommandContext();
          injectedValue = ctx.inject('greeting');
        },
      });

    await app.sdk().run({});

    expect(injectedValue).toBe('sdk-hello');
  });

  it('resolves executionScope factory providers in SDK mode', async () => {
    let resolvedValue: unknown;

    const app = cli('test', {
      builder: (cmd) => cmd.option('prefix', { type: 'string', default: 'hey' }),
    })
      .provide('msg', {
        factory: (args: Record<string, unknown>) => `${args['prefix']} sdk`,
        lifetime: 'executionScope',
      })
      .command('run', {
        handler: () => {
          const ctx = getCommandContext();
          resolvedValue = ctx.inject('msg');
        },
      });

    await app.sdk().run({ prefix: 'greetings from' });

    expect(resolvedValue).toBe('greetings from sdk');
  });
});
