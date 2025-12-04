/**
 * Test ObjectValue composition
 */
import { ResolveProperties, AdditionalPropertiesType } from '@cli-forge/parser';

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

// Simulate ObjectValue
type ObjectValue<T, A> = ResolveProperties<T> & AdditionalPropertiesType<A>;

// Test 1: ObjectValue without NoInfer
type OV1 = ObjectValue<TProps, false>;
const test1: OV1 = { server: undefined, database: undefined };  // Should work

// Test 2: ObjectValue with NoInfer
type OV2 = ObjectValue<NoInfer<TProps>, NoInfer<false>>;
const test2: OV2 = { server: undefined, database: undefined };  // Should work

// Force errors to see types
const _ov1: OV1 = 'force error';
const _ov2: OV2 = 'force error';

// Test 3: What about Default type?
type Default<T> = T;  // Simplified

type D1 = Default<NoInfer<OV1>>;
const test3: D1 = { server: undefined, database: undefined };  // Should work
const _d1: D1 = 'force error';
