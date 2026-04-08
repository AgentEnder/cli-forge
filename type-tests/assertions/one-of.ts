/**
 * Type assertions for oneOf option type inference.
 * Verifies that oneOf options produce the correct union types
 * from their valueTypes entries.
 */

import { parser } from '@cli-forge/parser';
import { AssertEqual, IsTrue } from './helpers.js';

// Test 1: oneOf [string, boolean] → string | boolean | undefined
const p1 = parser().option('color', {
  type: 'oneOf',
  valueTypes: [{ type: 'string' }, { type: 'boolean' }],
});
type T1 = ReturnType<typeof p1.parse>['color'];
const t1: IsTrue<AssertEqual<T1, string | boolean | undefined>> = true;

// Test 2: oneOf [number, boolean] → number | boolean | undefined
const p2 = parser().option('verbose', {
  type: 'oneOf',
  valueTypes: [{ type: 'number' }, { type: 'boolean' }],
});
type T2 = ReturnType<typeof p2.parse>['verbose'];
const t2: IsTrue<AssertEqual<T2, number | boolean | undefined>> = true;

// Test 3: oneOf [number, string] → number | string | undefined
const p3 = parser().option('port', {
  type: 'oneOf',
  valueTypes: [{ type: 'number' }, { type: 'string' }],
});
type T3 = ReturnType<typeof p3.parse>['port'];
const t3: IsTrue<AssertEqual<T3, number | string | undefined>> = true;

// Test 4: with default → no undefined
const p4 = parser().option('color', {
  type: 'oneOf',
  valueTypes: [{ type: 'string' }, { type: 'boolean' }],
  default: 'auto',
});
type T4 = ReturnType<typeof p4.parse>['color'];
const t4: IsTrue<AssertEqual<T4, string | boolean>> = true;

// Test 5: with required → no undefined
const p5 = parser().option('color', {
  type: 'oneOf',
  valueTypes: [{ type: 'string' }, { type: 'boolean' }],
  required: true,
});
type T5 = ReturnType<typeof p5.parse>['color'];
const t5: IsTrue<AssertEqual<T5, string | boolean>> = true;

// Test 6: choices narrowing on string entry
// Deferred until Task 5 adds a dedicated oneOf overload.
// The generic fallback overload doesn't correctly resolve the union when
// choices are present on individual valueType entries.
// After Task 5, this should assert:
//   'auto' | 'always' | 'never' | boolean | undefined

// Test 7: all three types (number, string, boolean)
const p7 = parser().option('level', {
  type: 'oneOf',
  valueTypes: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
});
type T7 = ReturnType<typeof p7.parse>['level'];
const t7: IsTrue<AssertEqual<T7, number | string | boolean | undefined>> = true;
