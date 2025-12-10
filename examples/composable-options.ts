// ---
// id: composable-options
// title: Composable Options
// description: |
//   Extract common options into reusable functions and compose them across
//   multiple commands. Shows two approaches: manual generics and the
//   `makeComposableBuilder` helper.
//
//   Also demonstrates accessing child commands programmatically via
//   `getChildren()` and invoking their handlers with full type inference.
//
// commands:
//   - '{filename} greet --name sir --greeting "Good day"'
//   - '{filename} farewell --name madame --farewell "Goodbye"'
//   - '{filename} converse --name sir'
// ---
import { UnknownCLI, chain, cli, makeComposableBuilder } from 'cli-forge';

// -- Reusable option definitions --

// Manual generic approach
function withName<T extends UnknownCLI>(argv: T) {
  return argv.option('name', {
    type: 'string',
    description: 'Your name',
    required: true,
  });
}

// Using the helper (types inferred)
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

// -- Commands with return values --

const withGreetCommand = makeComposableBuilder((args) =>
  args.command('greet', {
    builder: (args) => chain(args, withName, withGreeting),
    handler: (args): string => {
      const message = `${args.greeting}, ${args.name}!`;
      console.log(message);
      return message;
    },
  })
);

const withFarewellCommand = makeComposableBuilder((args) =>
  args.command('farewell', {
    builder: (args) => chain(args, withName, withFarewell),
    handler: (args): string => {
      const message = `${args.farewell}, ${args.name}!`;
      console.log(message);
      return message;
    },
  })
);

const withConverseCommand = makeComposableBuilder((args) =>
  args.command('converse', {
    description: 'A quick chat',
    builder: (args) => chain(args, withName),
    handler: (args) => {
      console.log(`[${args.name}]: hello!`);
    },
  })
);

// -- Parent command accessing children --

cli('composable-options', {
  builder: (args) =>
    chain(args, withGreetCommand, withFarewellCommand, withConverseCommand),

  handler: async (_args, ctx) => {
    const children = ctx.command.getChildren();

    // Handlers are typed - greetHandler returns string
    const greetHandler = children.greet.getHandler();
    if (greetHandler) {
      const result = greetHandler({ name: 'Alice', greeting: 'Hi' });
      console.log('Greeting ends with !:', result.endsWith('!'));
    }

    console.log('Available commands:', Object.keys(children).join(', '));
  },
}).forge();
