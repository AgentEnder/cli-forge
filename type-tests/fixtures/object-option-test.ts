/**
 * Test fixture for debugging object option type inference.
 * This file demonstrates the type inference issues we're trying to diagnose.
 */

import { parser } from '@cli-forge/parser';

// Test 1: Basic object option with explicit properties
// Expected: coerce callback should receive { foo: string; bar: string | undefined }
// Actual issue: may receive Record<string, string>
export const test1 = parser()
  .option('config', {
    type: 'object',
    properties: {
      foo: { type: 'string', required: true },
      bar: { type: 'string' },
    },
    coerce: (val) => {
      // The `val` parameter type is what we want to inspect
      // It should be: { foo: string; bar: string | undefined }
      // Bug: It might be: Record<string, string>
      return {
        ...val,
        processed: true,
      };
    },
  })
  .parse([]);

// Test 2: Object option with nested properties
export const test2 = parser()
  .option('nested', {
    type: 'object',
    properties: {
      host: { type: 'string', required: true },
      port: { type: 'number', default: 3000 },
    },
  })
  .parse([]);

// Test 3: Object with default value
export const test3 = parser()
  .option('settings', {
    type: 'object',
    properties: {
      debug: { type: 'boolean', default: false },
      verbose: { type: 'boolean' },
    },
    default: {
      debug: false,
    },
  })
  .parse([]);

// Access points for type debugging:
// Use selectors like:
//   'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter'
// to find the coerce callback parameter and inspect its type.
