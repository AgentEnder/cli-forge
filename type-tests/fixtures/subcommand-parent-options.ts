import { cli } from 'cli-forge';

// Test that subcommands can access parent options without casts
// This reproduces the interactive-subshell.ts issue

const testCli = cli('test')
  .command('auth', {
    builder: (args) =>
      args
        .option('host', { type: 'string', default: 'example.com' })
        .command('login', {
          builder: (args) => {
            return args.positional('user', { type: 'string', required: true });
          },
          handler: (args) => {
            // Should be able to access both host and user
            const host: string = args.host;
            const user: string = args.user;
          },
        })
        .command('logout', {
          handler: (args) => {
            // Should be able to access host from parent
            const host: string = args.host; // This is failing - args.host is type 'never'
          },
        }),
  });

export { testCli };
