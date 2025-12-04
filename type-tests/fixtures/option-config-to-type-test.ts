/**
 * Test OptionConfigToType with complex object config
 */
import { OptionConfigToType, OptionConfig } from '@cli-forge/parser';

// The exact config from the example
type ExampleConfig = {
  type: 'object';
  description: 'Configuration object with nested properties';
  properties: {
    server: {
      type: 'object';
      description: 'Server configuration';
      properties: {
        host: { type: 'string'; description: 'Server hostname'; default: 'localhost' };
        port: { type: 'number'; description: 'Server port'; default: 3000 };
        ssl: { type: 'boolean'; description: 'Enable SSL'; default: false };
      };
    };
    database: {
      type: 'object';
      description: 'Database configuration';
      properties: {
        host: { type: 'string'; description: 'Database hostname'; required: true };
        port: { type: 'number'; description: 'Database port'; default: 5432 };
        name: { type: 'string'; description: 'Database name'; required: true };
      };
    };
    features: {
      type: 'array';
      items: 'string';
      description: 'Enabled features';
      default: ['basic'];
    };
  };
  additionalProperties: 'string';
  default: {
    server: { host: 'localhost'; port: 3000; ssl: false };
    features: ['basic'];
  };
};

// What does OptionConfigToType give us?
type Result = OptionConfigToType<ExampleConfig>;

// Can we assign undefined to nested properties?
const test1: Result = { server: undefined, database: undefined, features: undefined };

// Force error to see the type
const _result: Result = 'force error';
