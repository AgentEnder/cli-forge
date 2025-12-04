import { makeComposableBuilder } from 'cli-forge';

/**
 * Output format choices. Using a const array allows TypeScript
 * to infer the literal union type.
 */
export const OUTPUT_FORMATS = ['json', 'yaml', 'table', 'plain'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

/**
 * Adds a --format option for controlling output format.
 * The choices are constrained to the OUTPUT_FORMATS array.
 */
export const withFormat = makeComposableBuilder((args) =>
  args.option('format', {
    type: 'string',
    alias: ['f'],
    description: 'Output format',
    choices: OUTPUT_FORMATS,
    default: 'plain' as OutputFormat,
  })
);

/**
 * Adds a --output option for specifying output file path.
 */
export const withOutputFile = makeComposableBuilder((args) =>
  args.option('output', {
    type: 'string',
    alias: ['o'],
    description: 'Write output to file instead of stdout',
  })
);
