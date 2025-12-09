/**
 * Tests ArgumentsOf type extraction from CLI builder functions.
 *
 * Note: ArgumentsOf expects a FUNCTION that returns a CLI, not a CLI instance.
 * This is the pattern used with builder functions.
 */
import { cli, ArgumentsOf, CLI } from 'cli-forge';

// Define as a builder function (the pattern ArgumentsOf is designed for)
const buildApp = (c: CLI) =>
  c
    .option('name', { type: 'string', required: true })
    .option('count', { type: 'number', default: 1 })
    .option('verbose', { type: 'boolean' });

// Extract the arguments type from the builder function
type AppArgs = ArgumentsOf<typeof buildApp>;

// Verify the extracted type has correct properties
// Note: CLI adds 'unmatched' for positional args, not '_'
const testArgs: AppArgs = {
  name: 'test',
  count: 1,
  verbose: true,
  unmatched: [],
};

// These should type-check correctly
const _name: string = testArgs.name;
const _count: number = testArgs.count;
const _verbose: boolean | undefined = testArgs.verbose;

// The actual CLI instance
const app = cli('test', { builder: buildApp, handler: () => {} });

export { app, testArgs };
