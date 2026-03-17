import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PromptOption } from '../lib/prompt-types';

// Mock the dynamic import of @clack/prompts
const mockClack = {
  text: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
};

vi.mock('@clack/prompts', () => mockClack);

// Import after mock is set up
import { createClackPromptProvider } from './clack';

function makeOption(
  overrides: Partial<PromptOption['config']> & { name: string }
): PromptOption {
  const { name, ...config } = overrides;
  return {
    name,
    config: { type: 'string', key: name, ...config } as PromptOption['config'],
  };
}

describe('createClackPromptProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClack.isCancel.mockReturnValue(false);
  });

  describe('type mapping', () => {
    it('should use confirm() for boolean options', async () => {
      mockClack.confirm.mockResolvedValue(true);
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({ name: 'verbose', type: 'boolean' }),
      ]);

      expect(mockClack.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'verbose' })
      );
      expect(result).toEqual({ verbose: true });
    });

    it('should pass initialValue for boolean options with defaults', async () => {
      mockClack.confirm.mockResolvedValue(false);
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({ name: 'verbose', type: 'boolean', default: true }),
      ]);

      expect(mockClack.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ initialValue: true })
      );
    });

    it('should use text() for string options without choices', async () => {
      mockClack.text.mockResolvedValue('hello');
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({ name: 'name', type: 'string' }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'name' })
      );
      expect(result).toEqual({ name: 'hello' });
    });

    it('should use select() for string options with choices', async () => {
      mockClack.select.mockResolvedValue('b');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({
          name: 'color',
          type: 'string',
          choices: ['a', 'b', 'c'],
        } as any),
      ]);

      expect(mockClack.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'color',
          options: [
            { value: 'a', label: 'a' },
            { value: 'b', label: 'b' },
            { value: 'c', label: 'c' },
          ],
        })
      );
    });

    it('should use multiselect() for array options with choices', async () => {
      mockClack.multiselect.mockResolvedValue(['x', 'z']);
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({
          name: 'tags',
          type: 'array',
          choices: ['x', 'y', 'z'],
        } as any),
      ]);

      expect(mockClack.multiselect).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'tags',
          options: [
            { value: 'x', label: 'x' },
            { value: 'y', label: 'y' },
            { value: 'z', label: 'z' },
          ],
        })
      );
      expect(result).toEqual({ tags: ['x', 'z'] });
    });

    it('should use text() for number options and coerce to Number', async () => {
      mockClack.text.mockResolvedValue('42');
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({ name: 'port', type: 'number' }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'port' })
      );
      expect(result).toEqual({ port: 42 });
    });

    it('should use default for number options when input is empty', async () => {
      mockClack.text.mockResolvedValue('');
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({ name: 'port', type: 'number', default: 3000 }),
      ]);

      expect(result).toEqual({ port: 3000 });
    });

    it('should validate number input rejects non-numeric values', async () => {
      mockClack.text.mockResolvedValue('42');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({ name: 'port', type: 'number' }),
      ]);

      // Extract the validate function that was passed to clack.text
      const callArgs = mockClack.text.mock.calls[0][0];
      expect(callArgs.validate('abc')).toBe('Please enter a valid number');
      expect(callArgs.validate('42')).toBeUndefined();
      expect(callArgs.validate('')).toBeUndefined();
    });
  });

  describe('label resolution', () => {
    it('should use prompt string as label when available', async () => {
      mockClack.text.mockResolvedValue('val');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({
          name: 'token',
          type: 'string',
          description: 'API token',
          prompt: 'Enter your API token',
        }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Enter your API token' })
      );
    });

    it('should use description as label when prompt is boolean', async () => {
      mockClack.text.mockResolvedValue('val');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({
          name: 'token',
          type: 'string',
          description: 'API token',
          prompt: true,
        }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'API token' })
      );
    });

    it('should fall back to option name when no description or prompt string', async () => {
      mockClack.text.mockResolvedValue('val');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({ name: 'token', type: 'string' }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'token' })
      );
    });
  });

  describe('default value extraction', () => {
    it('should pass primitive defaults as placeholder and defaultValue', async () => {
      mockClack.text.mockResolvedValue('override');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({ name: 'host', type: 'string', default: 'localhost' }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({
          placeholder: 'localhost',
          defaultValue: 'localhost',
        })
      );
    });

    it('should extract value from { value, description } defaults', async () => {
      mockClack.text.mockResolvedValue('override');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({
          name: 'host',
          type: 'string',
          default: { value: 'localhost', description: 'The default host' },
        }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({
          placeholder: 'localhost',
          defaultValue: 'localhost',
        })
      );
    });

    it('should call factory from { factory, description } defaults', async () => {
      const factory = vi.fn().mockReturnValue('from-factory');
      mockClack.text.mockResolvedValue('override');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({
          name: 'host',
          type: 'string',
          default: { factory, description: 'computed host' },
        }),
      ]);

      expect(factory).toHaveBeenCalledOnce();
      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({
          placeholder: 'from-factory',
          defaultValue: 'from-factory',
        })
      );
    });

    it('should not pass placeholder/defaultValue when no default', async () => {
      mockClack.text.mockResolvedValue('val');
      const provider = createClackPromptProvider();

      await provider.promptBatch!([
        makeOption({ name: 'host', type: 'string' }),
      ]);

      expect(mockClack.text).toHaveBeenCalledWith(
        expect.objectContaining({
          placeholder: undefined,
          defaultValue: undefined,
        })
      );
    });
  });

  describe('cancellation handling', () => {
    it('should throw when user cancels a text prompt', async () => {
      const cancelSymbol = Symbol('cancel');
      mockClack.text.mockResolvedValue(cancelSymbol);
      mockClack.isCancel.mockReturnValue(true);
      const provider = createClackPromptProvider();

      await expect(
        provider.promptBatch!([
          makeOption({ name: 'name', type: 'string' }),
        ])
      ).rejects.toThrow('Prompt cancelled by user');

      expect(mockClack.cancel).toHaveBeenCalledWith('Operation cancelled.');
    });

    it('should throw when user cancels a number prompt (raw cancel)', async () => {
      const cancelSymbol = Symbol('cancel');
      mockClack.text.mockResolvedValue(cancelSymbol);
      mockClack.isCancel.mockReturnValue(true);
      const provider = createClackPromptProvider();

      await expect(
        provider.promptBatch!([
          makeOption({ name: 'port', type: 'number' }),
        ])
      ).rejects.toThrow('Prompt cancelled by user');
    });

    it('should throw when user cancels a confirm prompt', async () => {
      const cancelSymbol = Symbol('cancel');
      mockClack.confirm.mockResolvedValue(cancelSymbol);
      mockClack.isCancel.mockReturnValue(true);
      const provider = createClackPromptProvider();

      await expect(
        provider.promptBatch!([
          makeOption({ name: 'verbose', type: 'boolean' }),
        ])
      ).rejects.toThrow('Prompt cancelled by user');
    });
  });

  describe('batch behavior', () => {
    it('should prompt for multiple options in order', async () => {
      mockClack.text
        .mockResolvedValueOnce('Alice')
        .mockResolvedValueOnce('42');
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({ name: 'name', type: 'string' }),
        makeOption({ name: 'port', type: 'number' }),
      ]);

      expect(mockClack.text).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ name: 'Alice', port: 42 });
    });

    it('should handle mixed option types in a single batch', async () => {
      mockClack.text.mockResolvedValueOnce('hello');
      mockClack.confirm.mockResolvedValueOnce(true);
      mockClack.select.mockResolvedValueOnce('prod');
      const provider = createClackPromptProvider();

      const result = await provider.promptBatch!([
        makeOption({ name: 'name', type: 'string' }),
        makeOption({ name: 'verbose', type: 'boolean' }),
        makeOption({
          name: 'env',
          type: 'string',
          choices: ['dev', 'prod'],
        } as any),
      ]);

      expect(result).toEqual({
        name: 'hello',
        verbose: true,
        env: 'prod',
      });
    });
  });
});
