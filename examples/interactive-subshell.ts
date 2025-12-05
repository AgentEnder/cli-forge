// ---
// id: interactive-subshell
// title: Interactive Subshell
// description: |
//  This example demonstrates how to create an interactive subshell using cli-forge. The subshell is a simple REPL that can execute commands or shell commands. To launch the subshell, run the script with no arguments, or a command that contains subcommands and no handler.
//  The subshell presents a prompt that includes the current command chain, and executes the command when the user presses enter. If the command is not recognized, it is executed as a shell command. Notably, the subshell is very basic. It does not currently support command history, tab completion, or other advanced features.
// ---
import cliForge from 'cli-forge';

const state = {
  defaultHost: 'example.com',
  auth: {} as Record<string, { user: string; pass?: string }>,
};

const cli = cliForge('interactive-subshell')
  // Enables launching an interactive subshell.
  // For this example, the subshell would be launched if the user
  // runs either:
  // - `node ./interactive-subshell.ts`
  // - `node ./interactive-subshell.ts foo`
  .enableInteractiveShell()
  .command('auth', {
    builder: (args) =>
      args
        .option('host', { type: 'string', default: state.defaultHost })
        .command('login', {
          builder: (args) => {
            return args
              .positional('user', { type: 'string', required: true })
              .option('pass', { type: 'string' });
          },
          handler: (args) => {
            state.auth ??= {};
            state.auth[args.host] = {
              user: args.user,
              pass: args.pass,
            };
            console.log('Logged in to', args.host, 'as', args.user);
          },
        })
        .command('logout', {
          handler: (args) => {
            delete state.auth[args.host];
            console.log('Logged out of', args.host);
          },
        }),
  })
  .command('lorem', {
    handler: (args) => {
      console.log('lorem ipsum');
    },
  });

// We export the CLI for a few reasons:
// - Testing
// - Composition (a CLI can be a subcommand of another CLI)
// - Docs generation
export default cli;
