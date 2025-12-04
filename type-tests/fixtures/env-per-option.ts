/**
 * Tests that per-option env configuration preserves types.
 */
import { cli } from 'cli-forge';

const app = cli('test')
  .option('apiKey', {
    type: 'string',
    env: 'API_KEY',
    required: true,
  })
  .option('timeout', {
    type: 'number',
    env: 'REQUEST_TIMEOUT',
    default: 30000,
  })
  .option('verbose', {
    type: 'boolean',
    env: 'VERBOSE_MODE',
  })
  .command('request', {
    handler: (args) => {
      // Types should be correct regardless of env configuration
      const apiKey: string = args.apiKey;
      const timeout: number = args.timeout;
      const verbose: boolean | undefined = args.verbose;

      console.log(apiKey, timeout, verbose);
    },
  });

export { app };
