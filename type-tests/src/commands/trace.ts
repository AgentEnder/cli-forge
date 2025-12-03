import { cli, type CLI } from 'cli-forge';
import type { ParsedArgs } from '@cli-forge/parser';
import * as path from 'path';
import { traceTypeAt, traceAllTypesAt } from '../lib/trace.js';
import {
  formatTraceTree,
  formatWarnings,
  formatLocation,
} from '../lib/type-formatter.js';

/**
 * Builder for the trace command arguments
 */
export function withTraceArgs<T extends ParsedArgs>(cmd: CLI<T>) {
  return cmd
    .option('file', {
      type: 'string',
      description: 'Path to the TypeScript file to analyze',
      required: true,
      alias: ['f'],
    })
    .option('selector', {
      type: 'string',
      description: 'tsquery selector to find the AST node',
      required: true,
      alias: ['s'],
    })
    .option('index', {
      type: 'number',
      description: 'Which match to trace (0-based index)',
      default: 0,
      alias: ['i'],
    })
    .option('all', {
      type: 'boolean',
      description: 'Trace all matches instead of just one',
      default: false,
      alias: ['a'],
    });
}

/**
 * The trace command - visualizes type resolution chains
 */
export const traceCommand = cli('trace', {
  description: 'Trace TypeScript type resolution at a specific location',
  usage: 'type-debug trace --file <file> --selector <selector> [--index <n>] [--all]',
  examples: [
    'type-debug trace --file ./test.ts --selector "Parameter[name.text=\\"val\\"]"',
    'type-debug trace -f ./test.ts -s "PropertyAssignment[name.text=\\"coerce\\"] ArrowFunction > Parameter"',
    'type-debug trace --file ./test.ts --selector "Parameter" --all',
  ],
  builder: (b) => withTraceArgs(b),
  handler: async (args) => {
    try {
      // Resolve file path to absolute
      const filePath = path.resolve(process.cwd(), args.file);

      if (args.all) {
        // Trace all matches
        const results = traceAllTypesAt({
          file: filePath,
          selector: args.selector,
        });

        console.log(
          `\nFound ${results.length} match(es) for selector: ${args.selector}\n`
        );

        results.forEach((result, index) => {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`Match ${index}: ${formatLocation(result.location)}`);
          console.log(`${'='.repeat(80)}\n`);

          console.log(`Inferred Type: ${result.inferredType}\n`);

          if (result.chain.length > 0) {
            console.log('Type Resolution Chain:');
            console.log(formatTraceTree(result.chain[0]));
          }

          if (result.warnings.length > 0) {
            console.log(formatWarnings(result.warnings));
          }
        });

        console.log(`\n${'='.repeat(80)}\n`);
      } else {
        // Trace single match
        const result = traceTypeAt({
          file: filePath,
          selector: args.selector,
          index: args.index,
        });

        console.log(`\nLocation: ${formatLocation(result.location)}\n`);
        console.log(`Inferred Type: ${result.inferredType}\n`);

        if (result.chain.length > 0) {
          console.log('Type Resolution Chain:');
          console.log(formatTraceTree(result.chain[0]));
        }

        if (result.warnings.length > 0) {
          console.log(formatWarnings(result.warnings));
        }

        console.log(); // Extra newline for readability
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\nError: ${error.message}\n`);
        process.exit(1);
      }
      throw error;
    }
  },
});
