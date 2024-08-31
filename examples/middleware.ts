// ---
// id: middleware
// title: Middleware
// description: |
//   This is a simple example that demonstrates how to register middleware that run before the command handler.
//   Middleware can do **a lot** of things.  Almost everything that middleware can do could be done at the beginning
//   of the handler function, but middleware keeps the handler clean and focused on the command's behavior as well
//   as being much more composable.
//
//   Some things middleware can do:
//   - Modify the arguments object
//   - Perform validation that takes multiple arguments into account
//   - Perform side effects
// commands:
//  - '{filename} hello --name sir'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('basic-cli')
  // Requires a command to be provided
  .demandCommand()

  // Middleware registered on parent commands will be invoked before the child command's middleware
  .middleware(() => {
    console.log('ABOUT TO RUN A COMMAND');
  })

  // Registers "hello" command
  .command('hello', {
    // Builder is used to define the command's options
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'The name to say hello to',
          default: 'World',
        })
        // Middleware can mutate the args object
        .middleware((args) => {
          args.name = args.name.toUpperCase();
        })
        // Multiple middleware can be registered
        .middleware(() => {
          console.log('HELLO MIDDLEWARE');
        }),
    // Handler is used to define the command's behavior
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  });

// We export the CLI for a few reasons:
// - Testing
// - Composition (a CLI can be a subcommand of another CLI)
// - Docs generation
export default cli;

// Calling `.forge()` executes the CLI. It's single parameter is the CLI args
// and they default to `process.argv.slice(2)`.
if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
