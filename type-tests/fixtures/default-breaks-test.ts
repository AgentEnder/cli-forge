/**
 * Test showing that adding `default` breaks type inference
 */
import cliForge from 'cli-forge';

// Works: Two nested objects + validate (no default)
const works = cliForge('works', {
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
        database: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
          },
        },
      },
      validate: (config) => {
        // Should work - config has proper type
        return config.server?.host !== undefined;
      },
    }),
  handler: () => {},
});

// Broken: Same as above + default
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
        database: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
          },
        },
      },
      default: { server: { host: 'localhost' } },
      validate: (config) => {
        // BROKEN - config is unknown
        return config.server?.host !== undefined;
      },
    }),
  handler: () => {},
});

// Test: Does it work with a simpler default value?
const simpleDefault = cliForge('simpleDefault', {
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
        database: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
          },
        },
      },
      default: {},  // Empty default - does this work?
      validate: (config) => {
        return config.server?.host !== undefined;
      },
    }),
  handler: () => {},
});
