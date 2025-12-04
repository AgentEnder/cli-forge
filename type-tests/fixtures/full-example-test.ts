/**
 * Full test matching the object-notation-cli.ts example
 */
import cliForge from 'cli-forge';

const cli = cliForge('object-arguments', {
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
              required: true, // This will only be required if database config is provided
            },
            port: {
              type: 'number',
              description: 'Database port',
              default: 5432,
            },
            name: {
              type: 'string',
              description: 'Database name',
              required: true, // This will only be required if database config is provided
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
      // Additional properties allow passing arbitrary string values
      additionalProperties: 'string',
      // You can provide a default for the entire config object
      default: {
        server: {
          host: 'localhost',
          port: 3000,
          ssl: false,
        },
        features: ['basic'],
      },
      // Validate the entire config object
      validate: (config) => {
        if (
          config.server?.port &&
          (config.server.port < 1 || config.server.port > 65535)
        ) {
          return 'Server port must be between 1 and 65535';
        }
        return true;
      },
      // Coerce can transform the final config object
      coerce: (config) => {
        // Add a computed property
        if (config.server) {
          (config.server as any).url = `${config.server.ssl ? 'https' : 'http'}://${
            config.server.host
          }:${config.server.port}`;
        }
        return config;
      },
    }),
  handler: (args) => {
    console.log('Configuration:');
    console.log(JSON.stringify(args.config, null, 2));

    // Type-safe access to nested properties
    if (args.config?.server) {
      console.log(`\nServer will run at: ${(args.config.server as any).url}`);
    }

    if (args.config?.database) {
      console.log(
        `Database: ${args.config.database.name} at ${args.config.database.host}:${args.config.database.port}`
      );
    }

    if (args.config?.features) {
      console.log(`Features: ${args.config.features.join(', ')}`);
    }
  },
});

export default cli;
