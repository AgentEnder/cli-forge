// ---
// id: basic-cli
// title: Basic CLI
// description: |
//   This is a simple example that demonstrates how to create a basic CLI using cli-forge
// commands:
//  - '{filename} hello --name sir'
//  - '{filename} goodbye --name madame'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('basic-cli')
  // Requires a command to be provided
  .demandCommand()

  // Registers "hello" command
  .command('hello', {
    // Builder is used to define the command's options
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'The name to say hello to',
        default: 'World',
      }),
    // Handler is used to define the command's behavior
    handler: (args) => {
      // Note: name is always defined because it has a default value.
      console.log(`Hello, ${args.name}!`);
    },
  })
  .command('goodbye', {
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'The name to say goodbye to',
          default: 'World',
        })
        .option('excited', {
          type: 'boolean',
          description: 'Whether to say goodbye excitedly',
        }),
    handler: (args) => {
      // Note the typing of `args` here. It's inferred from the builder.
      // The `name` option is always defined because it has a default value.
      // The `excited` option is optional because it doesn't have a default value.
      console.log(`Goodbye, ${args.name}${args.excited ? '!' : '.'}`);
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
