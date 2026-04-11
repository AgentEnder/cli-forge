import { cli } from 'cli-forge';
import { runDeploy } from './deploy';

export const app = cli('deploy-tool')
  .option('logLevel', {
    type: 'string',
    default: 'info',
    description: 'Logging level',
  })
  .option('apiUrl', {
    type: 'string',
    required: true,
    description: 'API base URL',
  })
  // Register a logger provider whose factory receives the parsed args.
  // Any command handler can inject it without threading it through calls.
  .provide('logger', {
    factory: (args) => ({
      info: (msg: string) => console.log(`[${args.logLevel}] ${msg}`),
    }),
  })
  .command('deploy', {
    description: 'Deploy to a target environment',
    builder: (cmd) =>
      cmd.option('target', {
        type: 'string',
        required: true,
        description: 'Deployment target',
      }),
    handler: async () => {
      await runDeploy();
    },
  });

if (require.main === module) {
  app.forge();
}
