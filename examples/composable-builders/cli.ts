import { chain, cli } from 'cli-forge';

import { buildCommand } from './commands/build';
import { serveCommand } from './commands/serve';

/**
 * Main CLI that composes commands from separate modules.
 * Each command uses shared option builders for consistency.
 */
const app = cli('composable-demo', {
  description: 'Demonstrates composable option builders',
  builder: (args) => chain(args, buildCommand, serveCommand),
});

export default app;

if (require.main === module) {
  app.forge();
}
