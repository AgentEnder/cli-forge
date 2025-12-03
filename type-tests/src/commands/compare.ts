import { cli, type CLI } from 'cli-forge';
import type { ParsedArgs } from '@cli-forge/parser';
import * as path from 'path';
import { compareTypes } from '../lib/type-compare.js';
import {
  formatCompareWithSelector,
  formatMatchSuccess,
} from '../lib/diff-formatter.js';
import {
  formatTraceTree,
  formatWarnings,
} from '../lib/type-formatter.js';

/**
 * Builder for the compare command arguments
 */
export function withCompareArgs<T extends ParsedArgs>(cmd: CLI<T>) {
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
    .option('expected', {
      type: 'string',
      description: 'Expected type as a string',
      required: true,
      alias: ['e'],
    })
    .option('index', {
      type: 'number',
      description: 'Which match to compare (0-based index)',
      default: 0,
      alias: ['i'],
    })
    .option('include-trace', {
      type: 'string',
      description: 'When to include type resolution trace: always, on_mismatch, never',
      default: 'on_mismatch',
      alias: ['t'],
      coerce: (val) => {
        if (val !== 'always' && val !== 'on_mismatch' && val !== 'never') {
          throw new Error(
            `Invalid --include-trace value: "${val}". Must be: always, on_mismatch, or never`
          );
        }
        return val;
      },
    });
}

/**
 * The compare command - compares inferred types against expected types
 */
export const compareCommand = cli('compare', {
  description: 'Compare inferred type against expected type with detailed diff',
  usage: 'type-debug compare --file <file> --selector <selector> --expected <type> [--index <n>] [--include-trace <mode>]',
  examples: [
    'type-debug compare --file ./test.ts --selector "Parameter[name.text=\\"val\\"]" --expected "{ foo: string }"',
    'type-debug compare -f ./test.ts -s "PropertyAssignment[name.text=\\"coerce\\"] ArrowFunction > Parameter" -e "Record<string, any>"',
    'type-debug compare --file ./test.ts --selector "Parameter" --expected "string" --include-trace always',
  ],
  builder: (b) => withCompareArgs(b),
  handler: async (args) => {
    try {
      // Resolve file path to absolute
      const filePath = path.resolve(process.cwd(), args.file);

      // Run the comparison
      const result = compareTypes({
        file: filePath,
        selector: args.selector,
        expected: args.expected,
        index: args.index,
        includeTrace: args['include-trace'] as 'always' | 'on_mismatch' | 'never',
      });

      if (result.match) {
        // Types match - success!
        console.log('\n' + formatMatchSuccess(result.actual) + '\n');

        // If trace is included (--include-trace always), show it
        if (result.trace) {
          console.log('Type Resolution Trace:');
          console.log('─'.repeat(57));
          if (result.trace.chain.length > 0) {
            console.log(formatTraceTree(result.trace.chain[0]));
          }
          if (result.trace.warnings.length > 0) {
            console.log(formatWarnings(result.trace.warnings));
          }
          console.log();
        }

        process.exit(0);
      } else {
        // Types don't match - show detailed diff
        console.log('\n✗ Type mismatch\n');

        // Format the comparison result with optional trace
        const traceString = result.trace
          ? formatTraceTree(result.trace.chain[0])
          : undefined;

        console.log(
          formatCompareWithSelector(
            args.selector,
            result.actual,
            result.expected,
            result.differences,
            traceString
          )
        );

        // Show warnings from trace if available
        if (result.trace?.warnings && result.trace.warnings.length > 0) {
          console.log(formatWarnings(result.trace.warnings));
        }

        console.log(); // Extra newline for readability

        process.exit(1);
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
