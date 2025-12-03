import * as path from 'path';
import { runAssertions } from '../lib/assert.js';
import type { CLI, CLICommandOptions } from 'cli-forge';
import type { ParsedArgs } from '@cli-forge/parser';

interface AssertArgs extends ParsedArgs {
  file: string;
}

/**
 * Assert command configuration
 * Runs compile-time type assertions on a TypeScript file
 */
export const assertCommand: CLICommandOptions<ParsedArgs, AssertArgs> = {
  description: 'Run compile-time type assertions on a TypeScript file',
  usage: 'type-debug assert <file>',
  examples: [
    'type-debug assert ./assertions/object-types.ts',
    'type-debug assert /absolute/path/to/assertions.ts',
  ],
  builder: (cli: CLI<ParsedArgs>) =>
    cli.positional('file', {
      type: 'string',
      description: 'Path to the TypeScript assertion file',
      required: true,
    }),
  handler: async (args: AssertArgs) => {
    const absolutePath = path.isAbsolute(args.file)
      ? args.file
      : path.resolve(process.cwd(), args.file);

    try {
      console.log(`Running assertions: ${absolutePath}\n`);

      const result = runAssertions(absolutePath);

      if (result.passed) {
        console.log('✓ All assertions passed');
        console.log(`  File: ${path.basename(result.file)}`);
        process.exit(0);
      } else {
        console.log('✗ Assertions failed\n');
        console.log(`  File: ${path.basename(result.file)}`);
        console.log(`  Errors: ${result.errorCount}\n`);

        if (result.errors.length > 0) {
          console.log('Type Errors:');
          result.errors.forEach((error) => {
            console.log(`  ${error}`);
          });
        }

        process.exit(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error(`Unknown error: ${String(error)}`);
      }
      process.exit(1);
    }
  },
};
