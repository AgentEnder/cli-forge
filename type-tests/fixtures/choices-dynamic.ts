/**
 * Tests that dynamic choice functions work correctly.
 */
import { cli } from 'cli-forge';

// Dynamic choices from function
function getEnvironments(): readonly string[] {
  return ['development', 'staging', 'production'];
}

const app = cli('test')
  .option('env', {
    type: 'string',
    choices: getEnvironments,
    required: true,
  })
  // Inline choices array
  .option('region', {
    type: 'string',
    choices: ['us-east', 'us-west', 'eu-west'] as const,
  })
  .command('deploy', {
    handler: (args) => {
      // Dynamic choices result in string type (not narrowed)
      const env: string = args.env;

      // Static inline choices should narrow
      const region: 'us-east' | 'us-west' | 'eu-west' | undefined = args.region;

      console.log(env, region);
    },
  });

export { app };
