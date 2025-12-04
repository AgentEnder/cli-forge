/**
 * Tests that global .env() configuration doesn't affect types.
 */
import { cli } from 'cli-forge';

const app = cli('test')
  // Global env prefix
  .env('MY_APP')
  .option('port', {
    type: 'number',
    default: 3000,
  })
  .option('host', {
    type: 'string',
    default: 'localhost',
  })
  .option('debug', {
    type: 'boolean',
    default: false,
  })
  .command('start', {
    handler: (args) => {
      // Types should be preserved even with env() call
      const port: number = args.port;
      const host: string = args.host;
      const debug: boolean = args.debug;

      console.log(port, host, debug);
    },
  });

export { app };
