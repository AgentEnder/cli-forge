import { describe, it, expect } from 'vitest';
import { generateDocumentationCommand } from './generate-documentation';
import { TestHarness } from '../../lib/test-harness';

describe('generateDocumentationCommand', () => {
  it('should not generate llms.txt when --no-llms is provided', async () => {
    const test = new TestHarness(generateDocumentationCommand);
    const { args } = await test.parse(['./some-cli', '--no-llms']);
    expect(args.llms).toBe(false);
  });

  it('should generate llms.txt by default', async () => {
    const test = new TestHarness(generateDocumentationCommand);
    const { args } = await test.parse(['./some-cli']);
    expect(args.llms).toBe(true);
  });
});
