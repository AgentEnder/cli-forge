import type { CLI } from 'cli-forge';

/**
 * Register the build command.
 */
export function registerBuildCommand<T extends CLI>(cli: T) {
  return cli.command('build', {
    description: 'Build the project for production',
    builder: (cmd) =>
      cmd
        .option('outDir', {
          type: 'string',
          description: 'Output directory',
          default: 'dist',
        })
        .option('minify', {
          type: 'boolean',
          description: 'Minify output',
          default: false,
        })
        .option('sourcemap', {
          type: 'boolean',
          description: 'Generate source maps',
          default: true,
        }),

    handler: (args) => {
      console.log('Building project...');
      console.log(`  outDir: ${args.outDir}`);
      console.log(`  minify: ${args.minify}`);
      console.log(`  sourcemap: ${args.sourcemap}`);
    },
  });
}
