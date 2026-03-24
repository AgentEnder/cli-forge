// ---
// id: shell-completion
// title: Shell Completion
// description: |
//   This example demonstrates how to enable shell completion for your CLI.
//   The `.completion()` method registers a `completion` subcommand and a hidden
//   `--get-completions` flag that shells use to request dynamic suggestions.
//
//   You can customize completions at the command level or per-option.
//   The `completionHelpers.files()` helper suggests filesystem paths.
// test:
//   - name: "get-completions returns subcommands and flags"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json shell-completion.ts --get-completions'
//     assertions:
//       stdout:
//         contains: 'deploy'
// ---
import cliForge, { completionHelpers } from 'cli-forge';

const app = cliForge('my-app')
  .completion()
  .option('verbose', { type: 'boolean', alias: ['v'] })
  .command('deploy', {
    description: 'Deploy the application',
    builder: (args) =>
      args
        .option('env', {
          type: 'string',
          choices: ['production', 'staging', 'development'] as const,
          description: 'Target environment',
        })
        .option('config', {
          type: 'string',
          description: 'Path to config file',
          completion: completionHelpers.files('*.json'),
        }),
    handler: (args) => {
      console.log(`Deploying to ${args.env} with config ${args.config}`);
    },
  })
  .command('status', {
    description: 'Show service status',
    builder: (args) => args,
    handler: () => {
      console.log('All services running');
    },
  });

export default app;

if (require.main === module) {
  (async () => {
    await app.forge();
  })();
}
