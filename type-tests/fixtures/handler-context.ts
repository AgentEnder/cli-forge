/**
 * Tests that handler context provides correct types with full inference.
 */
import { cli } from 'cli-forge';

const dbCli = cli('db')
  .option('verbose', { type: 'boolean' })
  .command('empty', {
    builder: (p) => p.option('force', { type: 'boolean' }),
    handler: (args, _ctx) => {
      console.log(args.verbose, args.force);
    }
  })
  .command('migrate', {
    builder: (p) => p.option('target', { type: 'string' }),
    handler: (args, _ctx) => {
      console.log(args.verbose, args.target);
    }
  })
  .command('reset', {
    handler: async (args, ctx) => {
      // Get parent and children
      const parent = ctx.getParentCommand();
      const children = parent.getChildCommands();

      // Children should have 'empty' and 'migrate' (not 'reset' - defined after)
      const emptyCmd = children.empty;
      const migrateCmd = children.migrate;

      // Get handlers with context baked in
      const emptyHandler = emptyCmd.getHandler();
      const migrateHandler = migrateCmd.getHandler();

      if (emptyHandler && migrateHandler) {
        // Only args needed - context is baked in
        await emptyHandler({ force: true, verbose: false, unmatched: [], '--': [] });
        await migrateHandler({ target: 'latest', verbose: false, unmatched: [], '--': [] });
      }
    }
  });

export { dbCli };
