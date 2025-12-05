// ---
// id: command-composition-returns
// title: Command Composition with Return Values
// description: |
//   Shows how handlers can return values that are used by
//   composing commands for richer workflows.
// commands:
//   - command: '{filename} reset'
//     assertions:
//       - contains: 'Cleared 150 records'
//       - contains: 'Applied 3 migrations'
//       - contains: 'Seeded 50 records'
//       - contains: 'Reset complete: removed 150, migrated 3, added 50'
// ---

import { cli } from 'cli-forge';

interface EmptyResult {
  clearedCount: number;
}

interface MigrateResult {
  appliedMigrations: number;
  currentVersion: string;
}

interface SeedResult {
  seededCount: number;
}

const dbCli = cli('db')
  .command<'empty', EmptyResult>('empty', {
    description: 'Empty the database',
    handler: (args, _ctx) => {
      const cleared = 150;
      console.log(`Cleared ${cleared} records`);
      return { clearedCount: cleared };
    }
  })

  .command<'migrate', Promise<MigrateResult>>('migrate', {
    description: 'Run migrations',
    handler: async (args, _ctx) => {
      const applied = 3;
      console.log(`Applied ${applied} migrations`);
      return { appliedMigrations: applied, currentVersion: '2024.1.3' };
    }
  })

  .command<'seed', SeedResult>('seed', {
    description: 'Seed initial data',
    handler: (args, _ctx) => {
      const seeded = 50;
      console.log(`Seeded ${seeded} records`);
      return { seededCount: seeded };
    }
  })

  .command('reset', {
    description: 'Full database reset with summary',
    handler: async (args, ctx) => {
      // Full inference - no type parameter needed for getChildCommands!
      const siblings = ctx.getParentCommand().getChildCommands();

      // Execute and capture return values
      const emptyResult = await siblings.empty.getHandler()?.(args);
      const migrateResult = await siblings.migrate.getHandler()?.(args);
      const seedResult = await siblings.seed.getHandler()?.(args);

      // Use the returned values
      console.log(
        `Reset complete: removed ${emptyResult?.clearedCount}, ` +
        `migrated ${migrateResult?.appliedMigrations}, ` +
        `added ${seedResult?.seededCount}`
      );
    }
  });

dbCli.forge();
