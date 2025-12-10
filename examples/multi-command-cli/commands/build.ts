import { makeComposableBuilder } from 'cli-forge';

/**
 * Build result type - returned by the handler for programmatic access.
 */
export interface BuildResult {
  success: boolean;
  outputDir: string;
  files: string[];
}

/**
 * Composable builder that adds the build command.
 * Returns build result information.
 */
export const withBuildCommand = makeComposableBuilder((args) =>
  args.command('build', {
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

    handler: (args): BuildResult => {
      console.log('Building project...');
      console.log(`  outDir: ${args.outDir}`);
      console.log(`  minify: ${args.minify}`);
      console.log(`  sourcemap: ${args.sourcemap}`);

      // Simulated build result
      return {
        success: true,
        outputDir: args.outDir,
        files: ['index.js', 'styles.css'],
      };
    },
  })
);
