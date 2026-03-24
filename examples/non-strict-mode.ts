// ---
// id: non-strict-mode
// title: Non-Strict Mode (Default)
// description: |
//   This example demonstrates the default behavior without strict mode.
//   Unmatched arguments are collected in the `unmatched` array and don't cause errors.
// test:
//   - name: "Accepts known arguments"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json non-strict-mode.ts --name World'
//     assertions:
//       stdout:
//         matches: 'Hello, World!.*Unmatched: \[\]'
//   - name: "Collects unknown arguments in unmatched array"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json non-strict-mode.ts --name World --unknown arg extra'
//     assertions:
//       stdout:
//         matches: 'Hello, World!.*--unknown.*arg.*extra'
// ---
import cliForge from 'cli-forge';

// #region cli
const cli = cliForge('non-strict-mode-example')
  // Strict mode is disabled by default
  .strict(false)
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
// #endregion cli

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
