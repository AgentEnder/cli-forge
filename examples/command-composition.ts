// ---
// id: command-composition
// title: Command Composition
// description: |
//   Demonstrates how to compose commands by accessing sibling commands
//   through the handler context.
// commands:
//   - command: '{filename} reset --verbose'
//     assertions:
//       - contains: 'Emptying database...'
//       - contains: 'Running migrations...'
//       - contains: 'Seeding database...'
//       - contains: 'Reset complete!'
// ---

import { cli } from 'cli-forge';

const dbCli = cli('db', { description: 'Database management CLI' })
  .option('verbose', { type: 'boolean', alias: ['v'], description: 'Enable verbose output' })

  .command('empty', {
    description: 'Empty the database',
    builder: (p) => p.option('force', { type: 'boolean', description: 'Skip confirmation' }),
    handler: (args, _ctx) => {
      if (args.verbose) console.log('Emptying database...');
      // Database clearing logic here
    }
  })

  .command('migrate', {
    description: 'Run database migrations',
    builder: (p) => p.option('target', { type: 'string', description: 'Target migration version' }),
    handler: (args, _ctx) => {
      if (args.verbose) console.log('Running migrations...');
      // Migration logic here
    }
  })

  .command('seed', {
    description: 'Seed the database with initial data',
    builder: (p) => p.option('dataset', { type: 'string', default: 'default' }),
    handler: (args, _ctx) => {
      if (args.verbose) console.log('Seeding database...');
      // Seeding logic here
    }
  })

  .command('reset', {
    description: 'Reset database: empty, migrate, then seed',
    handler: async (args, ctx) => {
      // Full type inference - no explicit type parameters needed!
      const siblings = ctx.getParentCommand().getChildCommands();
      // siblings.empty, siblings.migrate, siblings.seed are all fully typed

      // Execute siblings in sequence - context is baked in, just pass args
      await siblings.empty.getHandler()?.(args);
      await siblings.migrate.getHandler()?.(args);
      await siblings.seed.getHandler()?.(args);

      console.log('Reset complete!');
    }
  });

dbCli.forge();
