// ---
// id: limit-choices
// title: Option Choices
// description: |
//   This is a simple example that demonstrates how to limit choices for a given option
// commands:
//  - '{filename} hello --name sir'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('basic-cli')
  .demandCommand()
  .command('hello', {
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'The name to say hello to',
        required: true,

        // Choices limits valid values for the option.
        // If the provided value is not in the choices array, an error will be thrown.
        choices: ['sir', 'madame'],
      }),
    // Handler is used to define the command's behavior
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
