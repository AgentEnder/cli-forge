import { cli, chain } from 'cli-forge';

import { withInitCommand } from './commands/init';
import { withBuildCommand, BuildResult } from './commands/build';
import { withServeCommand, ServerInfo } from './commands/serve';

/**
 * Main CLI entry point demonstrating typed command composition.
 *
 * Key features shown:
 * - Commands are composed using `chain` and `makeComposableBuilder`
 * - Each command's handler has a typed return value
 * - Child commands are accessible via `getChildren()` with full type safety
 * - Handlers can be retrieved and invoked programmatically
 */
const app = cli('project-cli', {
  description: 'Project management CLI',

  // Compose all commands using chain - no more `as any` needed!
  builder: (args) => chain(args, withInitCommand, withBuildCommand, withServeCommand),

  // Parent handler has typed access to all child commands
  handler: (args, ctx) => {
    const children = ctx.command.getChildren();

    // TypeScript knows about all child commands and their types
    // children.init, children.build, children.serve are all typed

    // Get handlers - useful for programmatic command invocation
    const initHandler = children.init.getHandler();
    const buildHandler = children.build.getHandler();
    const serveHandler = children.serve.getHandler();

    // Handler return types are preserved:
    // - initHandler returns { projectPath: string; template: string }
    // - buildHandler returns BuildResult
    // - serveHandler returns ServerInfo

    console.log('project-cli - A CLI demonstrating typed command composition');
    console.log('');
    console.log('Available commands:');
    console.log('  init   - Initialize a new project');
    console.log('  build  - Build the project for production');
    console.log('  serve  - Start development server');
    console.log('');
    console.log('Run `project-cli <command> --help` for more info.');
  },
}).demandCommand();

export default app;

// Export types for consumers who want to use commands programmatically
export type { BuildResult, ServerInfo };

if (require.main === module) {
  app.forge();
}
