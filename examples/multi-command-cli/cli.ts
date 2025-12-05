import { cli, chain } from 'cli-forge';

import { registerInitCommand } from './commands/init';
import { registerBuildCommand } from './commands/build';
import { registerServeCommand } from './commands/serve';

/**
 * Main CLI entry point.
 *
 * Commands are registered from separate files, keeping
 * the entry point clean and each command focused.
 */
const app = cli('project-cli', {
  description: 'Project management CLI',
  builder: (args) => {
    // Register all commands using chain. The order determines help text order.
    return chain(args, registerInitCommand, registerBuildCommand, registerServeCommand);
  },
}).demandCommand();

export default app;

if (require.main === module) {
  app.forge();
}
