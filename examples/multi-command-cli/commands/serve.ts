import { makeComposableBuilder } from 'cli-forge';

export interface ServerInfo {
  url: string;
  port: number;
  host: string;
}

export const withServeCommand = makeComposableBuilder((args) =>
  args.command('serve', {
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

    handler: (args): ServerInfo => {
      const url = `http://${args.host}:${args.port}`;
      console.log(`Starting server on port ${args.port}...`);
      console.log(`  Host: ${args.host}`);
      console.log(`  URL: ${url}`);

      if (args.open) {
        console.log('Opening browser...');
      }

      return {
        url,
        port: args.port,
        host: args.host,
      };
    },
  })
);
