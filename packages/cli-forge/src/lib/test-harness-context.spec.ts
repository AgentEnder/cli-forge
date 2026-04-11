import { afterEach, describe, expect, it } from 'vitest';
import { cli } from './public-api';
import { getCommandContext } from './context';
import { TestHarness } from './test-harness';

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
});
