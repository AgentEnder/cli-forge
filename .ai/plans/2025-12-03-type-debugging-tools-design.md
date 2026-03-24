# Type Debugging Tools Design

## Overview

A suite of CLI tools and programmatic APIs for debugging TypeScript type inference issues in cli-forge, specifically targeting object option type resolution problems.

## Problem Statement

Object options with explicit properties like `{ foo: { type: 'string' }, bar: { type: 'string' } }` are being inferred as `Record<string, string>` (index signature) instead of explicit property types. This causes:
- `coerce` callback parameters typed as `Record<string, string>` instead of `{ foo: string; bar: string | undefined }`
- `default` expecting wrong types
- IDE errors about properties coming from index signatures

## Solution

Three complementary debugging tools built with cli-forge itself:

1. **Type Trace Visualization** - Walk backwards through the type resolution chain and print each step
2. **Compile-Time Assertions** - Conditional types that produce readable compile errors on type mismatches
3. **Comparison Testing** - Compare inferred vs expected types with detailed diff output

## Project Structure

```
type-tests/
├── src/
│   ├── cli.ts                    # Main CLI entry point (built with cli-forge)
│   ├── commands/
│   │   ├── trace.ts              # Type trace visualization command
│   │   ├── assert.ts             # Run compile-time assertion tests
│   │   └── compare.ts            # Compare inferred vs expected types
│   ├── lib/
│   │   ├── api.ts                # Main programmatic API exports
│   │   ├── compiler.ts           # TS compiler setup utilities
│   │   ├── type-walker.ts        # Walk type structure recursively
│   │   ├── type-formatter.ts     # Format types as tree output
│   │   ├── resolution-chain.ts   # Track type resolution steps
│   │   └── compare.ts            # Type comparison logic
│   └── fixtures/                 # Test cases for the tools
│       └── object-option-test.ts
├── assertions/                   # Compile-time assertion test files
│   ├── helpers.ts                # Assertion utility types
│   └── object-types.ts           # Assertions for object option inference
├── package.json
└── tsconfig.json
```

## CLI Interface

```bash
# Trace type resolution using tsquery selector
npx type-debug trace ./fixtures/test.ts \
  --selector 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter'

# Run compile-time assertions
npx type-debug assert ./assertions/object-types.ts

# Compare inferred vs expected with trace on mismatch
npx type-debug compare ./fixtures/test.ts \
  --selector 'Parameter[name.text="val"]' \
  --expect '{ foo: string; bar: number | undefined }'
```

## Programmatic API

### Core Types

```typescript
export interface TraceOptions {
  file: string;
  selector: string;  // tsquery selector
  index?: number;    // Which match (0-based), defaults to 0
}

export interface TraceResult {
  location: { file: string; line: number; col: number };
  inferredType: string;
  chain: TraceNode[];
  warnings: string[];  // e.g., "TProperties widened to Record<string, any>"
}

export interface TraceNode {
  typeName: string;
  typeParameters?: Record<string, string>;
  resolvedTo: string;
  children: TraceNode[];
  isUnexpected?: boolean;
}

export interface CompareResult {
  match: boolean;
  actual: string;
  expected: string;
  differences: Difference[];
  trace?: TraceResult;  // Included when match: false
}

export interface Difference {
  path: string;           // e.g., "foo" or "nested.bar"
  kind: 'missing' | 'extra' | 'type_mismatch' | 'optionality';
  actual?: string;
  expected?: string;
}
```

### Functions

```typescript
// Core functions
export function traceTypeAt(options: TraceOptions): TraceResult;
export function compareTypes(options: CompareOptions): CompareResult;
export function runAssertions(assertionFile: string): AssertionResult[];

// Utilities for test fixtures
export function createTestProgram(code: string): { program: ts.Program; sourceFile: ts.SourceFile };
```

### Usage with vitest

