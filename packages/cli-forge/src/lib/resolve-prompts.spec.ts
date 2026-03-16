import { describe, it, expect, vi } from 'vitest';
import { resolvePrompts } from './resolve-prompts';
import type { InternalOptionConfig } from '@cli-forge/parser';
import type { PromptProvider } from './prompt-types';

function makeConfig(
  overrides: Partial<InternalOptionConfig> & { key: string }
): InternalOptionConfig {
  return {
    type: 'string',
    ...overrides,
  } as InternalOptionConfig;
}

describe('resolvePrompts', () => {
  it('should return empty object when no options need prompting', async () => {
    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name' }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [],
      currentArgs: { name: 'Alice' },
    });
    expect(result).toEqual({});
  });

  it('should prompt for required options missing values', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('prompted-value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name', required: true }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({ name: 'prompted-value' });
    expect(provider.prompt).toHaveBeenCalledOnce();
  });

  it('should not prompt for required options that already have values', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('prompted-value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name', required: true }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: { name: 'existing' },
    });

    expect(result).toEqual({});
    expect(provider.prompt).not.toHaveBeenCalled();
  });

  it('should call prompt callback with current args', async () => {
    const promptFn = vi.fn().mockReturnValue('Enter token');
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('token-value'),
    };

    await resolvePrompts({
      configuredOptions: {
        token: makeConfig({ key: 'token' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([['token', promptFn]]),
      providers: [provider],
      currentArgs: { someFlag: true },
    });

    expect(promptFn).toHaveBeenCalledWith({ someFlag: true });
  });

  it('should not prompt when callback returns null', async () => {
    const promptFn = vi.fn().mockReturnValue(null);
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        token: makeConfig({ key: 'token' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([['token', promptFn]]),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({});
    expect(provider.prompt).not.toHaveBeenCalled();
  });

  it('should prompt for implied options when trigger is set and implied option is missing', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        output: makeConfig({ key: 'output' }),
        format: makeConfig({ key: 'format' }),
      },
      configuredImplies: { output: new Set(['format']) },
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: { output: '/tmp/out' },
    });

    expect(result).toEqual({ format: 'value' });
  });

  it('should not prompt for implied options when trigger is not set', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        output: makeConfig({ key: 'output' }),
        format: makeConfig({ key: 'format' }),
      },
      configuredImplies: { output: new Set(['format']) },
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({});
    expect(provider.prompt).not.toHaveBeenCalled();
  });

  it('should group options by matched provider for batch calls', async () => {
    const batchProvider: PromptProvider = {
      filter: (name) => name.startsWith('db'),
      promptBatch: vi
        .fn()
        .mockResolvedValue({ dbHost: 'localhost', dbPort: 5432 }),
    };
    const fallbackProvider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('fallback'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        dbHost: makeConfig({ key: 'dbHost' }),
        dbPort: makeConfig({ key: 'dbPort' }),
        name: makeConfig({ key: 'name' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([
        ['dbHost', true],
        ['dbPort', true],
        ['name', true],
      ]),
      providers: [batchProvider, fallbackProvider],
      currentArgs: {},
    });

    expect(batchProvider.promptBatch).toHaveBeenCalledOnce();
    expect(fallbackProvider.prompt).toHaveBeenCalledOnce();
    expect(result).toEqual({
      dbHost: 'localhost',
      dbPort: 5432,
      name: 'fallback',
    });
  });

  it('should skip options where prompt is false', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name', required: true }),
      },
      configuredImplies: {},
      promptConfigs: new Map([['name', false]]),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({});
    expect(provider.prompt).not.toHaveBeenCalled();
  });

  it('should throw when options need prompting but no provider matches', async () => {
    await expect(
      resolvePrompts({
        configuredOptions: {
          name: makeConfig({ key: 'name' }),
        },
        configuredImplies: {},
        promptConfigs: new Map([['name', true]]),
        providers: [],
        currentArgs: {},
      })
    ).rejects.toThrow(/no prompt provider/i);
  });

  it('should skip internal options (help, version, unmatched, --)', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        help: makeConfig({ key: 'help', required: true }),
        version: makeConfig({ key: 'version', required: true }),
        unmatched: makeConfig({ key: 'unmatched', required: true }),
        '--': makeConfig({ key: '--', required: true }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({});
    expect(provider.prompt).not.toHaveBeenCalled();
  });

  it('should prefer promptBatch over prompt when both are available', async () => {
    let batchCalled = false;
    const provider: PromptProvider = {
      promptBatch: vi.fn().mockImplementation(async (options) => {
        batchCalled = true;
        const result: Record<string, unknown> = {};
        for (const opt of options) {
          result[opt.name] = 'batch-value';
        }
        return result;
      }),
      prompt: vi.fn().mockImplementation(async () => {
        throw new Error('Should not be called when promptBatch exists');
      }),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        a: makeConfig({ key: 'a' }),
        b: makeConfig({ key: 'b' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([
        ['a', true],
        ['b', true],
      ]),
      providers: [provider],
      currentArgs: {},
    });

    expect(batchCalled).toBe(true);
    expect(provider.prompt).not.toHaveBeenCalled();
    expect(result).toEqual({ a: 'batch-value', b: 'batch-value' });
  });

  it('should prompt with string label when prompt config is a string', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name' }),
      },
      configuredImplies: {},
      promptConfigs: new Map([['name', 'What is your name?']]),
      providers: [provider],
      currentArgs: {},
    });

    expect(provider.prompt).toHaveBeenCalledOnce();
    const calledOption = (provider.prompt as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(calledOption.name).toBe('name');
    expect(calledOption.config.prompt).toBe('What is your name?');
  });

  it('should not prompt for non-required options without explicit prompt config', async () => {
    const provider: PromptProvider = {
      prompt: vi.fn().mockResolvedValue('value'),
    };

    const result = await resolvePrompts({
      configuredOptions: {
        name: makeConfig({ key: 'name' }),
      },
      configuredImplies: {},
      promptConfigs: new Map(),
      providers: [provider],
      currentArgs: {},
    });

    expect(result).toEqual({});
    expect(provider.prompt).not.toHaveBeenCalled();
  });
});
