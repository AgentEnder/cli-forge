/**
 * Type assertions for array option choices type inference.
 * Verifies that choices on array options narrow the element type,
 * not the entire option type.
 */

import { OptionConfigToType } from '@cli-forge/parser';
import { AssertEqual, IsTrue } from './helpers.js';

// Test 1: String array with choices should resolve to ('a' | 'b' | 'c')[]
type StringArrayWithChoices = OptionConfigToType<{
  type: 'array';
  items: 'string';
  choices: readonly ['a', 'b', 'c'];
}>;
const test1: IsTrue<AssertEqual<StringArrayWithChoices, ('a' | 'b' | 'c')[]>> =
  true;

// Test 2: Number array with choices should resolve to (1 | 2 | 3)[]
type NumberArrayWithChoices = OptionConfigToType<{
  type: 'array';
  items: 'number';
  choices: readonly [1, 2, 3];
}>;
const test2: IsTrue<AssertEqual<NumberArrayWithChoices, (1 | 2 | 3)[]>> = true;

// Test 3: Required string array with choices should not include undefined
type RequiredStringArrayWithChoices = OptionConfigToType<{
  type: 'array';
  items: 'string';
  choices: readonly ['json', 'yaml'];
  required: true;
}>;
const test3: IsTrue<
  AssertEqual<RequiredStringArrayWithChoices, ('json' | 'yaml')[]>
> = true;

// Test 4: String array with choices and default should not include undefined
type StringArrayWithChoicesAndDefault = OptionConfigToType<{
  type: 'array';
  items: 'string';
  choices: readonly ['a', 'b'];
  default: readonly ['a'];
}>;
const test4: IsTrue<
  AssertEqual<StringArrayWithChoicesAndDefault, ('a' | 'b')[]>
> = true;

// Test 5: String array WITHOUT choices should still be string[]
type PlainStringArray = OptionConfigToType<{
  type: 'array';
  items: 'string';
}>;
const test5: IsTrue<AssertEqual<PlainStringArray, string[] | undefined>> = true;

// Test 6: Optional string array with choices should include undefined
type OptionalStringArrayWithChoices = OptionConfigToType<{
  type: 'array';
  items: 'string';
  choices: readonly ['x', 'y'];
}>;
const test6: IsTrue<
  AssertEqual<OptionalStringArrayWithChoices, ('x' | 'y')[] | undefined>
> = true;
