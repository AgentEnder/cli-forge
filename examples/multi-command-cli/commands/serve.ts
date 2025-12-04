import type { CLI } from 'cli-forge';

/**
 * Register the serve command.
 */
export function registerServeCommand<T extends CLI>(cli: T) {
  return cli.command('serve', {
    description: 'Start development server',
    builder: (cmd) =>
      cmd
        .option('port', {
          type: 'number',
          alias: ['p'],
          description: 'Port to listen on',
          default: 3000,
        })
        .option('host', {
          type: 'string',
          description: 'Host to bind to',
          default: 'localhost',
        })
        .option('open', {
          type: 'boolean',
          description: 'Open browser automatically',
          default: false,
        }),

    handler: (args) => {
      console.log(`Starting server on port ${args.port}...`);
      console.log(`  Host: ${args.host}`);

      if (args.open) {
        console.log('Opening browser...');
      }
    },
  });
}
