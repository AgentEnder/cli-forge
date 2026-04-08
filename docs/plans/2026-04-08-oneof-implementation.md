# `oneOf` Option Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `oneOf` option type to cli-forge that allows a single CLI flag to accept values of multiple types (e.g., `--color` as boolean, `--color=always` as string).

**Architecture:** New `OneOfOptionConfig` type added to the parser's option-types system, with a dedicated `oneOfParser` that tries sub-parsers in priority order (non-boolean first, boolean last). Type inference produces a union of resolved types from each `valueTypes` entry. The CLI layer gets a new overload that mirrors the parser's.

**Tech Stack:** TypeScript, Vitest (unit tests), type-tests infrastructure (compile-time assertions)

**Design Doc:** `docs/plans/2026-04-08-oneof-option-type-design.md`

---

### Task 1: OneOf Option Type Definition

**Files:**
- Create: `packages/parser/src/lib/option-types/one-of.ts`
- Modify: `packages/parser/src/lib/option-types/option-config.ts:17-32`
- Modify: `packages/parser/src/lib/option-types/index.ts:1-18`

**Step 1: Create the OneOf type definition file**

Create `packages/parser/src/lib/option-types/one-of.ts`:

```typescript
import { CommonOptionConfig, Default } from './common';
import { StringOptionConfig } from './string';
import { NumberOptionConfig } from './number';
import { BooleanOptionConfig } from './boolean';
import { ArrayOptionConfig } from './array';
import { ResolveOptionType, WithOptional } from './type-resolution';

/**
 * Properties allowed on each entry in `valueTypes`.
 * These are the per-value-type properties (choices, coerce, validate,
 * description, deprecated) — everything else lives on the top-level config.
 */
type ValueTypeFields = 'type' | 'choices' | 'coerce' | 'validate' | 'description' | 'deprecated';

export type OneOfStringValueType<TCoerce = string, TChoices = TCoerce[]> = 
  Pick<StringOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

export type OneOfNumberValueType<TCoerce = number, TChoices = TCoerce[]> = 
  Pick<NumberOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

export type OneOfBooleanValueType<TCoerce = boolean, TChoices = TCoerce[]> = 
  Pick<BooleanOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

export type OneOfArrayValueType<TCoerce = string | number, TChoices = TCoerce[]> = 
  Pick<ArrayOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

/**
 * A single entry in the `valueTypes` array.
 */
export type OneOfValueTypeEntry =
  | OneOfStringValueType<any, any>
  | OneOfNumberValueType<any, any>
  | OneOfBooleanValueType<any, any>
  | OneOfArrayValueType<any, any>;

/**
 * Resolve the TypeScript type for a single valueTypes entry.
 * Uses the same ResolveOptionType logic as standalone options.
 */
export type ResolveOneOfEntry<T> = ResolveOptionType<T>;

/**
 * Resolve the union type for the entire `valueTypes` tuple.
 * Maps each entry to its resolved type and produces a union.
 */
export type ResolveOneOfValueTypes<T extends readonly OneOfValueTypeEntry[]> =
  ResolveOneOfEntry<T[number]>;

/**
 * Top-level properties for a oneOf option.
 * Excludes choices, coerce, validate (those are per-value-type).
 */
type OneOfTopLevelFields = Pick<
  CommonOptionConfig<any>,
  'positional' | 'alias' | 'env' | 'required' | 'hidden' | 'group' | 'description' | 'deprecated'
>;

/**
 * Configuration for a `oneOf` option that accepts multiple value types.
 *
 * Each entry in `valueTypes` defines a type the option can accept.
 * At parse time, non-boolean parsers are tried in array order; boolean
 * is always tried last (but has exclusive claim on bare flags, negation,
 * and the literals `true`/`false`).
 *
 * @typeParam TValueTypes Tuple of value type configs for type inference
 */
export type OneOfOptionConfig<
  TValueTypes extends readonly OneOfValueTypeEntry[] = readonly OneOfValueTypeEntry[]
> = OneOfTopLevelFields & {
  type: 'oneOf';
  valueTypes: TValueTypes;
  default?: Default<any>;
};
```

