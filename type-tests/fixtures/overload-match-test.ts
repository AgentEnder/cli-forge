/**
 * Test to check if the correct overload is being matched
 */
import cliForge from 'cli-forge';
import { ObjectOptionConfig } from '@cli-forge/parser';

// Type helper to get the config type
type GetConfig<T> = T extends { config: infer C } ? C : never;

// Working case - no default
const working = cliForge('working', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
          },
        },
      },
      validate: (config) => config.server?.host !== undefined,
    }),
  handler: () => {},
});

// Broken case - has default
const broken = cliForge('broken', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
          },
        },
      },
      default: { server: { host: 'localhost' } },
      validate: (config) => config.server?.host !== undefined,
    }),
  handler: () => {},
});

// Note: CLI doesn't expose an 'args' property directly.
// The args type is accessible through ArgumentsOf<typeof cli>
import { ArgumentsOf } from 'cli-forge';
type WorkingArgs = ArgumentsOf<typeof working>;
type BrokenArgs = ArgumentsOf<typeof broken>;

// @ts-expect-error: Intentional error to see the type
const _workingType: GetConfig<WorkingArgs> = 'error';
// @ts-expect-error: Intentional error to see the type
const _brokenType: GetConfig<BrokenArgs> = 'error';

// Also test the option config itself
const workingConfig = {
  type: 'object' as const,
  properties: {
    server: {
      type: 'object' as const,
      properties: {
        host: { type: 'string' as const, default: 'localhost' },
      },
    },
  },
  validate: (config: any) => config.server?.host !== undefined,
};

const brokenConfig = {
  type: 'object' as const,
  properties: {
    server: {
      type: 'object' as const,
      properties: {
        host: { type: 'string' as const, default: 'localhost' },
      },
    },
  },
  default: { server: { host: 'localhost' } },
  validate: (config: any) => config.server?.host !== undefined,
};

// Check if these match ObjectOptionConfig
type WorkingMatches = typeof workingConfig extends ObjectOptionConfig<any, any>
  ? true
  : false;
type BrokenMatches = typeof brokenConfig extends ObjectOptionConfig<any, any>
  ? true
  : false;

const _workingMatches: WorkingMatches = 'error' as any;
const _brokenMatches: BrokenMatches = 'error' as any;
