// ---
// id: env-options
// title: Environment Options
// description: |
//   This example demonstrates how you can register options that are set via environment variables. There are two levels
//   of environment variable support:
//   - Global: By calling `.env()` on the CLI instance or parser, you can enable environment variable support for all options.
//   - Local: By providing an `env` key on an option, you can enable or disable environment variable support for that option only.
//
//   In either case, there are a few common properties to be aware of:
//   - Prefix: Set via `prefix` on the object passed to .env(), or disabled by passing `false` with the `env` property on an option. Setting a prefix will automatically add the prefix to the environment variable key. When calling `.env()` on a CLI, the prefix defaults to the top-level command name.
//   - Reflect: By default if environment variable handling is enabled, environment variables are reflected to `process.env`. This can be disabled by passing `{reflect: false}` to `.env()` or setting `env` to contain `{reflect: false}` on an option.
//   - Populate: By default if environment variable handling is enabled, environment variables are used to populate options. This can be disabled by passing `{populate: false}` to `.env()` or setting `env` to contain `{populate: false}` on an option. This allows you to reflect environment variables to `process.env` without populating options from the env.
//   - Key: The key used when populating an option from env or reflecting to `process.env`. By default, the key is the option name in upper snake case. This can be overridden by setting the `env` key on an option.
//
//   Options passed on the command line will always take precedence over environment variables. Environment variables override configuration files as well as default values.
//
// commands:
//  - command: '{filename} hello'
//    env:
//      ENV_OPTIONS_NAME: sir
//      ENV_OPTIONS_GREETING: hello
// ---
import cli from 'cli-forge';

const myCLI = cli('env-options')
  .command('hello', {
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'The name to say hello to',
          required: true,
        })
        .option('greeting', {
          type: 'string',
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
          env: 'GREETING',
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
