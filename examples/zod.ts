// ---
// id: zod-middleware
// title: Zod Middleware
// description: |
//   As another example of middleware, we can look at how to integrate [Zod](https://npmjs.com/zod). CLI Forge
//   provides a middleware function under `cli-forge/middleware/zod` that can be used to validate, parse, transform,
//   and otherwise manipulate command arguments using Zod schemas.

// commands:
//  - '{filename} hello --name sir'
// ---
import cliForge from 'cli-forge';
import { zodMiddleware } from 'cli-forge/middleware/zod';
import { z } from 'zod';

const cli = cliForge('basic-cli')
  // Requires a command to be provided
  .demandCommand()

  // Registers "hello" command
  .command('hello', {
    // Builder is used to define the command's options
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'The name to say hello to',
          default: 'World',
        })
        // Middleware registered on parent commands will be invoked before the child command's middleware
        .middleware(
          zodMiddleware(
            z
              .object({
                name: z
                  .string()
                  .min(2, 'Name must be at least 2 characters long'),
              })
              .transform((data) => ({
                name: data.name.trim().toUpperCase(),
                snakeCase: data.name.trim().replace(/\s+/g, '_').toLowerCase(),
              }))
          )
        ),

    // Handler is used to define the command's behavior
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
      console.log(`sssssnake_case: ${args.snakeCase}`);
    },
  });

// We export the CLI for a few reasons:
// - Testing
// - Composition (a CLI can be a subcommand of another CLI)
// - Docs generation
export default cli;

// Calling `.forge()` executes the CLI. It's single parameter is the CLI args
// and they default to `process.argv.slice(2)`.
if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
