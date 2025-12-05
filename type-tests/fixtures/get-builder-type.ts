/**
 * Tests that getBuilder() returns the correct function type.
 */
import { cli, CLI } from 'cli-forge';

const myCommand = cli('test')
  .option('verbose', { type: 'boolean' })
  .command('sub', {
    builder: (p) => p.option('count', { type: 'number' }),
    handler: (args, _ctx) => {
      console.log(args.verbose, args.count);
    }
  });

// Test that getBuilder returns a function or undefined
const builderFn = myCommand.getBuilder();
if (builderFn) {
  // Builder should take a CLI and return a CLI
  const result = builderFn(cli('temp'));
  // Result should be a CLI instance
  const checkResult = result.forge;
}

export { myCommand };
