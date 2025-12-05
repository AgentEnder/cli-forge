import { cli } from 'cli-forge';

const app = cli('pipeline-app')
  .option('dry-run', { type: 'boolean', description: 'Preview without executing' })

  .command('empty', {
    description: 'Clear data',
    handler: (args, _ctx) => {
      if (!args['dry-run']) {
        console.log('Executing: empty');
      }
      console.log('Step: empty');
    }
  })

  .command('migrate', {
    description: 'Apply migrations',
    handler: (args, _ctx) => {
      console.log('Step: migrate');
    }
  })

  .command('seed', {
    description: 'Seed data',
    handler: (args, _ctx) => {
      console.log('Step: seed');
    }
  })

  .command('pipeline', {
    description: 'Run multiple commands in sequence',
    builder: (p) => p.option('steps', {
      type: 'string',
      description: 'Comma-separated list of commands to run',
      required: true
    }),
    handler: async (args, ctx) => {
      console.log('Running pipeline...');

      const parent = ctx.getParentCommand();
      const commands = parent.getChildCommands();

      // Split comma-separated steps
      const steps = args.steps.split(',').map(s => s.trim());

      for (const step of steps) {
        const cmd = commands[step as keyof typeof commands];
        if (cmd) {
          // Context is baked in - just pass args
          await cmd.getHandler()?.(args as any);
        } else {
          console.error(`Unknown step: ${step}`);
        }
      }
    }
  });

app.forge();
