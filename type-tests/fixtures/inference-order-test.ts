/**
 * Test to understand TypeScript's inference order
 */

import { parser } from '@cli-forge/parser';

// Test 1: What if we explicitly type the properties first?
const explicitProps = {
  foo: { type: 'string' as const },
  bar: { type: 'number' as const },
};

const test1 = parser()
  .option('config', {
    type: 'object',
    properties: explicitProps,
    coerce: (val) => {
      // What is val here?
      return val;
    },
  })
  .parse([]);

// Test 2: What if we use satisfies to constrain the config?
import type { ObjectOptionConfig } from '@cli-forge/parser';

const test2Config = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
  },
  coerce: (val: { foo: string | undefined }) => {
    // Explicit annotation
    return val;
  },
} satisfies ObjectOptionConfig<
  { foo: string | undefined },
  { foo: { type: 'string' } }
>;

const test2 = parser().option('config', test2Config).parse([]);

// Test 3: What if we define config separately with const assertion?
const test3Config = {
  type: 'object',
  properties: {
    foo: { type: 'string' },
  },
  coerce: (val: { foo: string | undefined }) => {
    return val;
  },
} as const;

const test3 = parser().option('config', test3Config).parse([]);

// Test 4: No coerce - does properties get inferred correctly?
const test4 = parser()
  .option('config', {
    type: 'object',
    properties: {
      foo: { type: 'string' },
    },
  })
  .parse([]);

// What type does test4.config have?
type Test4ConfigType = typeof test4.config;
