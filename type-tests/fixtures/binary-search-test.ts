/**
 * Binary search to find which element breaks type inference
 */
import cliForge from 'cli-forge';

// Test A: Add ssl boolean property to server
const cliA = cliForge('test-a', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 3000 },
            ssl: { type: 'boolean', default: false },
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000, ssl: false } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
  },
});

// Test B: Add features array property
const cliB = cliForge('test-b', {
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
        features: {
          type: 'array',
          items: 'string',
          default: ['basic'],
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
      default: {
        server: { host: 'localhost', port: 3000 },
        features: ['basic'],
      },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.features);
  },
});

// Test C: Add database nested object with required fields
const cliC = cliForge('test-c', {
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
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});

// Test D: Add description fields
const cliD = cliForge('test-d', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      description: 'Configuration object',
      properties: {
        server: {
          type: 'object',
          description: 'Server config',
          properties: {
            host: { type: 'string', description: 'Host', default: 'localhost' },
            port: { type: 'number', description: 'Port', default: 3000 },
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
  },
});
