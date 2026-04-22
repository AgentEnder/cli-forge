/**
 * Tests that TProviders defaults to {} and passes through option/command chains
 * without breaking existing type inference.
 */
import { cli } from 'cli-forge';

// TProviders defaults to {} and passes through option chains
const app = cli('test')
  .option('name', { type: 'string' })
  .command('sub', {
    builder: (cmd) => cmd.option('port', { type: 'number' }),
    handler: () => {},
  });

// Verify the CLI type still accepts a handler with correct arg types
app.handler((args) => {
  const name: string | undefined = args.name;
  void name;
});

export default app;
