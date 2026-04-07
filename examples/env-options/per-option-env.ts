import cli from 'cli-forge';

// Without calling .env(), environment variable support is opt-in per option.
// Only options with an explicit `env` key can be populated from the environment —
// every other option can only be set via command-line flags.
const app = cli('greet-app').command('hello', {
  builder: (args) =>
    args
      .option('name', {
        type: 'string',
        required: true,
        description: 'Name to greet',
        // Reads from the GREET_NAME environment variable.
        // The key you provide here is used as-is (no prefix is applied).
        // camelCase, dashed-case, and UPPER_SNAKE_CASE are all accepted.
        env: 'GREET_NAME',
      })
      .option('greeting', {
        type: 'string',
        default: 'Hello',
        description: 'Greeting word to use',
        env: 'GREET_GREETING',
      })
      .option('verbose', {
        type: 'boolean',
        default: false,
        description: 'Print extra details',
        // No `env` key — this option cannot be set from the environment.
        // It can only be passed as --verbose on the command line.
      }),
  handler: (args) => {
    if (args.verbose) {
      console.log('Verbose mode enabled');
    }
    console.log(`${args.greeting}, ${args.name}!`);
  },
});

export default app;

if (require.main === module) {
  app.forge();
}