**Step 2: Add OneOf to the OptionConfig union**

In `packages/parser/src/lib/option-types/option-config.ts`, add:

After the existing imports (line 5), add:
```typescript
import { OneOfOptionConfig } from './one-of';
```

Add `OneOfOptionConfig` to the union at line 25 (before the closing semicolon):
```typescript
  | OneOfOptionConfig<any>;
```

Add `OneOfOptionConfig` to the JSDoc list (around line 8).

**Step 3: Export from index**

In `packages/parser/src/lib/option-types/index.ts`, add:
```typescript
export * from './one-of';
```

And add `OneOfOptionConfig` to `Internal<T>` handling — no change needed since `Internal<T>` uses `T & InternalOptionConfig` generically.

**Step 4: Run type check to verify no compilation errors**

Run: `npx nx run parser:build`
Expected: Build succeeds (the type is defined but not yet used by parsers)

**Step 5: Commit**

```
feat(parser): add OneOfOptionConfig type definition
```

---

### Task 2: Type Resolution for OneOf

**Files:**
- Modify: `packages/parser/src/lib/option-types/type-resolution.ts:62-93`
- Modify: `packages/parser/src/lib/option-types/option-config-to-type.ts:11-12`

**Step 1: Add oneOf to BaseType**

In `packages/parser/src/lib/option-types/type-resolution.ts`, the `BaseType` type (line 62) needs a new branch. Add before the final `: never`:

```typescript
  : T extends { type: 'oneOf'; valueTypes: infer V }
  ? V extends readonly { type: string }[]
    ? ResolveOptionType<V[number]>
    : never
```

This makes `BaseType` for a `oneOf` config resolve to the union of all its `valueTypes` entries' resolved types. Since each entry has a `type` field, `ResolveOptionType<V[number]>` distributes over the union of entries.

**Step 2: Verify OptionConfigToType still works**

`OptionConfigToType` calls `WithOptional<ResolveOptionType<T>, T>`. For `oneOf`, `ResolveOptionType` will:
1. Check `InferChoice<T>` — no `choices` on oneOf top-level, so `never`
2. Check `InferCoerce<T>` — no `coerce` on oneOf top-level, so falls through to `BaseType<T>`
3. `BaseType<T>` hits the new `oneOf` branch, resolves the union

This should work without changes to `option-config-to-type.ts`.

**Step 3: Run type check**

Run: `npx nx run parser:build`
Expected: Build succeeds

**Step 4: Commit**

```
feat(parser): add oneOf type resolution to BaseType
```

---

### Task 3: Type Tests for OneOf Inference

**Files:**
- Create: `type-tests/assertions/one-of.ts`
- Create: `type-tests/fixtures/one-of-basic.ts`
- Create: `type-tests/fixtures/one-of-choices.ts`
- Create: `type-tests/fixtures/one-of-coerce.ts`

**Step 1: Write basic type assertion tests**

Create `type-tests/assertions/one-of.ts`:

```typescript
import { parser } from '@cli-forge/parser';
import { AssertEqual, AssertProperty, IsTrue } from './helpers';

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

// Test 7: all three types
const p7 = parser().option('level', {
  type: 'oneOf',
  valueTypes: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }],
});
type T7 = ReturnType<typeof p7.parse>['level'];
const t7: IsTrue<AssertEqual<T7, number | string | boolean | undefined>> = true;
```

**Step 2: Run the type tests**

Run: `npx nx test type-tests`
Expected: FAIL — the type assertions won't compile because `oneOf` isn't yet recognized by the option overloads. This is expected and will be fixed in Task 5 when we add the overloads.

Actually — the assertions use `parser()` directly which uses the implementation signature. Let's check if the generic fallback overload handles it. If `OptionConfig` includes `OneOfOptionConfig`, the fallback overload should work.

