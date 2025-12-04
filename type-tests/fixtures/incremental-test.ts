/**
 * Incremental test to find which field breaks type inference
 */
import cliForge from 'cli-forge';

// Test 5: Nested object with default + description
const cli5 = cliForge('test5', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      description: 'Config object',
      properties: {
        server: {
          type: 'object',
          description: 'Server config',
          properties: {
            host: { type: 'string', default: 'localhost' },
            port: { type: 'number', default: 3000 },
          },
        },
      },
      default: {
        server: {
          host: 'localhost',
          port: 3000,
        },
      },
    }),
  handler: (args) => {
    console.log(args.config);
  },
});

// Test 6: Nested object with default + additionalProperties
const cli6 = cliForge('test6', {
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
      additionalProperties: 'string',
      default: {
        server: {
          host: 'localhost',
          port: 3000,
        },
      },
    }),
  handler: (args) => {
    console.log(args.config);
  },
});

// Test 7: Nested object with coerce (no default)
const cli7 = cliForge('test7', {
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
      coerce: (val) => {
        // Is val correctly typed?
        return val;
      },
    }),
  handler: (args) => {
    console.log(args.config);
  },
});

// Test 8: Nested object with coerce AND default
const cli8 = cliForge('test8', {
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
      coerce: (val) => {
        return val;
      },
      default: {
        server: {
          host: 'localhost',
          port: 3000,
        },
      },
    }),
  handler: (args) => {
    console.log(args.config);
  },
});

// Test 9: Nested object with validate (no default)
const cli9 = cliForge('test9', {
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
      validate: (val) => {
        // Is val correctly typed?
        return true;
      },
    }),
  handler: (args) => {
    console.log(args.config);
  },
});
