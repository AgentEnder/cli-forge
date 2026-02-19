// ---
// id: sdk
// title: Generated SDK
// description: |
//   This example demonstrates the basic usage of cli-forge to create a simple CLI
//   with two commands and various options, and how that CLI can be used programmatically.
// test:
//   - name: "Runs hello command via CLI"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json sdk.ts hello --name sir'
//     assertions:
//       stdout:
//         contains: 'Hello, sir!'
//   - name: "Runs goodbye command via CLI"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json sdk.ts goodbye --name madame'
//     assertions:
//       stdout:
//         contains: 'Goodbye, madame.'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('basic-cli')
  .demandCommand()
  .command('hello', {
    builder: (args) =>
      args.option('name', {
        type: 'string',
        description: 'The name to say hello to',
        default: 'World',
      }),
    handler: (args) => {
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
      console.log(`Goodbye, ${args.name}${args.excited ? '!' : '.'}`);
    },
  })
  .command('nested', {
    builder: (args) =>
      args.command('config', {
        builder: (args) =>
          args.option('set', {
            type: 'object',
            properties: {
              key: { type: 'string', required: true },
              value: { type: 'string', required: true },
            },
          }),
        handler: (args) => {
          console.log(`Setting config ${args.set?.key} to ${args.set?.value}`);
        },
      }),
    handler: (_args) => {
      console.log('Use a subcommand of nested');
    },
  });

const sdk = cli.sdk();

sdk.hello({
  name: 'sir',
});

sdk.nested.config({
  set: {
    key: 'theme',
    value: 'dark',
  },
});

// Calling `.forge()` executes the CLI. It's single parameter is the CLI args
// and they default to `process.argv.slice(2)`.
if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