Run: `npx nx test type-tests`
Expected: The tests should compile and pass if the OptionConfig union and BaseType changes from Tasks 1-2 are in place. If they fail, investigate the type resolution chain.

**Step 3: Commit**

```
test(parser): add type assertions for oneOf option inference
```

---

### Task 4: OneOf Parser

**Files:**
- Create: `packages/parser/src/lib/parsers/one-of.ts`
- Modify: `packages/parser/src/lib/parsers/parser-map.ts:1-14`

**Step 1: Write unit tests for oneOf parsing**

Add to `packages/parser/src/lib/parser.spec.ts` — a new `describe('oneOf options', ...)` block:

```typescript
describe('oneOf options', () => {
  it('should parse string value for oneOf [string, boolean]', () => {
    const result = parser()
      .option('color', {
        type: 'oneOf',
        valueTypes: [{ type: 'string' }, { type: 'boolean' }],
      })
      .parse(['--color', 'always']);
    expect(result.color).toBe('always');
  });

  it('should parse bare flag as true for oneOf with boolean', () => {
    const result = parser()
      .option('color', {
        type: 'oneOf',
        valueTypes: [{ type: 'string' }, { type: 'boolean' }],
      })
      .parse(['--color']);
    expect(result.color).toBe(true);
  });

  it('should parse --no-flag as false for oneOf with boolean', () => {
    const result = parser()
      .option('color', {
        type: 'oneOf',
        valueTypes: [{ type: 'string' }, { type: 'boolean' }],
      })
      .parse(['--no-color']);
    expect(result.color).toBe(false);
  });

  it('should parse true/false literals as boolean when boolean is in valueTypes', () => {
    const p = parser().option('color', {
      type: 'oneOf',
      valueTypes: [{ type: 'string' }, { type: 'boolean' }],
    });
    expect(p.parse(['--color', 'true']).color).toBe(true);
    expect(p.parse(['--color', 'false']).color).toBe(false);
  });

  it('should error on bare flag when boolean is not in valueTypes', () => {
    expect(() =>
      parser()
        .option('port', {
          type: 'oneOf',
          valueTypes: [{ type: 'number' }, { type: 'string' }],
        })
        .parse(['--port'])
    ).toThrow();
  });

  it('should error on --no-flag when boolean is not in valueTypes', () => {
    expect(() =>
      parser()
        .option('port', {
          type: 'oneOf',
          valueTypes: [{ type: 'number' }, { type: 'string' }],
        })
        .parse(['--no-port'])
    ).toThrow();
  });

  it('should try non-boolean parsers in array order', () => {
    const result = parser()
      .option('val', {
        type: 'oneOf',
        valueTypes: [{ type: 'number' }, { type: 'string' }],
      })
      .parse(['--val', '42']);
    expect(result.val).toBe(42);
  });

  it('should fall through to string when number fails', () => {
    const result = parser()
      .option('val', {
        type: 'oneOf',
        valueTypes: [{ type: 'number' }, { type: 'string' }],
      })
      .parse(['--val', 'hello']);
    expect(result.val).toBe('hello');
  });

  it('should apply per-value-type choices', () => {
    expect(() =>
      parser()
        .option('color', {
          type: 'oneOf',
          valueTypes: [
            { type: 'string', choices: ['auto', 'always', 'never'] },
            { type: 'boolean' },
          ],
        })
        .parse(['--color', 'invalid'])
    ).toThrow(/Invalid value/);
  });

  it('should apply per-value-type coerce on matched type', () => {
    const result = parser()
      .option('val', {
        type: 'oneOf',
        valueTypes: [
          { type: 'string', coerce: (v: string) => v.toUpperCase() },
          { type: 'boolean' },
        ],
      })
      .parse(['--val', 'hello']);
    expect(result.val).toBe('HELLO');
  });

  it('should use default value', () => {
    const result = parser()
      .option('color', {
        type: 'oneOf',
        valueTypes: [{ type: 'string' }, { type: 'boolean' }],
        default: 'auto',
      })
      .parse([]);
    expect(result.color).toBe('auto');
  });

  it('should work with = syntax', () => {
    const result = parser()
      .option('color', {
        type: 'oneOf',
        valueTypes: [{ type: 'string' }, { type: 'boolean' }],
      })
      .parse(['--color=always']);
    expect(result.color).toBe('always');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx nx test parser -- --testPathPattern parser.spec`
