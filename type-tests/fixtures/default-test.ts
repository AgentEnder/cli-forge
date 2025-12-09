/**
 * Test default type for nested objects
 */
import { ObjectOptionConfig, ResolveProperties, WithAdditionalProperties } from '@cli-forge/parser';

// Test what the default type should be
type TestProps = {
  server: {
    type: 'object';
    properties: {
      host: { type: 'string'; default: 'localhost' };
      port: { type: 'number'; default: 3000 };
    };
  };
  features: {
    type: 'array';
    items: 'string';
    default: ['basic'];
  };
};

type ObjectValue = WithAdditionalProperties<ResolveProperties<TestProps>, 'string'>;
//   ^?

// What does ObjectOptionConfig expect for default?
type TestConfig = ObjectOptionConfig<unknown, TestProps, 'string'>;
type DefaultType = TestConfig['default'];
//   ^?

// Can we assign the example's default value?
const exampleDefault = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: false,
  },
  features: ['basic'],
};

// Try to use it in a config
const testConfig: ObjectOptionConfig<unknown, TestProps, 'string'> = {
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
      },
    },
    features: {
      type: 'array',
      items: 'string',
      default: ['basic'],
    },
  },
  additionalProperties: 'string',
  default: {
    server: {
      host: 'localhost',
      port: 3000,
    },
    features: ['basic'],
  },
};
