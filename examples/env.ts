// ---
// id: env-options
// title: Environment Options
// description: |
//   This example demonstrates how you can register options that are set via environment variables
// commands:
//  - command: '{filename} hello'
//    env:
//      ENV_OPTIONS_NAME: sir
// ---
import cli from 'cli-forge';

const myCLI = cli('env-options')
  .command('hello', {
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'The name to say hello to',
        required: true,
      }),
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  })
  // Invoking .env() enables reading arguments from environment variables.
  // The env key is based on the option name. e.g. For the option 'name', and
  // the CLI name 'env-options', the environment variable would be ENV_OPTIONS_NAME.
  .env();

(async () => {
  await myCLI.forge();
})();