Expected: FAIL — `No parser found for option ... with type oneOf`

**Step 3: Implement the oneOf parser**

Create `packages/parser/src/lib/parsers/one-of.ts`:

```typescript
import { OneOfOptionConfig, OneOfValueTypeEntry } from '../option-types/one-of';
import { Internal, InternalOptionConfig } from '../option-types';
import { Parser, ParserContext, NoValueError } from './typings';
import { parserMap } from './parser-map';

export const oneOfParser: Parser<Internal<OneOfOptionConfig<any>>> = (
  input: ParserContext<Internal<OneOfOptionConfig<any>>>
) => {
  const { config, tokens, providedFlag } = input;
  const valueTypes = config.valueTypes;

  const hasBooleanType = valueTypes.some(
    (vt: OneOfValueTypeEntry) => vt.type === 'boolean'
  );
  const isNegated = providedFlag?.startsWith('--no-');
  const nextToken = tokens[0];

  // Boolean-exclusive cases: bare flag, negation, true/false literals
  if (hasBooleanType) {
    // --no-flag → false
    if (isNegated) {
      // Consume true/false literal if present (--no-flag true → false, --no-flag false → true)
      if (nextToken === 'true' || nextToken === 'false') {
        tokens.shift();
        const parsed = nextToken === 'true';
        return !parsed;
      }
      return false;
    }

    // --flag true / --flag false → boolean
    if (nextToken === 'true' || nextToken === 'false') {
      tokens.shift();
      return nextToken === 'true';
    }

    // --flag (bare, no next token or next token is a flag)
    if (nextToken === undefined || nextToken.startsWith('-')) {
      return true;
    }
  } else {
    // No boolean type — negation and bare flags are errors
    if (isNegated) {
      throw new NoValueError();
    }
  }

  // Try non-boolean parsers in array order
  const nonBooleanTypes = valueTypes.filter(
    (vt: OneOfValueTypeEntry) => vt.type !== 'boolean'
  );

  for (const valueType of nonBooleanTypes) {
    const subParser = parserMap[valueType.type];
    if (!subParser) continue;

    // Save token position to restore on failure
    const savedTokens = [...tokens];
    try {
      const result = subParser({
        config: { ...config, ...valueType, key: config.key } as InternalOptionConfig,
        tokens,
        current: input.current,
        providedFlag,
      });

      // For number parser: check if the result is NaN (invalid number)
      if (valueType.type === 'number' && isNaN(result as number)) {
        // Restore tokens and try next parser
        tokens.length = 0;
        tokens.push(...savedTokens);
        continue;
      }

      return result;
    } catch {
      // Restore tokens and try next parser
      tokens.length = 0;
      tokens.push(...savedTokens);
    }
  }

  // No parser matched — if boolean is available, fall back to it (bare flag)
  if (hasBooleanType) {
    return true;
  }

  throw new NoValueError();
};
```

**Step 4: Register in parser-map**

In `packages/parser/src/lib/parsers/parser-map.ts`, add:

After the existing imports (line 5):
```typescript
import { oneOfParser } from './one-of';
```

Add to the `parserMap` object (before the closing brace):
```typescript
  oneOf: oneOfParser,
```

**Step 5: Handle oneOf coerce/validate in tryParseValue and validateOption**

The existing `tryParseValue` (parser.ts:1150) applies `config.coerce` after parsing. For `oneOf`, coerce is per-value-type, not on the top-level config, so we need special handling.

