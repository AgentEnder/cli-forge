// ---
// id: composable-options
// title: Composable Options
// description: |
//   This example demonstrates how to extract common options into a reusable function, to share
//   across multiple commands.
// commands:
//   - '{filename} greet --name sir --greeting "Good day"'
//   - '{filename} farewell --name madame --farewell "Goodbye"'
// ---
import { cli, CLI } from 'cli-forge';

// The generic type parameter `T` allows typescript to carry the types
// of the options through the chain of composable options.
// If we have a command that uses multiple composable options, the type
// of argv in the handler will correctly reflect the options that were
// supplied both directly and through the composable options.
function withName<T extends CLI>(argv: T) {
  return argv.option('name', {
    type: 'string',
    description: 'The name to say hello to',
    default: 'World',
  });
}

cli('composable-options')
  .command('greet', {
    builder: (args) =>
      withName(args).option('greeting', {
        type: 'string',
        description: 'The greeting to use',
        default: 'Hello',
      }),
    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
    },
  })
  .command('farewell', {
    builder: (args) =>
      withName(args).option('farewell', {
        type: 'string',
        description: 'The farewell to use',
        default: 'Goodbye',
      }),
    handler: (args) => {
      console.log(`${args.farewell}, ${args.name}!`);
    },
  })
  .forge();
