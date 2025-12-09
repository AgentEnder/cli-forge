/**
 * Test if NoInfer affects ResolveProperties
 */
import { ResolveProperties } from '@cli-forge/parser';

type Props = {
  readonly server: {
    readonly type: 'object';
    readonly properties: {
      readonly host: { readonly type: 'string'; readonly default: 'localhost' };
    };
  };
  readonly database: {
    readonly type: 'object';
    readonly properties: {
      readonly host: { readonly type: 'string'; readonly default: 'localhost' };
    };
  };
};

// Without NoInfer
type ResolvedWithout = ResolveProperties<Props>;
const test1: ResolvedWithout = { server: undefined, database: undefined };  // Should work

// With NoInfer
type ResolvedWith = ResolveProperties<NoInfer<Props>>;
const test2: ResolvedWith = { server: undefined, database: undefined };  // Should work?

// Force errors to see the types
// @ts-expect-error: Intentional error to see type
const _test1: ResolvedWithout = 'force error';
// @ts-expect-error: Intentional error to see type
const _test2: ResolvedWith = 'force error';
