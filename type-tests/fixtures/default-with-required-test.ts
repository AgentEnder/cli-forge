/**
 * Test if default + required: true on nested properties breaks type inference
 */
import cliForge from 'cli-forge';

// Test 1: Two nested objects with required, NO default
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
            name: { type: 'string', required: true },
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
      // NO default
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test 2: Two nested objects with required, WITH default
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
            port: { type: 'number', default: 5432 },
            name: { type: 'string', required: true },
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000 } }, // WITH default
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});
