import { cli } from 'cli-forge';
import { zodMiddleware } from 'cli-forge/middleware/zod';

import { deployConfigSchema, environments } from './schemas/config';
import { userSchema, roles } from './schemas/user';

const app = cli('validated-cli')
  .demandCommand()

  .command('deploy', {
    description: 'Deploy the application',
    builder: (cmd) =>
      cmd
        .option('env', {
          type: 'string',
          description: 'Deployment environment',
          choices: environments,
          required: true,
        })
        .option('replicas', {
          type: 'number',
          description: 'Number of replicas',
          default: 1,
        })
        .option('dryRun', {
          type: 'boolean',
          description: 'Preview deployment without executing',
        })
        .middleware(zodMiddleware(deployConfigSchema)),

    handler: (args) => {
      // TypeScript knows about transformed properties
      console.log(`Deploying to ${args.env}...`);
      console.log(`  replicas: ${args.replicas}`);
      console.log(`  requiresApproval: ${args.requiresApproval}`);
      console.log(`  timeout: ${args.defaultTimeout}s`);

      if (args.dryRun) {
        console.log('Dry run complete.');
      }
    },
  })

  .command('user-info', {
    description: 'Display user information',
    builder: (cmd) =>
      cmd
        .option('email', {
          type: 'string',
          description: 'User email address',
          required: true,
        })
        .option('role', {
          type: 'string',
          description: 'User role',
          choices: roles,
          required: true,
        })
        .option('name', {
          type: 'string',
          description: 'Display name',
        })
        .middleware(zodMiddleware(userSchema)),

    handler: (args) => {
      // Email is normalized, permission flags are computed
      console.log(`User Information:`);
      console.log(`  Email: ${args.email}`);
      console.log(`  Role: ${args.role}`);
      console.log(`  Can Edit: ${args.canEdit}`);
      console.log(`  Can Admin: ${args.canAdmin}`);

      if (args.name) {
        console.log(`  Name: ${args.name}`);
      }
    },
  });

export default app;

if (require.main === module) {
  app.forge();
}
