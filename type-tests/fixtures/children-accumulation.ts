/**
 * Tests that TChildren accumulates as commands are added.
 */
import { cli } from 'cli-forge';

// Test that TChildren accumulates with each command registration
const step1 = cli('app');
// Type: CLI<ParsedArgs, {}>

const step2 = step1.command('first', {
  builder: (p) => p.option('a', { type: 'string' }),
  handler: (args, _ctx) => {
    const val: string | undefined = args.a;
    console.log(val);
  }
});
// Type: CLI<ParsedArgs, { first: { a?: string } }>

const step3 = step2.command('second', {
  builder: (p) => p.option('b', { type: 'number' }),
  handler: (args, _ctx) => {
    const val: number | undefined = args.b;
    console.log(val);
  }
});
// Type: CLI<ParsedArgs, { first: { a?: string }; second: { b?: number } }>

// Verify the accumulated type via getChildCommands
const children = step3.getChildCommands();

// Access children - should be properly typed
const firstCmd = children.first;
const secondCmd = children.second;

// Commands should have correct argument types
if (firstCmd) {
  const handler = firstCmd.getHandler();
  if (handler) {
    handler({ a: 'test', unmatched: [], '--': [] });
  }
}

if (secondCmd) {
  const handler = secondCmd.getHandler();
  if (handler) {
    handler({ b: 42, unmatched: [], '--': [] });
  }
}

export { step1, step2, step3, children };
