/**
 * Test two nested objects WITHOUT additionalProperties
 */
import cliForge from 'cli-forge';

// Test: Two nested objects with default but NO additionalProperties
const cli = cliForge('test', {
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
      // NO additionalProperties
      validate: (val) => true,
      coerce: (val) => val,
      default: { server: { host: 'localhost', port: 3000 } },
    }),
  handler: (args) => {
    console.log(args.config?.server);
    console.log(args.config?.database);
  },
});
