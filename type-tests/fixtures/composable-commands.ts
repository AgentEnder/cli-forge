import { cli, makeComposableBuilder } from 'cli-forge';

const withPromotionOpts = makeComposableBuilder((c) =>
  c
    .option('promotionId', {
      type: 'number',
      description: 'Cagematch.net promotion ID to scrape data for',
    })
    .option('promotion', {
      type: 'string',
      description: 'Promotion short name (for scrape command)',
      choices: ['ewa'],
    })
    .conflicts('promotionId', 'promotion')
);

type NotNull<T> = T extends null | undefined ? never : T;

async function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`${message} (y/N): `);
    process.stdin.setEncoding('utf-8');
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === 'y' || input === 'yes');
    });
  });
}

cli('db-cli')
  .option('local', { type: 'boolean', default: true })
  .command({
    name: 'reset',
    handler: async (opts) => {
      if (opts.local) {
        console.log('Resetting local database...');
        // Simulate local DB reset
        console.log('Local database reset complete.');
      } else {
        console.log(`Deleting Turso database...`);
        console.log(`Recreating Turso database...`);
        console.log('Turso database reset complete.');
      }
    },
  })
  .command({
    name: 'migrate',
    handler: async (opts) => {
      console.log('Migration complete.');
      console.log('Seed migrations complete.');
    },
  })
  .command({
    name: 'seed' as const,
    builder: (c) =>
      withPromotionOpts(c)
        .option('type', {
          type: 'string',
          choices: ['seed', 'scrape'],
          default: 'seed',
        })
        .middleware((opts) => {
          if (!opts.promotion && !opts.promotionId && opts.type === 'scrape') {
            throw new Error(
              'Either --promotionId or --promotion must be specified for scrape type'
            );
          }
        }),

    handler: async (opts) => {
      if (opts.type === 'seed') {
        console.log('Seeding database with default data...');
      } else {
        console.log(
          `Scraping data for promotion: ${
            opts.promotionId ?? opts.promotion
          }...`
        );
      }
      console.log('Database seeding complete.');
    },
  })
  .command('reset-and-scrape', {
    builder: (c) => withPromotionOpts(c),
    handler: async (opts, ctx) => {
      const { seed, migrate, reset } = ctx.command.getParent().getChildren();
      await reset.getHandler()?.({
        local: opts.local,
      });
      await migrate.getHandler()?.({
        local: opts.local,
        //@ts-expect-error -- this field shouldn't be supported by TS, if it is that signals bad type inference
        type: 'foo',
      });
      await seed.getHandler()?.({
        local: opts.local,
        type: 'scrape',
        promotion: opts.promotion,
        promotionId: opts.promotionId,
      });
    },
  })
  .forge();
