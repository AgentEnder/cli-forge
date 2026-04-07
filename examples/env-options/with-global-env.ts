import cli from 'cli-forge';

// Calling .env() enables environment variable support for every option at once.
// The CLI name is converted to UPPER_SNAKE_CASE and used as a prefix, so the
// CLI named "greet-app" produces the prefix "GREET_APP_".
//
// For example:
//   --name     reads from GREET_APP_NAME
//   --greeting reads from GREET_APP_GREETING
const app = cli('greet-app')
  .env()
  .command('hello', {
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          required: true,
          description: 'Name to greet',
        })
        .option('greeting', {
          type: 'string',
          default: 'Hello',
          description: 'Greeting word to use',
        }),
    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
    },
  });

export default app;

if (require.main === module) {
  app.forge();
}
