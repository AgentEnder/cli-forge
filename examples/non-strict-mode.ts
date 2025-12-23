// ---
// id: non-strict-mode
// title: Non-Strict Mode (Default)
// description: |
//   This example demonstrates the default behavior without strict mode.
//   Unmatched arguments are collected in the `unmatched` array and don't cause errors.
// commands:
//   - command: '{filename} --name World'
//     assertions:
//       - contains: 'Hello, World!'
//       - contains: 'Unmatched: []'
//   - command: '{filename} --name World --unknown arg extra'
//     assertions:
//       - contains: 'Hello, World!'
//       - contains: "Unmatched: [ '--unknown', 'arg', 'extra' ]"
// ---
import cliForge from 'cli-forge';

const cli = cliForge('non-strict-mode-example')
  // Strict mode is disabled by default
  .option('name', {
    type: 'string',
    description: 'The name to greet',
    default: 'World',
  })
  .command('$0', {
    builder: (args) => args,
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
      console.log('Unmatched:', args.unmatched);
    },
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
