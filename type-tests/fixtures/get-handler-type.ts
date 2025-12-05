/**
 * Tests that getHandler() returns correctly typed handler functions.
 */
import { cli } from 'cli-forge';

const myCommand = cli('test')
  .option('name', { type: 'string', required: true })
  .command('greet', {
    builder: (p) => p.option('greeting', { type: 'string', default: 'Hello' }),
    handler: (args, _ctx) => {
      console.log(`${args.greeting}, ${args.name}!`);
    }
  });

// Get child command
const children = myCommand.getChildCommands();
const greetCommand = children.greet;

// Get handler
const handler = greetCommand.getHandler();

if (handler) {
  // Handler should only require args (context is baked in)
  // The args should have the correct type
  handler({ name: 'World', greeting: 'Hi', unmatched: [], '--': [] });
}

export { myCommand };
