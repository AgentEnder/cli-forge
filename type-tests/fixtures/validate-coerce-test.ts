/**
 * Test validate + coerce together
 */
import cliForge from 'cli-forge';

// Test with both validate AND coerce
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
      },
      additionalProperties: 'string',
      validate: (val) => {
        // What is val typed as?
        console.log(val);
        return true;
      },
      coerce: (val) => {
        // What is val typed as?
        console.log(val);
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
    // What is args.config typed as?
    console.log(args.config);
    console.log(args.config?.server);
  },
});
