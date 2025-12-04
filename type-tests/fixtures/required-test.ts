/**
 * Test if required: true on nested properties breaks type inference
 */
import cliForge from 'cli-forge';

// Test 1: Nested object WITHOUT required fields - should work
const cli1 = cliForge('test1', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        database: {
          type: 'object',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 5432 },
            name: { type: 'string', default: 'mydb' },
          },
        },
      },
      additionalProperties: 'string',
      validate: (val) => true,
      coerce: (val) => val,
    }),
  handler: (args) => {
    // Should work
    console.log(args.config?.database);
  },
});

// Test 2: Nested object WITH required fields - might break
const cli2 = cliForge('test2', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
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
    }),
  handler: (args) => {
    // Might fail
    console.log(args.config?.database);
  },
});

// Test 3: Just one required field
const cli3 = cliForge('test3', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        database: {
          type: 'object',
          properties: {
            host: { type: 'string', required: true },
          },
        },
      },
      additionalProperties: 'string',
      validate: (val) => true,
      coerce: (val) => val,
    }),
  handler: (args) => {
    console.log(args.config?.database);
  },
});

// Test 4: No additionalProperties, with required
const cli4 = cliForge('test4', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      properties: {
        database: {
          type: 'object',
          properties: {
            host: { type: 'string', required: true },
          },
        },
      },
      validate: (val) => true,
      coerce: (val) => val,
    }),
  handler: (args) => {
    console.log(args.config?.database);
  },
});
