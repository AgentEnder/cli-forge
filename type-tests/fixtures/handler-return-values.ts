/**
 * Tests that handlers can return values and getHandler preserves return types.
 */
import { cli } from 'cli-forge';

interface QueryResult {
  rows: number;
  data: string[];
}

const app = cli('app')
  .command('query', {
    builder: (p) => p.option('limit', { type: 'number' }),
    handler: (args, _ctx): QueryResult => {
      return { rows: args.limit ?? 10, data: ['a', 'b'] };
    }
  })
  .command('report', {
    handler: async (args, ctx) => {
      // Get siblings
      const siblings = ctx.getParentCommand().getChildCommands();

      // Get handler with explicit return type
      const queryHandler = siblings.query.getHandler<QueryResult>();

      // Execute and get result
      const result = await queryHandler?.({ limit: 5, unmatched: [], '--': [] });

      // Result should be QueryResult | undefined
      if (result) {
        const count: number = result.rows;
        const items: string[] = result.data;
        console.log(count, items);
      }
    }
  });

export { app };