```typescript
import { traceTypeAt, compareTypes } from '@cli-forge/type-tests';

describe('object option type inference', () => {
  it('should infer explicit properties, not Record<string, any>', () => {
    const result = traceTypeAt({
      file: './fixtures/object-coerce.ts',
      selector: 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter',
    });

    expect(result.inferredType).not.toContain('Record<string');
    expect(result.inferredType).toContain('foo: string');
    expect(result.warnings).toHaveLength(0);
  });

  it('should match expected type structure', () => {
    const result = compareTypes({
      file: './fixtures/test.ts',
      selector: 'Parameter[name.text="val"]',
      expected: '{ foo: string; bar: number | undefined }',
    });

    expect(result.match).toBe(true);
    expect(result.differences).toEqual([]);
  });
});
```

## tsquery Selectors

Common selectors for cli-forge type debugging:

```typescript
const selectors = {
  // The `val` parameter in any coerce callback
  coerceParam: 'PropertyAssignment[name.text="coerce"] > ArrowFunction > Parameter',

  // The return type of parser().option(...).parse()
  parseResult: 'CallExpression[expression.name.text="parse"]',

  // Object literal with type: 'object'
  objectConfig: 'ObjectLiteralExpression:has(PropertyAssignment[name.text="type"][initializer.text="\\"object\\""])',

  // The `properties` field value in object configs
  propertiesValue: 'PropertyAssignment[name.text="properties"] > ObjectLiteralExpression',
};
```

## Type Trace Output Format

Tree/indented format showing the resolution chain:

```
val: Record<string, string> & unknown
│
├─ ObjectValue<TProperties, TAdditionalProperties>
│  │
│  ├─ ResolveProperties<TProperties>
│  │  │
│  │  └─ TProperties = Record<string, any>  ⚠️ WIDENED
│  │     │
│  │     └─ Source: OptionConfig default type parameter
│  │        Expected: { foo: { type: 'string' }, bar: { type: 'number' } }
│  │
│  └─ AdditionalPropertiesType<false>
│     └─ unknown ✓
│
└─ InferCoerce<Config, BaseType<Config>>
   └─ No coerce return type found, fell back to BaseType
```

## Compile-Time Assertion Helpers

```typescript
// type-tests/assertions/helpers.ts

/**
 * Assert two types are exactly equal.
 */
export type AssertEqual<TActual, TExpected> =
  [TActual] extends [TExpected]
    ? [TExpected] extends [TActual]
      ? true
      : { error: "Type mismatch"; actual: TActual; expected: TExpected }
    : { error: "Type mismatch"; actual: TActual; expected: TExpected };

/**
 * Assert a type is NOT a Record/index signature.
 */
export type AssertNotIndexSignature<T> =
  string extends keyof T
    ? { error: "Unexpected index signature"; got: T }
    : true;

/**
 * Assert a specific property exists with exact type.
 */
export type AssertProperty<T, K extends string, TExpected> =
  K extends keyof T
    ? AssertEqual<T[K], TExpected>
    : { error: "Missing property"; property: K; on: T };
```

## Comparison Output with Trace on Mismatch

```
Comparing type at: PropertyAssignment[name.text="coerce"] > Parameter

Expected: { foo: string; bar: number | undefined }
Actual:   Record<string, string>

Differences:
  ✗ [root] Type mismatch
      Expected: object with explicit properties
      Actual:   index signature (Record<string, string>)

Type Resolution Trace:
─────────────────────────────────────────────────────────
val: Record<string, string> & unknown
│
├─ ObjectValue<TProperties, TAdditionalProperties>
│  ├─ ResolveProperties<TProperties>
│  │  └─ TProperties = Record<string, any>  ⚠️ WIDENED
│  └─ AdditionalPropertiesType<false>
│     └─ unknown ✓
```

## Dependencies

```json
{
  "name": "@cli-forge/type-tests",
  "private": true,
  "dependencies": {
    "@cli-forge/cli-forge": "workspace:*",
    "typescript": "^5.0.0",
    "@phenomnomnominal/tsquery": "^6.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

## Implementation Notes

1. **Compiler setup** - Reuse the project's existing `tsconfig.json` so type resolution matches real usage

2. **Type alias preservation** - Use `typeChecker.typeToString()` with `TypeFormatFlags.NoTruncation` to see full types

3. **Detecting widening** - Compare type parameter constraints vs actual inferred types to detect when `{ foo: ... }` becomes `Record<string, any>`

4. **Workspace integration** - Add to nx workspace as a buildable library
