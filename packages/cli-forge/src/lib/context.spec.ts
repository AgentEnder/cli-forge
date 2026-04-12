import { afterEach, describe, expect, it } from 'vitest';
import type { ParsedArgs } from '@cli-forge/parser';
import { cli, CLI } from './public-api';
import { getCommandContext, resetGlobalProviders } from './context';

afterEach(() => {
  // Reset exit code set by handlers that error
  process.exitCode = undefined;
  // Wipe any global-lifetime provider state between specs
  resetGlobalProviders();
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

  it('isolates global providers across unrelated CLIs that share a key', async () => {
    // Two independent apps both register `lifetime: 'global'` under the
    // same provider key but with different factories. The global cache is
    // keyed by factory function identity, so each app must see the value
    // produced by its own factory — not the first one to run.
    let resolvedA: unknown;
    let resolvedB: unknown;

    const appA = cli('app-a')
      .provide('svc', {
        factory: () => ({ from: 'A' }),
        lifetime: 'global',
      })
      .handler(() => {
        resolvedA = getCommandContext(appA).inject('svc');
      });

    const appB = cli('app-b')
      .provide('svc', {
        factory: () => ({ from: 'B' }),
        lifetime: 'global',
      })
      .handler(() => {
        resolvedB = getCommandContext(appB).inject('svc');
      });

    await appA.forge([]);
    await appB.forge([]);

    expect(resolvedA).toEqual({ from: 'A' });
    expect(resolvedB).toEqual({ from: 'B' });
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

    // The no-arg generic overload lets us use a type witness for a CLI
    // that claims a `missing` provider — even though the actual running
    // CLI doesn't register it. `inject('missing', fallback)` is typed
    // via the phantom witness, and the runtime falls through to the
    // default because `missing` isn't in the active providerFactories.
    // This is the intended purpose of the default-value overload:
    // a graceful fallback when the type witness and the real CLI drift.
    type PhantomCli = CLI<ParsedArgs, void, {}, undefined, { missing: string }>;

    await cli('test')
      .provide('db', { factory: () => 'real-db', lifetime: 'executionScope' })
      .command('run', {
        handler: () => {
          const ctx = getCommandContext<PhantomCli>();
          result = ctx.inject('missing', 'fallback');
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

  it('throws a cycle error when two factories inject each other', async () => {
    let caught: unknown;

    await cli('test')
      .provide('a', {
        factory: () => getCommandContext().inject('b' as never),
      })
      .provide('b', {
        factory: () => getCommandContext().inject('a' as never),
      })
      .handler(() => {
        try {
          getCommandContext().inject('a' as never);
        } catch (e) {
          caught = e;
        }
      })
      .forge([]);

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/Circular provider dependency/);
    expect((caught as Error).message).toContain('a -> b -> a');
  });

  it('throws when getCommandContext is passed a CLI not in the active chain', async () => {
    const unrelated = cli('unrelated');
    let caught: unknown;

    await cli('app', {
      handler: () => {
        try {
          getCommandContext(unrelated);
        } catch (e) {
          caught = e;
        }
      },
    }).forge([]);

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/not part of the active command chain/);
  });

  it('accepts the root CLI from within a subcommand handler', async () => {
    let didRun = false;

    const app = cli('app')
      .provide('svc', 'root-svc')
      .command('build', {
        handler: () => {
          // Passing the root from inside a subcommand handler is valid —
          // the chain includes every command from root down to the running
          // command.
          const ctx = getCommandContext(app);
          expect(ctx.inject('svc')).toBe('root-svc');
          didRun = true;
        },
      });

    await app.forge(['build']);

    expect(didRun).toBe(true);
  });

  it('accepts the currently-running subcommand when it is reachable by reference', async () => {
    let didRun = false;

    // Build the subcommand inline so its handler has access to `this`
    // through TChildren, then fetch the tracked instance via
    // `app.getChildren()` to pass it as the witness.
    const app = cli('app').command('build', {
      builder: (cmd) => cmd.option('target', { type: 'string', required: true }),
      handler: () => {
        const build = app.getChildren().build;
        const ctx = getCommandContext(build);
        expect(ctx.args.target).toBe('web');
        didRun = true;
      },
    });

    await app.forge(['build', '--target', 'web']);

    expect(didRun).toBe(true);
  });

  it('resetGlobalProviders() re-invokes global factories on next execution', async () => {
    let callCount = 0;

    const app = cli('test')
      .provide('counter', {
        factory: () => ++callCount,
        lifetime: 'global',
      })
      .handler(() => {
        void getCommandContext().inject('counter');
      });

    await app.forge([]);
    expect(callCount).toBe(1);

    await app.forge([]);
    expect(callCount).toBe(1); // still cached

    resetGlobalProviders();
    await app.forge([]);
    expect(callCount).toBe(2); // re-invoked after reset
  });
});

describe('cli.getContext() instance method', () => {
  it('returns the same args as getCommandContext(cli)', async () => {
    let viaMethod: unknown;
    let viaFunction: unknown;

    const app = cli('test', {
      builder: (cmd) => cmd.option('name', { type: 'string', default: 'world' }),
      handler: () => {
        viaMethod = app.getContext().args;
        viaFunction = getCommandContext(app).args;
      },
    });

    await app.forge(['--name', 'alice']);

    expect(viaMethod).toEqual(viaFunction);
    expect((viaMethod as { name: string }).name).toBe('alice');
  });

  it('resolves providers via inject() on the returned context', async () => {
    let injected: unknown;

    const app = cli('test')
      .provide('greeting', 'hello from method')
      .command('run', {
        handler: () => {
          injected = app.getContext().inject('greeting');
        },
      });

    await app.forge(['run']);

    expect(injected).toBe('hello from method');
  });

  it('walks the provider chain from a subcommand reference', async () => {
    let injected: unknown;

    const app = cli('app')
      .provide('logger', 'parent-logger')
      .command('build', {
        handler: () => {
          // The root app is reachable, so calling getContext() on it from
          // inside a subcommand handler should succeed and expose the
          // parent provider.
          injected = app.getContext().inject('logger');
        },
      });

    await app.forge(['build']);

    expect(injected).toBe('parent-logger');
  });

  it('throws when called from a CLI that is not in the active command chain', async () => {
    const unrelated = cli('unrelated');
    let caught: unknown;

    await cli('app', {
      handler: () => {
        try {
          unrelated.getContext();
        } catch (e) {
          caught = e;
        }
      },
    }).forge([]);

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/not part of the active command chain/);
  });

  it('throws when called outside a handler', () => {
    const app = cli('test');
    expect(() => app.getContext()).toThrow(/No CLI context found/);
  });

  it('exposes commandChain via the returned context', async () => {
    let chain: string[] | undefined;

    const app = cli('my-app').command('serve', {
      handler: () => {
        chain = app.getContext().commandChain;
      },
    });

    await app.forge(['serve']);

    expect(chain).toEqual(['serve']);
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
