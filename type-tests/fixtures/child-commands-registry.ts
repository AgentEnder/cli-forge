/**
 * Tests that getChildCommands() returns correctly typed registry.
 */
import { cli, CLI } from 'cli-forge';

// Build CLI with known child commands
const dbCli = cli('db')
  .command('empty', {
    builder: (p) => p.option('force', { type: 'boolean' }),
    handler: (args, _ctx) => {
      const val: boolean | undefined = args.force;
      console.log(val);
    }
  })
  .command('migrate', {
    builder: (p) => p.option('target', { type: 'string' }),
    handler: (args, _ctx) => {
      const val: string | undefined = args.target;
      console.log(val);
    }
  });

// Get children - should be fully typed without explicit parameters
const children = dbCli.getChildCommands();

// Keys should be inferred
type Keys = keyof typeof children;
// Should be: 'empty' | 'migrate'

// Each value should be a CLI with correct args
const emptyCmd = children.empty;
const migrateCmd = children.migrate;

// Verify handlers have correct types
const emptyHandler = emptyCmd.getHandler();
const migrateHandler = migrateCmd.getHandler();

if (emptyHandler) {
  emptyHandler({ force: true, unmatched: [], '--': [] } as any);
}

if (migrateHandler) {
  migrateHandler({ target: 'latest', unmatched: [], '--': [] } as any);
}

export { dbCli, children };
