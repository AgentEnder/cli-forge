/**
 * Test if having two nested objects breaks type inference
 */
import cliForge from 'cli-forge';

type WithArgs<T> = T & { $args?: unknown } extends never
  ? never
  : T & { $args?: unknown };

declare const foo: WithArgs<number>;

foo['$args'] = 'baz';

// Test 1: Two nested objects without required
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
            port: { type: 'number', default: 5432 },
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test 2: Two nested objects WITH required on one
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
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test 3: Three nested objects (server, database, features as array)
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
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 5432 },
          },
        },
        features: {
          type: 'array',
          items: 'string',
          default: ['basic'],
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
    console.log(args.config?.features);
  },
});
