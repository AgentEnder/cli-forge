/**
 * Test that matches the object-notation-cli.ts example structure
 */
import cliForge from 'cli-forge';

const cli = cliForge('test-cli', {
  builder: (args) =>
    args.option('config', {
      type: 'object',
      description: 'Configuration object with nested properties',
      properties: {
        server: {
          type: 'object',
          description: 'Server configuration',
          properties: {
            host: {
              type: 'string',
              description: 'Server hostname',
              default: 'localhost',
            },
            port: {
              type: 'number',
              description: 'Server port',
              default: 3000,
            },
            ssl: {
              type: 'boolean',
              description: 'Enable SSL',
              default: false,
            },
          },
        },
        // Adding database to match the original example
        database: {
          type: 'object',
          description: 'Database configuration',
          properties: {
            host: {
              type: 'string',
              description: 'Database hostname',
              required: true,
            },
            port: {
              type: 'number',
              description: 'Database port',
              default: 5432,
            },
            name: {
              type: 'string',
              description: 'Database name',
              required: true,
            },
          },
        },
        features: {
          type: 'array',
          items: 'string',
          description: 'Enabled features',
          default: ['basic'],
        },
      },
      additionalProperties: 'string',
      default: {
        server: {
          host: 'localhost',
          port: 3000,
          ssl: false,
        },
        features: ['basic'],
      },
      validate: (config) => {
        // Matching the original example's validate logic
        if (
          config.server?.port &&
          (config.server.port < 1 || config.server.port > 65535)
        ) {
          return 'Server port must be between 1 and 65535';
        }
        return true;
      },
      coerce: (config) => {
        // Matching the original - add a computed property
        if (config.server) {
          config.server.url = `${config.server.ssl ? 'https' : 'http'}://${
            config.server.host
          }:${config.server.port}`;
        }
        return config;
      },
    }),
  handler: (args) => {
    // What is args.config typed as?
    console.log(args.config);
  },
});

export default cli;
