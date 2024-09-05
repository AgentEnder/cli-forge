// ---
// id: composable-options
// title: Composable Options
// description: |
//   This example demonstrates how to extract common options into a reusable function, to share
//   across multiple commands.
//
//   The main idea is to create a function that takes an initial CLI and performs some operations on it to be used in a command's builder function. If you extract multiple of these, you can use `chain` to compose them together. There is also a helper called `makeComposableBuilder` that can be used to create these composable builders, without having to worry about getting the type annotations correct.
//
//   If you are only useing @cli-forge/parser, `chain` is still available to use and a different helper, `makeComposableOption` is available to create composable options. These would be used like below:
//   ```typescript
//   const withName = makeComposableOption('name', {
//     type: 'string',
//   });
//   const initialParser = new ArgvParser();
//   const parser = chain(initialParser, withName, /* ... */);
//   ```
//
//   Note: This example goes really far with the composable options, and is likely overkill for most CLI commands. In general, I'd only recommend extracting options into a composable builder if they are shared across multiple commands. If the options are only used in a single command, it's probably best to keep them in the command builder directly.
//
// commands:
//   - '{filename} greet --name sir --greeting "Good day"'
//   - '{filename} farewell --name madame --farewell "Goodbye"'
//   - '{filename} converse --name sir'
// ---
import { CLI, chain, cli, makeComposableBuilder } from 'cli-forge';

// The generic type parameter `T` allows typescript to carry the types
// of the options through the chain of composable options.
// If we have a command that uses multiple composable options, the type
// of argv in the handler will correctly reflect the options that were
// supplied both directly and through the composable options.
function withName<T extends CLI>(argv: T) {
  return argv.option('name', {
    type: 'string',
    description: 'Your name',
    required: true,
  });
}

// For convenience, cli-forge provides a helper function to create composable
// builders. This function takes a function that takes an initial CLI instance
// and returns a new CLI instance with additional options, commands etc.
// This can then be used with the `chain` function to compose multiple builders.
const withGreeting = makeComposableBuilder((args) =>
  args.option('greeting', {
    type: 'string',
    description: 'The greeting to use',
    default: 'Hello',
  })
);

const withFarewell = makeComposableBuilder((args) =>
  args.option('farewell', {
    type: 'string',
    description: 'The farewell to use',
    default: 'Goodbye',
  })
);

const subcommand = cli('converse', {
  description: 'A quick chat',
  builder: (args) => chain(args, withName),
  handler: (args) => {
    console.log(`[${args.name}]: hello!`);
  },
});

const withSubcommand = makeComposableBuilder((args) =>
  args.commands(subcommand)
);

const withGreetCommand = makeComposableBuilder((args) =>
  args.command('greet', {
    builder: (args) => chain(args, withName, withGreeting),
    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
    },
  })
);

const withFarewellCommand = makeComposableBuilder((args) =>
  args.command('farewell', {
    builder: (args) => chain(args, withName, withFarewell),
    handler: (args) => {
      console.log(`${args.farewell}, ${args.name}!`);
    },
  })
);

cli('composable-options', {
  builder: (args) =>
    chain(args, withGreetCommand, withFarewellCommand, withSubcommand),
}).forge();
