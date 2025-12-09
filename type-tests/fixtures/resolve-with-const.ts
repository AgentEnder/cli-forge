/**
 * Test ResolveProperties with const-inferred properties
 */
import { ResolveProperties } from '@cli-forge/parser';

// Exact type that would be inferred from const
type ConstProps = {
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

type Resolved = ResolveProperties<ConstProps>;

// Check if nested properties are optional
const test1: Resolved = { server: undefined, database: undefined };  // Should work

// @ts-expect-error: Intentional error to see type
const test2: Resolved = 'force error';

// Also test without readonly
type MutableProps = {
  server: {
    type: 'object';
    properties: {
      host: { type: 'string'; default: 'localhost' };
      port: { type: 'number'; default: 3000 };
    };
  };
  database: {
    type: 'object';
    properties: {
      host: { type: 'string'; default: 'localhost' };
    };
  };
};

type ResolvedMutable = ResolveProperties<MutableProps>;

const test3: ResolvedMutable = { server: undefined, database: undefined };  // Should work
// @ts-expect-error: Intentional error to see type
const test4: ResolvedMutable = 'force error';
