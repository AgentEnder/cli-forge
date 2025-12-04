/**
 * Test if explicit return type on coerce helps
 */
import cliForge from 'cli-forge';

// Test 1: Two nested objects with typed coerce return
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
            host: { type: 'string', default: 'localhost' },
          },
        },
      },
      coerce: (val): typeof val => val,
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test 2: What if we just don't return anything from coerce?
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
            host: { type: 'string', default: 'localhost' },
          },
        },
      },
      coerce: (val) => {
        // Do something with val
        console.log(val);
        return val as typeof val;
      },
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});
