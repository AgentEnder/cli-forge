import { cli } from 'cli-forge';

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
    // Register all commands. The order determines help text order.
    let result: any = registerInitCommand(args);
    result = registerBuildCommand(result);
    result = registerServeCommand(result);
    return result;
  },
}).demandCommand();

export default app;

if (require.main === module) {
  app.forge();
}
