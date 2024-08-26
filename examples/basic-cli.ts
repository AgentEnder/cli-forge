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
      console.log(`Hello, ${args.name}!`);
    },
  })
  .command('goodbye', {
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'The name to say goodbye to',
        default: 'World',
      }),
    handler: (args) => {
      console.log(`Goodbye, ${args.name}!`);
    },
  });

export default cli;

// Calling `.forge()` executes the CLI. It's single parameter is the CLI args
// and they default to `process.argv.slice(2)`.
if (require.main === this) {
  (async () => {
    await cli.forge();
  })();
}
