/**
 * Test that matches the exact structure from object-notation-cli.ts
 */
import cliForge from 'cli-forge';

const cli = cliForge('test', {
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
      default: {
        server: {
          host: 'localhost',
          port: 3000,
          ssl: false,
        },
        features: ['basic'],
      },
      validate: (config) => {
        // Does config have proper type?
        if (
          config.server?.port &&
          (config.server.port < 1 || config.server.port > 65535)
        ) {
          return 'Server port must be between 1 and 65535';
        }
        return true;
      },
      coerce: (config) => {
        // Does config have proper type?
        if (config.server) {
          // Accessing server properties
          const host = config.server.host;
          const port = config.server.port;
        }
        return config;
      },
    }),
  handler: (args) => {
    // Does args.config have proper type?
    console.log(args.config?.server);
  },
});
