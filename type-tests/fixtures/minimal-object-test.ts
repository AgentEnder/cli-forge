/**
 * Minimal test to understand why Object overload isn't being selected
 */
import cliForge from 'cli-forge';

// Test 1: Simple flat object - does this work?
const cli1 = cliForge('test', {
  builder: (args) =>
    args.option('simple', {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
      },
    }),
  handler: (args) => {
    // Is this typed correctly?
    console.log(args.simple);
  },
});

// Test 2: Flat object with default
const cli2 = cliForge('test2', {
  builder: (args) =>
    args.option('simple', {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
      },
      default: {
        host: 'localhost',
        port: 3000,
      },
    }),
  handler: (args) => {
    console.log(args.simple);
  },
});

// Test 3: Nested object - does this work?
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
      },
    }),
  handler: (args) => {
    console.log(args.config);
  },
});

// Test 4: Nested object with default
const cli4 = cliForge('test4', {
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
