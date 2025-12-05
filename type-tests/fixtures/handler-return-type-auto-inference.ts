import { cli } from 'cli-forge';

type AssertEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
  ? true
  : false;

type IsTrue<T extends true> = T;

interface EmptyResult {
  clearedCount: number;
}

interface MigrateResult {
  appliedMigrations: number;
  currentVersion: string;
}

// Test: Return types should be inferred from handler return type annotations
const dbCli = cli('db')
  .command('empty', {
    handler: (args, _ctx): EmptyResult => {
      return { clearedCount: 150 };
    }
  })
  .command('migrate', {
    handler: async (args, _ctx): Promise<MigrateResult> => {
      return { appliedMigrations: 3, currentVersion: '2024.1.3' };
    }
  })
  .command('seed', {
    handler: (args, _ctx) => {
      // No explicit return type - should infer void
      console.log('seeding');
    }
  });

// Test: getChildCommands should have properly typed children
const children = dbCli.getChildCommands();

// Test: empty handler should return EmptyResult
type EmptyHandler = ReturnType<NonNullable<typeof children.empty.getHandler>>;
const test1: IsTrue<AssertEqual<EmptyHandler, (args: any) => EmptyResult>> = true;

// Test: migrate handler should return Promise<MigrateResult>
type MigrateHandler = ReturnType<NonNullable<typeof children.migrate.getHandler>>;
const test2: IsTrue<AssertEqual<MigrateHandler, (args: any) => Promise<MigrateResult>>> = true;

// Test: seed handler should return void
type SeedHandler = ReturnType<NonNullable<typeof children.seed.getHandler>>;
const test3: IsTrue<AssertEqual<SeedHandler, (args: any) => void>> = true;

// Test: Runtime usage works correctly
async function testRuntime() {
  const emptyHandler = children.empty.getHandler();
  const migrateHandler = children.migrate.getHandler();
  const seedHandler = children.seed.getHandler();

  if (emptyHandler) {
    const result = emptyHandler({ unmatched: [] });
    // result should be EmptyResult
    const test4: IsTrue<AssertEqual<typeof result, EmptyResult>> = true;
  }

  if (migrateHandler) {
    const result = await migrateHandler({ unmatched: [] });
    // result should be MigrateResult (after awaiting)
    const test5: IsTrue<AssertEqual<typeof result, MigrateResult>> = true;
  }

  if (seedHandler) {
    const result = seedHandler({ unmatched: [] });
    // result should be void
    const test6: IsTrue<AssertEqual<typeof result, void>> = true;
  }
}
