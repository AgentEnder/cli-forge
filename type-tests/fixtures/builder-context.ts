/**
 * Tests that builder receives correct context type with parent access.
 */
import { cli } from 'cli-forge';

// Build a CLI with multiple commands to test sibling access
const app = cli('app')
  .option('verbose', { type: 'boolean' })
  .command('first', {
    builder: (p) => p.option('firstOpt', { type: 'string' }),
    handler: (args, _ctx) => {
      console.log(args.verbose, args.firstOpt);
    }
  })
  .command('second', {
    builder: (parser, ctx) => {
      // ctx.getParentCommand() should return CLI with verbose option
      const parent = ctx.getParentCommand();
      
      // Parent should have getChildCommands method
      const siblings = parent.getChildCommands();
      
      // Siblings should include 'first' but not 'second' (not yet registered)
      const firstCommand = siblings.first;
      
      return parser;
    },
    handler: (args, _ctx) => {
      console.log(args.verbose);
    }
  });

export { app };
