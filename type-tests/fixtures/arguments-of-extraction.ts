/**
 * Tests ArgumentsOf type extraction from CLI instances.
 */
import { cli, ArgumentsOf } from 'cli-forge';

const app = cli('test')
  .option('name', { type: 'string', required: true })
  .option('count', { type: 'number', default: 1 })
  .option('verbose', { type: 'boolean' });

// Extract the arguments type
type AppArgs = ArgumentsOf<typeof app>;

// Verify the extracted type has correct properties
const testArgs: AppArgs = {
  name: 'test',
  count: 1,
  verbose: true,
  _: [],
};

// These should type-check correctly
const name: string = testArgs.name;
const count: number = testArgs.count;
const verbose: boolean | undefined = testArgs.verbose;

export { app, testArgs };
