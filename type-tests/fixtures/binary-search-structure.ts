/**
 * Binary search to find what breaks inference
 */
import cliForge from 'cli-forge';

// Test 1: One nested object + validate
const test1 = cliForge('test1', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 3000 },
          },
        },
      },
      validate: (config) => config.server?.host !== undefined,
    }),
  handler: () => {},
});

// Test 2: Two nested objects + validate
const test2 = cliForge('test2', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 3000 },
          },
        },
        database: {
          type: 'object',
          properties: {
            host: { type: 'string', required: true },
          },
        },
      },
      validate: (config) => config.server?.host !== undefined,
    }),
  handler: () => {},
});

// Test 3: Two nested
const test3 = cliForge('test3', {
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
            host: { type: 'string', required: true },
          },
        },
      },
      validate: (config) => config.server?.host !== undefined,
    }),
  handler: () => {},
});

// Test 4: Two nested + default
const test4 = cliForge('test4', {
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
            host: { type: 'string', required: true },
          },
        },
      },
      default: { server: { host: 'localhost' } },
      validate: (config) => config.server?.host !== undefined,
    }),
  handler: () => {},
});

// Test 5: One nested + coerce + validate
const test5 = cliForge('test5', {
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
      coerce: (config) => config,
    }),
  handler: () => {},
});
