/**
 * Test if multiple required properties break type inference
 */
import cliForge from 'cli-forge';

// Test 1: One required property with default - passes?
const cli1 = cliForge('test1', {
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
            port: { type: 'number', default: 5432 },
          },
        },
      },
      additionalProperties: 'string',
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test 2: Two required properties with default - fails?
const cli2 = cliForge('test2', {
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
            name: { type: 'string', required: true },
          },
        },
      },
      additionalProperties: 'string',
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test 3: Three properties total (2 required, 1 default) with default - fails?
const cli3 = cliForge('test3', {
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
            port: { type: 'number', default: 5432 },
            name: { type: 'string', required: true },
          },
        },
      },
      additionalProperties: 'string',
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});
