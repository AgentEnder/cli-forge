import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cli } from './public-api';
import { getCommandContext } from './context';
import { TestHarness } from './test-harness';
import { contextStorage } from './async-context';

beforeEach(() => {
  // ALS state can leak between tests in the same async chain (enterWith
  // persists through awaits). Force a clean slate at the start of every
  // test so assertions about "no context active" are meaningful.
  contextStorage.enterWith(undefined);
});

afterEach(() => {
  TestHarness.clearMockedContexts();
});

describe('TestHarness.mockContext()', () => {
  it('provides mocked args via getCommandContext', () => {
    const app = cli('test').option('name', { type: 'string' });

    TestHarness.mockContext(app, { args: { name: 'mocked-name' } });

    const ctx = getCommandContext(app);
    expect(ctx.args).toMatchObject({ name: 'mocked-name' });
  });

  it('provides mocked providers via inject', () => {
    const app = cli('test').provide('db', 'real-db');

    TestHarness.mockContext(app, { providers: { db: 'mock-db' } });

    const ctx = getCommandContext(app);
    expect(ctx.inject('db')).toBe('mock-db');
  });

  it('sets commandChain when provided', () => {
    const app = cli('test');

    TestHarness.mockContext(app, { commandChain: ['test', 'serve'] });

    const ctx = getCommandContext(app);
    expect(ctx.commandChain).toEqual(['test', 'serve']);
  });

  it('cleanup function removes the mocked context', () => {
    const app = cli('test');

    const cleanup = TestHarness.mockContext(app, { args: {} });

    // Verify context is set
    expect(() => getCommandContext(app)).not.toThrow();

    // Run cleanup
    cleanup();

    // Context should be gone now
    expect(() => getCommandContext(app)).toThrow(/No CLI context found/);
  });

  it('clearMockedContexts removes all mocked contexts', () => {
    const app1 = cli('test1');
    const app2 = cli('test2');

    TestHarness.mockContext(app1, { args: {} });
    TestHarness.mockContext(app2, { args: {} });

    // Last one wins (enterWith is last-write-wins in the same execution context)
    expect(() => getCommandContext(app2)).not.toThrow();

    TestHarness.clearMockedContexts();

    expect(() => getCommandContext(app2)).toThrow(/No CLI context found/);
  });

  it('uses empty defaults when no options provided', () => {
    const app = cli('test');

    TestHarness.mockContext(app, {});

    const ctx = getCommandContext(app);
    expect(ctx.args).toEqual({});
    expect(ctx.commandChain).toEqual([]);
  });

  it('resolves factory providers passed to mockContext', () => {
    const app = cli('test')
      .option('tag', { type: 'string' })
      .provide('label', {
        factory: (args) => `real-${args.tag}`,
      });

    TestHarness.mockContext(app, {
      args: { tag: 'mocked' },
      providers: {
        label: {
          factory: (args: any) => `mock-${args.tag}`,
        } as any,
      },
    });

    const ctx = getCommandContext(app);
    expect(ctx.inject('label')).toBe('mock-mocked');
  });

  it('resolves global-lifetime factory providers passed to mockContext', () => {
    const app = cli('test').provide('svc', {
      factory: () => ({ real: true }),
      lifetime: 'global',
    });

    TestHarness.mockContext(app, {
      providers: {
        svc: {
          factory: () => ({ mock: true }),
          lifetime: 'global',
        } as any,
      },
    });

    const ctx = getCommandContext(app);
    expect(ctx.inject('svc')).toEqual({ mock: true });
  });
});

describe('TestHarness.runWithMockedContext()', () => {
  it('scopes the mocked context across async boundaries', async () => {
    const app = cli('test').provide('db', 'real-db');

    const result = await TestHarness.runWithMockedContext(
      app,
      { providers: { db: 'mock-db' } },
      async () => {
        // Force an async gap to prove the context survives awaits.
        await new Promise((r) => setTimeout(r, 5));
        return getCommandContext(app).inject('db');
      }
    );

    expect(result).toBe('mock-db');
  });

  it('tears down the mocked context when fn resolves', async () => {
    const app = cli('test').provide('db', 'real-db');

    await TestHarness.runWithMockedContext(
      app,
      { providers: { db: 'mock-db' } },
      () => {
        expect(getCommandContext(app).inject('db')).toBe('mock-db');
      }
    );

    // Outside the run() callback, the mock should be gone.
    expect(() => getCommandContext(app)).toThrow(/No CLI context found/);
  });

  it('tears down the mocked context when fn throws', async () => {
    const app = cli('test');
    const error = new Error('boom');

    await expect(
      TestHarness.runWithMockedContext(app, { args: {} }, () => {
        throw error;
      })
    ).rejects.toBe(error);

    expect(() => getCommandContext(app)).toThrow(/No CLI context found/);
  });
});

describe('TestHarness.clearMockedContexts()', () => {
  it('resets the global provider cache', async () => {
    let callCount = 0;
    const app = cli('test')
      .provide('counter', {
        factory: () => ++callCount,
        lifetime: 'global',
      })
      .handler(() => {
        void getCommandContext(app).inject('counter');
      });

    await app.forge([]);
    expect(callCount).toBe(1);

    TestHarness.clearMockedContexts();

    await app.forge([]);
    expect(callCount).toBe(2);
  });
});
