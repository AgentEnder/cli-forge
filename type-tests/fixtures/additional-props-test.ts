/**
 * Test additionalProperties interaction with nested objects
 */
import { ResolveProperties, AdditionalPropertiesType } from '@cli-forge/parser';

// When additionalProperties is 'string', the type becomes Record<string, string>
type TestAdditional = AdditionalPropertiesType<'string'>;
//   ^? should be Record<string, string>

// The full object value type is the intersection
type ObjectValueType<TProps, TAdditional> =
  ResolveProperties<TProps> & AdditionalPropertiesType<TAdditional>;

// For our nested properties:
type NestedProps = {
  server: {
    type: 'object';
    properties: {
      host: { type: 'string'; default: 'localhost' };
      port: { type: 'number'; default: 3000 };
    };
  };
};

// What does ResolveProperties give us?
type ResolvedProps = ResolveProperties<NestedProps>;
//   ^? should be { server: { host: string; port: number } }

// Now the problem: when we add Record<string, string>
type Combined = ResolvedProps & Record<string, string>;
//   ^? { server: { host: string; port: number } } & Record<string, string>

// The issue: server must be assignable to BOTH:
// 1. { host: string; port: number } (from explicit properties)
// 2. string (from index signature Record<string, string>)
//
// This is impossible! An object can't be a string.

// Can we assign the default value?
const testDefault: Combined = {
  server: {
    host: 'localhost',
    port: 3000,
  },
};
// This should fail because { host: string; port: number } is not string

// The fix: additionalProperties index signature should only apply
// to keys that are NOT in the explicit properties.
//
// One solution: use `Omit` to exclude known keys from the index signature
// Better solution: use a different approach that doesn't conflict
