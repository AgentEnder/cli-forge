---
title: Testing
description: Test your CLI with the TestHarness, unit tests, and end-to-end strategies
nav:
  order: 7
---

# Testing

CLI Forge provides a `TestHarness` class that lets you test argument parsing and command resolution without executing handlers. Combined with standard Node.js testing tools, you can build a comprehensive test suite for your CLI.

## The test harness

Import `TestHarness` alongside your CLI instance and a test runner:

<%= example('test-harness').region('imports') %>

Then use `.parse()` to simulate an invocation without running the handler:

<%= example('test-harness').region('test') %>

### What the harness returns

The `.parse()` method returns an object with:

- **`args`** — the fully parsed arguments, including defaults and coerced values
- **`commandChain`** — an array of command names that were resolved. An empty array means the root command was matched; `['hello']` means the `hello` subcommand was resolved.

You can verify both _what_ was parsed and _which command_ would run — without side effects.

### When to use the harness vs. testing handlers directly

| Test goal | Approach |
|---|---|
| Verify argument parsing and defaults | Use `TestHarness` |
| Verify command resolution and routing | Use `TestHarness` |
| Test handler business logic | Extract handler logic to a function, test it directly |
| Test the full CLI end-to-end | Run the CLI as a subprocess |

The harness is intentionally focused on parsing. Handler logic is best tested by extracting it into plain functions that can be unit tested independently.

## Unit testing parsed arguments

Use the harness to verify that options are parsed correctly, defaults are applied, and validation works:

```typescript
import { TestHarness } from 'cli-forge';
import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import myCli from './my-cli';

describe('argument parsing', () => {
  const harness = new TestHarness(myCli);

  it('applies default values', async () => {
    const { args } = await harness.parse(['serve']);
    assert.strictEqual(args.port, 3000);
  });

  it('overrides defaults with CLI args', async () => {
    const { args } = await harness.parse(['serve', '--port', '8080']);
    assert.strictEqual(args.port, 8080);
  });

  it('resolves nested subcommands', async () => {
    const { commandChain } = await harness.parse(['db', 'migrate']);
    assert.deepStrictEqual(commandChain, ['db', 'migrate']);
  });
});
```

## Testing handler logic

Rather than testing handlers through the CLI, extract the business logic into standalone functions:

```typescript
// handler logic in a separate module
export function greet(name: string, shout: boolean): string {
  const message = `Hello, ${name}!`;
  return shout ? message.toUpperCase() : message;
}

// CLI definition
cli('my-app').command('greet', {
  builder: (cmd) =>
    cmd
      .option('name', { type: 'string', required: true })
      .option('shout', { type: 'boolean', default: false }),
  handler: (args) => {
    console.log(greet(args.name, args.shout));
  },
});
```

```typescript
// test the function directly
it('greets with name', () => {
  assert.strictEqual(greet('World', false), 'Hello, World!');
});

it('shouts when requested', () => {
  assert.strictEqual(greet('World', true), 'HELLO, WORLD!');
});
```

This pattern gives you fast, focused tests without process overhead.

## End-to-end testing

For integration confidence, run your CLI as a subprocess and assert on its output. CLI Forge's own examples use this approach via the `functional-examples` test runner:

```bash
npx functional-examples test
```

You can also write e2e tests manually with `child_process`:

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

it('prints help when no command is given', async () => {
  const { stdout } = await exec('npx', ['tsx', './bin/my-cli.ts', '--help']);
  assert.ok(stdout.includes('Usage:'));
});
```

## Testing strategy summary

A well-tested CLI typically has three layers:

1. **Harness tests** — fast, focused tests for parsing, defaults, and command routing using `TestHarness`
2. **Unit tests** — test handler business logic as plain functions, independent of the CLI framework
3. **E2E tests** — subprocess tests that verify the full invocation including output format and exit codes

Start with harness and unit tests for fast feedback, then add e2e tests for critical user-facing flows.
