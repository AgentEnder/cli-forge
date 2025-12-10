// ---
// id: composable-options
// title: Composable Options
// description: |
//   This example demonstrates how to extract common options into reusable functions
//   and compose them across multiple commands. It also shows how to access child
//   commands with full type safety, including their handlers and return types.
//
//   Key concepts demonstrated:
//   - `makeComposableBuilder` for creating reusable option/command builders
//   - `chain` for composing multiple builders together
//   - Typed handler return values that flow through `getHandler()`
//   - Accessing child commands via `getChildren()` with full type inference
//
// commands:
//   - '{filename} greet --name sir --greeting "Good day"'
//   - '{filename} farewell --name madame --farewell "Goodbye"'
//   - '{filename} converse --name sir'
// ---
import { UnknownCLI, chain, cli, makeComposableBuilder } from 'cli-forge';

// =============================================================================
// Composable Options - Reusable option definitions
// =============================================================================

// Manual generic approach - gives you full control over type parameters
function withName<T extends UnknownCLI>(argv: T) {
  return argv.option('name', {
    type: 'string',
    description: 'Your name',
    required: true,
  });
}

// Helper-based approach - simpler syntax, types are inferred automatically
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

// =============================================================================
// Commands with Typed Return Values
// =============================================================================

// Commands can return values from their handlers. These return types are
// tracked and accessible via getHandler().

const withGreetCommand = makeComposableBuilder((args) =>
  args.command('greet', {
    builder: (args) => chain(args, withName, withGreeting),
    // Handler returns a string - this type is tracked!
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
    // Handler returns a string
    handler: (args): string => {
      const message = `${args.farewell}, ${args.name}!`;
      console.log(message);
      return message;
    },
  })
);

// A simpler command without return value (returns void)
const withConverseCommand = makeComposableBuilder((args) =>
  args.command('converse', {
    description: 'A quick chat',
    builder: (args) => chain(args, withName),
    handler: (args) => {
      console.log(`[${args.name}]: hello!`);
    },
  })
);

// =============================================================================
// Parent Command - Demonstrating Child Access
// =============================================================================

cli('composable-options', {
  // Compose all commands together using chain
  builder: (args) =>
    chain(args, withGreetCommand, withFarewellCommand, withConverseCommand),

  // The handler receives fully typed access to children
  handler: async (args, ctx) => {
    // getChildren() returns an object with all registered child commands
    const children = ctx.command.getChildren();

    // Each child is a fully typed CLI instance
    // You can access their handlers, builders, and metadata
    const greetHandler = children.greet.getHandler();
    const farewellHandler = children.farewell.getHandler();
    const converseHandler = children.converse.getHandler();

    // The handler types are preserved - greetHandler returns string | Promise<string>
    // This enables programmatic command invocation with type safety
    if (greetHandler) {
      const greetResult = greetHandler({ name: 'Alice', greeting: 'Hi' });

      // TypeScript knows greetHandler takes { name: string, greeting: string, ... }
      // and returns string
      const endsWithExclamation = greetResult.endsWith('!');
    }

    console.log('Available commands:', Object.keys(children).join(', '));
  },
}).forge();
