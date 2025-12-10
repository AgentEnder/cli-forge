import { cli, chain } from 'cli-forge';

import { withInitCommand } from './commands/init';
import { withBuildCommand, BuildResult } from './commands/build';
import { withServeCommand, ServerInfo } from './commands/serve';

const app = cli('project-cli', {
  description: 'Project management CLI',
  builder: (args) =>
    chain(args, withInitCommand, withBuildCommand, withServeCommand),
  handler: async (_args, ctx) => {
    // Child handlers are typed - can invoke programmatically if needed
    const children = ctx.command.getChildren();

    const { init, build } = {
      init: children.init.getHandler(),
      build: children.build.getHandler(),
    };

    const result = init?.({
      git: true,
      name: 'MyProject',
      template: 'typescript',
    });

    const buildResult = build?.({
      minify: true,
      sourcemap: false,
      outDir: 'dist',
    });

    console.log('Build result:', buildResult);
  },
}).demandCommand();

export default app;

// Export types for consumers who want to use commands programmatically
export type { BuildResult, ServerInfo };

if (require.main === module) {
  app.forge();
}
