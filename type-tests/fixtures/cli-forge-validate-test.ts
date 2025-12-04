/**
 * Test validate callback type in cli-forge
 */
import cliForge from 'cli-forge';

// Simple case - works in parser.spec.ts
const simple = cliForge('simple', {
  builder: (args) =>
    args.option('env', {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      validate: (val) => val.foo === 'valid',  // Does val get correct type?
    }),
  handler: () => {},
});

// Complex case - from the example
const complex = cliForge('complex', {
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
      validate: (config) => config.server?.host !== undefined,  // Does config get correct type?
    }),
  handler: () => {},
});