In `packages/parser/src/lib/parser.ts`, modify `tryParseValue` (around line 1160-1167):

The current code:
```typescript
    const val = parser(input);
    // For object types, defer coerce until after nested defaults are applied
    // For other types, apply coerce immediately
    if (input.config.type === 'object') {
      return val;
    }
    return (input.config.coerce as (s: any) => any)?.(val) ?? val;
```

Replace with:
```typescript
    const val = parser(input);
    // For object types, defer coerce until after nested defaults are applied
    // For other types, apply coerce immediately
    if (input.config.type === 'object') {
      return val;
    }
    // For oneOf types, coerce is per-value-type and handled inside the parser
    if (input.config.type === 'oneOf') {
      return val;
    }
    return (input.config.coerce as (s: any) => any)?.(val) ?? val;
```

Then update the oneOf parser to handle per-value-type coerce internally. After the successful `subParser` call (before `return result;`):

```typescript
      // Apply per-value-type coerce if defined
      if (valueType.coerce) {
        return (valueType.coerce as (v: any) => any)(result);
      }
      return result;
```

**Step 6: Handle per-value-type validate/choices in validateAndNormalizeResults**

In `packages/parser/src/lib/parser.ts`, inside `validateAndNormalizeResults` (around line 821-845), after the `validateOption` call, add handling for `oneOf` — but actually, the current `validateOption` checks `choices` and `validate` on the config. For `oneOf`, these are per-value-type. We need to handle this differently.

The simplest approach: in the oneOf parser, after finding the matching sub-parser and getting the result, apply that value type's `choices` and `validate` inline. This keeps the validation close to the matching logic.

Update the oneOf parser's successful match block to:
```typescript
      // Apply per-value-type choices validation
      if ('choices' in valueType && valueType.choices) {
        const choices = typeof valueType.choices === 'function' 
          ? valueType.choices() 
          : valueType.choices;
        if (Array.isArray(choices) && !choices.includes(result)) {
          // Restore tokens and try next parser
          tokens.length = 0;
          tokens.push(...savedTokens);
          continue;
        }
      }

      // Apply per-value-type coerce
      const coerced = valueType.coerce 
        ? (valueType.coerce as (v: any) => any)(result) 
        : result;

      // Apply per-value-type validate
      if (valueType.validate) {
        const validationResult = (valueType.validate as (v: any) => boolean | string)(coerced);
        if (validationResult === false || typeof validationResult === 'string') {
          tokens.length = 0;
          tokens.push(...savedTokens);
          continue;
        }
      }

      return coerced;
```

**Step 7: Run tests**

Run: `npx nx test parser -- --testPathPattern parser.spec`
Expected: All oneOf tests PASS

**Step 8: Commit**

```
feat(parser): implement oneOf parser with priority resolution
```

---

### Task 5: Parser Option Overload for OneOf

**Files:**
- Modify: `packages/parser/src/lib/parser.ts:244-336` (option overloads)
- Modify: `packages/parser/src/lib/parser.ts:1-49` (imports)

**Step 1: Add the oneOf option overload to ArgvParser**

In `packages/parser/src/lib/parser.ts`, add an import for `OneOfOptionConfig` and `ResolveOneOfValueTypes` (at the import block, around line 17-27):

```typescript
import {
  // ...existing imports...
  OneOfOptionConfig,
} from './option-types';
```

And import `ResolveOneOfValueTypes` from the one-of module:
```typescript
import { ResolveOneOfValueTypes, OneOfValueTypeEntry } from './option-types/one-of';
```

Add a new overload BEFORE the generic fallback overload (before line 324):

```typescript
  // OneOf option overload
  option<
    TOption extends string,
    const TValueTypes extends readonly OneOfValueTypeEntry[]
  >(
    name: TOption,
    config: OneOfOptionConfig<TValueTypes>
  ): ArgvParser<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          ResolveOneOfValueTypes<TValueTypes>,
          OneOfOptionConfig<TValueTypes>
        >;
      }>
  >;
```

