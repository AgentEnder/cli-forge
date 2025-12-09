/**
 * Test ObjectValue composition
 */
import { ResolveProperties, WithAdditionalProperties } from '@cli-forge/parser';

// The properties type
type TProps = {
  readonly server: {
    readonly type: 'object';
    readonly properties: {
      readonly host: { readonly type: 'string'; readonly default: 'localhost' };
      readonly port: { readonly type: 'number'; readonly default: 3000 };
    };
  };
  readonly database: {
    readonly type: 'object';
    readonly properties: {
      readonly host: { readonly type: 'string'; readonly default: 'localhost' };
    };
  };
};

// Simulate ObjectValue using WithAdditionalProperties
// When additionalProperties is false, it just returns ResolveProperties<T>
type ObjectValue<T, A> = A extends false
  ? ResolveProperties<T>
  : WithAdditionalProperties<ResolveProperties<T>, A>;

// Test 1: ObjectValue without NoInfer
type OV1 = ObjectValue<TProps, false>;
const test1: OV1 = { server: undefined, database: undefined };  // Should work

// Test 2: ObjectValue with NoInfer
type OV2 = ObjectValue<NoInfer<TProps>, NoInfer<false>>;
const test2: OV2 = { server: undefined, database: undefined };  // Should work

// Test 3: What about Default type?
type Default<T> = T;  // Simplified

type D1 = Default<NoInfer<OV1>>;
const test3: D1 = { server: undefined, database: undefined };  // Should work
