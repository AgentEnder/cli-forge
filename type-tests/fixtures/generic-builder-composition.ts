/**
 * Tests generic CLI extension pattern used in composable builders.
 */
import { CLI, cli, chain, makeComposableBuilder } from 'cli-forge';

// Generic function that extends any CLI
function withVerbose<T extends CLI>(argv: T) {
  return argv.option('verbose', {
    type: 'boolean',
    alias: ['v'],
    default: false,
  });
}

// Using makeComposableBuilder helper
const withOutput = makeComposableBuilder((args) =>
  args.option('output', {
    type: 'string',
    alias: ['o'],
    description: 'Output path',
  })
);

// Compose multiple builders
const app = cli('test', {
  builder: (args) => chain(args, withVerbose, withOutput),
});

// Handler should have all composed options
app.command('run', {
  handler: (args) => {
    const verbose: boolean = args.verbose;
    const output: string | undefined = args.output;
    console.log(verbose, output);
  },
});

export { app, withVerbose, withOutput };
