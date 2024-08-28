// ---
// id: test-harness
// title: Using the Test Harness
// description: |
//   This is a simple example that demonstrates how to create a basic CLI using cli-forge
// commands:
//  - '--test {filename}'
// ---
import { describe, it } from 'node:test';
import * as assert from 'node:assert';

// We can reuse the CLI from the basic-cli example
import cli from './basic-cli';
import { TestHarness } from 'cli-forge';

describe('Basic CLI', () => {
  it('should parse the hello command', async () => {
    // The TestHarness is used to simulate CLI invocations, without actually running the commands.
    // If you want to test how the CLI is parsing arguments, you can use the TestHarness.
    // If you actually want to test the CLI handlers, you should extract the handler logic
    // to a separate function and test that function directly.
    const harness = new TestHarness(cli);

    // The parse method returns the parsed arguments and the command chain that was resolved.
    // The command chain contains each command that was resolved during parsing. If its empty,
    // then the root command was resolved. If it contains ['hello'], then the hello command was resolved.
    const { args, commandChain } = await harness.parse([
      'hello',
      '--name',
      'sir',
    ]);

    assert.deepStrictEqual(commandChain, ['hello']);
    assert.deepStrictEqual(args, { name: 'sir', unmatched: [] });
  });
});
