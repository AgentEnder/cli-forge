/**
 * Test OptionConfigToType with complex object config
 */
import { OptionConfigToType } from '@cli-forge/parser';
import test from 'node:test';

type ExampleConfig = {
  type: 'object';
  description: 'Configuration object with nested properties';
  properties: {
    server: {
      type: 'object';
      description: 'Server configuration';
      properties: {
        host: {
          type: 'string';
          description: 'Server hostname';
          default: 'localhost';
        };
        port: { type: 'number'; description: 'Server port'; default: 3000 };
        ssl: { type: 'boolean'; description: 'Enable SSL'; default: false };
      };
      additionalProperties: 'string';
    };
    database: {
      type: 'object';
      description: 'Database configuration';
      properties: {
        host: {
          type: 'string';
          description: 'Database hostname';
          required: true;
        };
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
  default: {
    server: { host: 'localhost'; port: 3000; ssl: false };
    features: ['basic'];
  };
};

// What does OptionConfigToType give us?
type Result = OptionConfigToType<ExampleConfig>;

// Nested object properties can be undefined (no required:true at object level)
// features has a default so it's always present
const test1: Result = {
  server: undefined,
  database: undefined,
  features: ['test'],
};

// Can also provide full values
const test2: Result = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: false,
    foo: 'hello',
    bar: 'world',
    // This typing doesn't work for assignment due to index signature constraints
    // but, it does seem to work fine for access via bracket notation... so we'll roll
    // with it.
  } as any as Result['server'],
  database: { host: 'db', port: 5432, name: 'mydb' },
  features: ['test'],
};

test2.server?.['foo']?.charAt(0); // Should work, type is string | undefined
test2.database?.host.charAt(0); // Should work, type is string
test2.features[0].charAt(0); // Should work, type is string

// @ts-expect-error: Intentional error to see type/
const _result: Result = 'force error';
