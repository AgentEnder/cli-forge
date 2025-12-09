/**
 * Test additionalProperties interaction with nested objects
 */
import { ResolveProperties, WithAdditionalProperties } from '@cli-forge/parser';

// When additionalProperties is 'string', the type becomes Record<string, string>
type TestAdditional = WithAdditionalProperties<{}, 'string'>;
//   ^? should be Record<string, string>

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
//   ^? should be { server: { host: string; port: number } | undefined }

// The WRONG approach: simple intersection with Record<string, string>
// This fails because `server` must satisfy BOTH the object type AND string
// type WrongCombined = ResolvedProps & Record<string, string>;

// Helper type: Combines explicit properties with an index signature for additional props
// The index signature uses a union type that includes both the explicit property types
// and the additional property type (string)
type WithAdditionalProps<T, TAdditional> = T & {
  [key: string]: T[keyof T] | TAdditional | undefined;
};

// Apply the pattern
type CorrectCombined = WithAdditionalProps<ResolvedProps, string>;

// Now we can assign the default value correctly
const testDefault: CorrectCombined = {
  server: {
    host: 'localhost',
    port: 3000,
  },
};

// And we can add additional string properties
const testWithExtra: CorrectCombined = {
  server: {
    host: 'localhost',
    port: 3000,
  },
  extraKey: 'some string value',
  anotherKey: 'another value',
};

// Verify the types work as expected
// Note: server properties may be undefined due to the union in the index signature
const _serverHost: string | undefined = testWithExtra.server?.host;
const _serverPort: number | undefined = testWithExtra.server?.port;
const _extra: string | undefined = testWithExtra['extraKey'] as
  | string
  | undefined;