**Step 2: Run type tests to verify inference**

Run: `npx nx test type-tests`
Expected: The assertions from Task 3 should now compile and pass.

**Step 3: Commit**

```
feat(parser): add oneOf option overload with union type inference
```

---

### Task 6: Handle oneOf in get-configured-key for --no- prefix

**Files:**
- Modify: `packages/parser/src/lib/utils/get-configured-key.ts:31-48`

**Step 1: Write a test for --no-flag with oneOf**

This is already covered by the unit test in Task 4 (`should parse --no-flag as false for oneOf with boolean`). The current `getConfiguredOptionKey` only checks `config?.type === 'boolean'` for negation alias matching (line 46). It needs to also check for `oneOf` configs that contain a boolean valueType.

**Step 2: Update getConfiguredOptionKey**

In `packages/parser/src/lib/utils/get-configured-key.ts`, the alias loop (lines 40-49) checks:
```typescript
if (config?.type === 'boolean' && config.alias?.includes(normalizedKey)) {
```

Change this to also handle `oneOf`:
```typescript
    const hasBooleanType = config?.type === 'boolean' || 
      (config?.type === 'oneOf' && 
        (config as any).valueTypes?.some((vt: any) => vt.type === 'boolean'));
    if (hasBooleanType && config.alias?.includes(normalizedKey)) {
```

Also, the normalizedKey logic at line 32-38 only applies negation normalization unconditionally, but the key lookup at line 36 will find oneOf options because the key matches. However, the boolean alias check needs the fix above.

**Step 3: Run parser tests**

Run: `npx nx test parser -- --testPathPattern parser.spec`
Expected: PASS — including the --no- oneOf tests

**Step 4: Commit**

```
fix(parser): handle --no- prefix for oneOf options with boolean valueType
```

---

### Task 7: CLI Layer OneOf Overload

**Files:**
- Modify: `packages/cli-forge/src/lib/public-api.ts:465-566` (option overloads)
- Modify: `packages/cli-forge/src/lib/public-api.ts:2-22` (imports)

**Step 1: Add imports**

In `packages/cli-forge/src/lib/public-api.ts`, add to the parser imports:
```typescript
import { OneOfOptionConfig, OneOfValueTypeEntry, ResolveOneOfValueTypes } from '@cli-forge/parser';
```

Note: these should already be re-exported from `@cli-forge/parser`'s index since we exported from `option-types/index.ts`.

**Step 2: Add the oneOf overload**

Add before the generic fallback overload (before line 551):

```typescript
  // OneOf option overload
  option<
    TOption extends string,
    const TValueTypes extends readonly OneOfValueTypeEntry[]
  >(
    name: TOption,
    config: OneOfOptionConfig<TValueTypes> & { prompt?: PromptOptionConfig<TArgs>; completion?: OptionCompletionCallback<TArgs> }
  ): CLI<
    TArgs &
      MakeUndefinedPropertiesOptional<{
        [key in TOption]: WithOptional<
          ResolveOneOfValueTypes<TValueTypes>,
          OneOfOptionConfig<TValueTypes>
        >;
      }>,
    THandlerReturn,
    TChildren,
    TParent
  >;
```

**Step 3: Verify build**

Run: `npx nx build cli-forge`
Expected: Build succeeds

**Step 4: Commit**

```
feat(cli-forge): add oneOf option overload to CLI interface
```

---

### Task 8: Help Text Formatting for OneOf

**Files:**
- Modify: `packages/cli-forge/src/lib/format-help.ts:106-127`

**Step 1: Write a test (manual verification)**

We'll verify help text output via the existing e2e example in Task 10. For now, update the formatter to handle oneOf.

**Step 2: Update getOptionParts for oneOf**

In `packages/cli-forge/src/lib/format-help.ts`, modify `getOptionParts` (line 106):

