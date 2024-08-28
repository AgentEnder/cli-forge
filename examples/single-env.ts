// ---
// id: single-env
// title: Per Option Environment Configuration
// description: |
//   This example demonstrates how you set environment variables for each option.
// commands:
//  - command: '{filename} hello'
//    env:
//      ENV_OPTIONS_NAME: sir
// ---
import cli from 'cli-forge';

const myCLI = cli('env-options').command('hello', {
  builder: (args) =>
    args.option('name', {
      type: 'string',
      description: 'The name to say hello to',

      // Providing a string to `env` here allows the `name` option
      // to be read from an environment variable. The environment variable
      // key is transformed to upper snake case. e.g.
      // - `name` -> `NAME`
      // - `myOption` -> `MY_OPTION`
      // - `NAME` -> `NAME`
      //
      // If a prefix is provided via a parent `.env()` call, the prefix
      // will be applied here as well. Setting `env` to false will disable
      // environment variable reading for this option, even if `.env()` was
      // called on the parent CLI.
      env: 'NAME',

      required: true,
    }),
  handler: (args) => {
    console.log(`Hello, ${args.name}!`);
  },
});

await myCLI.forge();
