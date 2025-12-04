import { chain, makeComposableBuilder } from 'cli-forge';

import { withVerbose, withConfig } from '../builders/common';

/**
 * The serve command reuses the same verbose option as build.
 * This ensures consistent behavior across commands.
 */
export const serveCommand = makeComposableBuilder((args) =>
  args.command('serve', {
    description: 'Start development server',
    builder: (cmd) =>
      chain(cmd, withVerbose, withConfig).option('port', {
        type: 'number',
        alias: ['p'],
        description: 'Port to listen on',
        default: 3000,
      }),

    handler: (args) => {
      if (args.verbose) {
        console.log('Server configuration:');
        console.log(`  verbose: ${args.verbose}`);
        console.log(`  config: ${args.config ?? 'default'}`);
        console.log(`  port: ${args.port}`);
      }

      console.log(`Starting server on port ${args.port}...`);
    },
  })
);
