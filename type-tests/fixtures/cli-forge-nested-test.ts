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
        // Note: Adding dynamic properties in coerce is a runtime concern.
        // The type system tracks the declared properties only.
        // If you need to add computed properties, return a new type via explicit return type.
        return {
          ...config,
          foo: 'bar', // Example of adding a dynamic property
        };
      },
    }),
  handler: (args) => {
    // What is args.config typed as?
    console.log(args.config);
    console.log(args.config.foo.charAt(0)); // note: foo is added dynamically in coerce
  },
});

export default cli;
