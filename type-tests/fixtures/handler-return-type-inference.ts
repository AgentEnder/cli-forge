import { cli } from 'cli-forge';

// Test that handler return types are properly inferred
// This reproduces the command-composition-returns.ts issue

interface QueryResult {
  rows: number;
  data: string[];
}

const app = cli('app')
  .command('query', {
    handler: (args): QueryResult => {
      return { rows: 10, data: ['a', 'b'] };
    }
  })
  .command('report', {
    handler: async (args, ctx) => {
      const siblings = ctx.getParentCommand().getChildCommands();
      
      // getHandler should infer the return type from the handler
      const queryHandler = siblings.query.getHandler();
      
      // Result type should be inferred as QueryResult, not 'never'
      const result = await queryHandler?.(args);
      
      if (result) {
        const count: number = result.rows; // This fails - result is type 'never'
        const items: string[] = result.data; // This fails - result is type 'never'
      }
    }
  });

export { app };
