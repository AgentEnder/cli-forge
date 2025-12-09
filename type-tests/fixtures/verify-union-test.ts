/**
 * Verify the union type is correct
 */

type Config = { type: 'object' };
type Resolved = { host: string };

type WithOptionalInline<T, C> = C extends { required: true }
  ? T
  : C extends { default: unknown }
  ? T
  : T | undefined;

type Result = WithOptionalInline<Resolved, Config>;

// Can we assign undefined to Result?
const test1: Result = undefined; // This should work

// Can we assign Resolved to Result?
const test2: Result = { host: 'test' }; // This should work

// Result should be Resolved | undefined
type IsUnion = [Result] extends [Resolved | undefined]
  ? [Resolved | undefined] extends [Result]
    ? 'exact match'
    : 'Result is narrower'
  : 'Result is wider';

// @ts-expect-error: Force an error if IsUnion is not the expected type
const _isUnion: IsUnion = 'force error';
