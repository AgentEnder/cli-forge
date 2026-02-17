// ---
// id: strict-mode
// title: Strict Mode
// description: |
//   This example demonstrates how to use strict mode to ensure that all arguments are recognized.
//   Strict mode throws a validation error when unmatched arguments are encountered.
// test:
//   - name: "Accepts known arguments"
//     options:
//       command: 'tsx --no-cache --tsconfig ./examples/tsconfig.json {entryPoint} --name World'
//     assertions:
//       stdout:
//         contains: 'Hello, World!'
//   - name: "Rejects unknown arguments in strict mode"
//     options:
//       command: 'tsx --no-cache --tsconfig ./examples/tsconfig.json {entryPoint} --name World --unknown arg'
//     assertions:
//       stderr:
//         matches: 'Unknown argument: --unknown.*Unknown argument: arg'
//       exitCode: 1
// ---
import cliForge from 'cli-forge';

const cli = cliForge('strict-mode-example')
  // Enable strict mode - unmatched arguments will throw validation errors
  .strict()
  .option('name', {
    type: 'string',
    description: 'The name to greet',
    default: 'World',
  })
  .command('$0', {
    builder: (args) => args,
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
