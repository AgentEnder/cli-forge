import { cli, chain, makeComposableBuilder } from 'cli-forge';

import { withInitCommand } from './commands/init';
import { withBuildCommand, BuildResult } from './commands/build';
import { withServeCommand, ServerInfo } from './commands/serve';

const app = cli('project-cli', {
  description: 'Project management CLI',
  builder: (args) =>
    chain(args, withInitCommand, withBuildCommand, withServeCommand).command(
      'build-and-serve',
      {
        builder: (args) => {
          const siblings = args.getParent().getChildren();
          const withBuildArgs = siblings.build.getBuilder()!;
          const withServeArgs = siblings.serve.getBuilder()!;
          return chain(args, withBuildArgs, withServeArgs);
        },
        handler: async (args, ctx) => {
          const siblings = ctx.command.getParent().getChildren();
          const buildHandler = siblings.build.getHandler();
          const serveHandler = siblings.serve.getHandler();

          const buildResult = buildHandler
            ? await buildHandler({
                minify: args.minify,
                sourcemap: args.sourcemap,
                outDir: args.outDir,
              })
            : undefined;

          const serverInfo = serveHandler
            ? await serveHandler({
                port: args.port,
                host: args.host,
                open: args.open,
              })
            : undefined;

          console.log('Build successful:', buildResult);
          console.log('Server info:', serverInfo);

          return {
            buildResult,
            serverInfo,
          };
        },
      }
    ),
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
