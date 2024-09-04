// ---
// id: limit-choices
// title: Option Choices
// description: |
//   This is a simple example that demonstrates how to limit choices for a given option.
//
//   Choices are checked after `coerce` if it is also provided, so be sure that the `coerce` function returns a value that is in the choices array.
//
//   Choices can be provided as an array of valid values or as a function that returns an array of valid values. Note that when returning the array from a function, providing "as const" is necessary to narrow the typing of the argument. This may not be possible if the choices are dynamic or need to be calculated at runtime, in which case the typing will remain as a broader type (e.g. `string` instead of `'a' | 'b'`).
// commands:
//  - '{filename} hello --name sir'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('basic-cli')
  .demandCommand()
  .command('hello', {
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'The name to say hello to',
          required: true,

          // Choices limits valid values for the option.
          // If the provided value is not in the choices array, an error will be thrown.
          choices: ['sir', 'madame'],
        })
        .option('phrase', {
          type: 'string',
          default: 'hello',

          // Choices can also be provided as a function that returns an array of valid values.
          // This can be useful if the choices are dynamic or need to be calculated at runtime.
          choices: () => ['hello', 'hi', 'hey'],
        }),
    // Handler is used to define the command's behavior
    handler: (args) => {
      // Note: args.name is typed as 'sir' | 'madame' due to the choices array
      console.log(`${args.phrase}, ${args.name}!`);
    },
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
