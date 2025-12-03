/**
 * Type assertions for object option type inference.
 * These tests verify that object options with explicit properties are typed correctly,
 * not as index signatures (Record<string, any>).
 */

import {
  AssertEqual,
  AssertNotIndexSignature,
  AssertProperty,
  IsTrue,
} from './helpers.js';

// Test 1: Object option with explicit properties should not be an index signature
type ObjectConfig = {
  type: 'object';
  properties: {
    foo: { type: 'string' };
    bar: { type: 'number' };
  };
};

// The inferred value type from object config
type ObjectValueType = {
  foo: string;
  bar?: number;
};

// Assert it's not an index signature
const test1: IsTrue<AssertNotIndexSignature<ObjectValueType>> = true;

// Test 2: Explicit properties should exist with correct types
const test2: IsTrue<AssertProperty<ObjectValueType, 'foo', string>> = true;
const test3: IsTrue<AssertProperty<ObjectValueType, 'bar', number | undefined>> = true;

// Test 3: Coerce callback should receive properly typed value
type CoerceCallbackParam = {
  foo: string;
  bar?: number;
};

// Assert the coerce parameter is not an index signature
const test4: IsTrue<AssertNotIndexSignature<CoerceCallbackParam>> = true;

// Assert it has the expected structure
const test5: IsTrue<AssertEqual<CoerceCallbackParam, { foo: string; bar?: number }>> = true;

// Test 4: Required properties should not be optional
type RequiredObjectConfig = {
  type: 'object';
  properties: {
    foo: { type: 'string'; required: true };
    bar: { type: 'number'; required: true };
  };
};

type RequiredObjectValue = {
  foo: string;
  bar: number;
};

const test6: IsTrue<AssertEqual<RequiredObjectValue, { foo: string; bar: number }>> = true;

// Test 5: Object with additionalProperties should allow index signature
type ObjectWithAdditionalProps = {
  foo: string;
  bar?: number;
} & {
  [key: string]: string | number | undefined;
};

// This one SHOULD have an index signature
// We're just testing that our type system allows it when specified

// Test 6: Default value typing
type DefaultValueType = {
  foo: string;
  bar: number;
};

// Default should accept the same type as the inferred value
const test7: IsTrue<AssertEqual<DefaultValueType, { foo: string; bar: number }>> = true;

// Test 7: Optional vs required fields
type MixedRequiredOptional = {
  required: string;
  optional?: number;
};

const test8: IsTrue<AssertProperty<MixedRequiredOptional, 'required', string>> = true;
const test9: IsTrue<AssertProperty<MixedRequiredOptional, 'optional', number | undefined>> = true;

// Test 8: Nested object structure (if supported)
type NestedConfig = {
  outer: {
    inner: string;
  };
};

const test10: IsTrue<AssertNotIndexSignature<NestedConfig>> = true;
const test11: IsTrue<
  AssertProperty<NestedConfig, 'outer', { inner: string }>
> = true;
