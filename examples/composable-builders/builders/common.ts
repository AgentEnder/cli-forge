import { makeComposableBuilder } from 'cli-forge';

/**
 * Adds a --verbose flag for detailed output.
 * This option is shared across many commands.
 */
export const withVerbose = makeComposableBuilder((args) =>
  args.option('verbose', {
    type: 'boolean',
    alias: ['v'],
    description: 'Enable verbose output',
    default: false,
  })
);

/**
 * Adds a --config option for specifying a config file path.
 */
export const withConfig = makeComposableBuilder((args) =>
  args.option('config', {
    type: 'string',
    alias: ['c'],
    description: 'Path to configuration file',
  })
);

/**
 * Adds a --dry-run flag for preview mode.
 */
export const withDryRun = makeComposableBuilder((args) =>
  args.option('dryRun', {
    type: 'boolean',
    description: 'Preview changes without executing',
    default: false,
  })
);
