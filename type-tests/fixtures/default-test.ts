/**
 * Test default type for nested objects
 */
import { ObjectOptionConfig, ResolveProperties } from '@cli-forge/parser';

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

type ObjectValue = ResolveProperties<TestProps>;
//   ^?

// What does ObjectOptionConfig expect for default?
type TestConfig = ObjectOptionConfig<unknown, TestProps>;
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
const testConfig: ObjectOptionConfig<unknown, TestProps> = {
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
  default: {
    server: {
      host: 'localhost',
      port: 3000,
    },
    features: ['basic'],
  },
};
