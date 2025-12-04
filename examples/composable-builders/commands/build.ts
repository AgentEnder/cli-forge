import { chain, makeComposableBuilder } from 'cli-forge';

import { withVerbose, withDryRun } from '../builders/common';
import { withFormat, withOutputFile } from '../builders/output';

/**
 * The build command composes multiple option builders.
 * TypeScript correctly infers the combined type of all options.
 */
export const buildCommand = makeComposableBuilder((args) =>
  args.command('build', {
    description: 'Build the project',
    builder: (cmd) =>
      chain(
        cmd,
        withVerbose,
        withDryRun,
        withFormat,
        withOutputFile
      ).option('target', {
        type: 'string',
        description: 'Build target',
        default: 'production',
      }),

    handler: (args) => {
      // All composed options are available with correct types
      if (args.verbose) {
        console.log('Build configuration:');
        console.log(`  verbose: ${args.verbose}`);
        console.log(`  dryRun: ${args.dryRun}`);
        console.log(`  format: ${args.format}`);
        console.log(`  output: ${args.output ?? 'stdout'}`);
        console.log(`  target: ${args.target}`);
      }

      if (args.dryRun) {
        console.log('Dry run: would build project');
        return;
      }

      console.log(`Building for ${args.target}...`);
    },
  })
);