```typescript
function getOptionParts(option: UnknownOptionConfig) {
  const parts = [];
  if (option.description) {
    parts.push(option.description);
  }
  if (option.type === 'oneOf' && 'valueTypes' in option) {
    const valueTypes = (option as any).valueTypes as Array<{ type: string; choices?: any; description?: string }>;
    const typeNames = valueTypes.map((vt) => vt.type).join('|');
    parts.push(`[${typeNames}]`);
    // Add per-value-type details
    for (const vt of valueTypes) {
      const subParts: string[] = [];
      if (vt.description) {
        subParts.push(vt.description);
      }
      if (vt.choices) {
        const choices = typeof vt.choices === 'function' ? vt.choices() : vt.choices;
        subParts.push(`(${choices.join(', ')})`);
      }
      // Only add if there's meaningful content
      if (subParts.length > 0) {
        parts.push(`${vt.type}: ${subParts.join(' ')}`);
      }
    }
  } else if ('choices' in option && option.choices) {
    const choices =
      typeof option.choices === 'function' ? option.choices() : option.choices;
    parts.push(`(${choices.join(', ')})`);
  }
  if (option.default) {
    parts.push(
      '[default: ' + formatDefaultValue(readDefaultValue(option)) + ']'
    );
  } else if (option.required) {
    parts.push('[required]');
  }
  if (option.deprecated) {
    parts.push('[deprecated: ' + option.deprecated + ']');
  }
  return parts;
}
```

**Step 3: Run build**

Run: `npx nx build cli-forge`
Expected: Build succeeds

**Step 4: Commit**

```
feat(cli-forge): add oneOf support to help text formatting
```

---

### Task 9: Additional Type Tests

**Files:**
- Modify: `type-tests/assertions/one-of.ts` (add more cases)

**Step 1: Add coerce type inference tests**

Append to `type-tests/assertions/one-of.ts`:

```typescript
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
```

**Step 2: Run type tests**

Run: `npx nx test type-tests`
Expected: PASS

**Step 3: Commit**

```
test(parser): add coerce and composition type tests for oneOf
```

---

### Task 10: E2E Example

**Files:**
- Create: `examples/one-of-option.ts`

**Step 1: Create the example**

Create `examples/one-of-option.ts`:

```typescript
// ---
// id: one-of-option
// title: OneOf Option
// description: |
//   Demonstrates the `oneOf` option type, which allows a single flag
//   to accept multiple value types. This is useful for flags like
//   `--color` that can be a boolean toggle or accept specific string values.
// tags:
//   - options
//   - oneOf
// commands:
//   - command: '{filename} --color always'
//     assertions:
//       - contains: 'Color mode: always'
//   - command: '{filename} --color'
//     assertions:
//       - contains: 'Color mode: true'
//   - command: '{filename} --no-color'
//     assertions:
//       - contains: 'Color mode: false'
//   - command: '{filename}'
//     assertions:
//       - contains: 'Color mode: auto'
// ---

import { cli } from 'cli-forge';

cli('color-demo')
  .option('color', {
    type: 'oneOf',
    valueTypes: [
      { type: 'string', choices: ['auto', 'always', 'never'] as const },
      { type: 'boolean' },
    ],
    default: 'auto',
    description: 'When to use colors in output',
  })
  .handler((args) => {
    console.log(`Color mode: ${args.color}`);
  })
  .forge();
```

**Step 2: Run the e2e tests**

Run: `npx nx run e2e:e2e:examples`
Expected: The oneOf example assertions all PASS

**Step 3: Commit**

```
docs(cli-forge): add oneOf option example
```

---

### Task 11: Final Verification

**Step 1: Run all tests**

Run: `npx nx run-many -t test`
Expected: All tests pass

**Step 2: Run all builds**

Run: `npx nx run-many -t build`
Expected: All builds succeed

**Step 3: Run e2e**

Run: `npx nx run e2e:e2e:examples`
Expected: All examples pass

**Step 4: Final commit (if any fixes needed)**

Only if earlier steps required adjustments.
