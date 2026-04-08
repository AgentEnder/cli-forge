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
const p6 = parser().option('color', {
  type: 'oneOf',
  valueTypes: [
    { type: 'string', choices: ['auto', 'always', 'never'] as const },
    { type: 'boolean' },
  ],
});
type T6 = ReturnType<typeof p6.parse>['color'];
const t6: IsTrue<AssertEqual<T6, 'auto' | 'always' | 'never' | boolean | undefined>> = true;

// Test 7: all three types (number, string, boolean)
const p7 = parser().option('level', {
  type: 'oneOf',
  valueTypes: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
});
type T7 = ReturnType<typeof p7.parse>['level'];
const t7: IsTrue<AssertEqual<T7, number | string | boolean | undefined>> = true;

// Test 8: coerce on string entry changes the union
const p8 = parser().option('val', {
  type: 'oneOf',
  valueTypes: [
    { type: 'string', coerce: (v: string) => v.length },
    { type: 'boolean' },
  ],
});
type T8 = ReturnType<typeof p8.parse>['val'];
const t8: IsTrue<AssertEqual<T8, number | boolean | undefined>> = true;

// Test 9: oneOf with other options preserves all types
const p9 = parser()
  .option('name', { type: 'string', required: true })
  .option('color', {
    type: 'oneOf',
    valueTypes: [{ type: 'string' }, { type: 'boolean' }],
    default: 'auto',
  });
type T9Name = ReturnType<typeof p9.parse>['name'];
type T9Color = ReturnType<typeof p9.parse>['color'];
const t9a: IsTrue<AssertEqual<T9Name, string>> = true;
const t9b: IsTrue<AssertEqual<T9Color, string | boolean>> = true;

// Test 10: choices narrowing + default (regression: distribution bug)
// Without distributive resolution, InferChoice from the string entry
// swallows the boolean entry entirely.
const p10 = parser().option('color', {
  type: 'oneOf',
  valueTypes: [
    { type: 'string', choices: ['auto', 'always', 'never'] as const },
    { type: 'boolean' },
  ],
  default: 'auto',
});
type T10 = ReturnType<typeof p10.parse>['color'];
const t10: IsTrue<AssertEqual<T10, 'auto' | 'always' | 'never' | boolean>> = true;
