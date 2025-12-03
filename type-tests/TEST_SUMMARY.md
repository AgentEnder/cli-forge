# Type Trace Implementation Summary

## Files Created

### 1. `/Users/agentender/repos/cli-forge/type-tests/src/lib/resolution-chain.ts`
**Purpose**: Build resolution chains from TypeScript types

**Key Exports**:
- `TraceResult` interface - Complete trace result with location, type string, chain, and warnings
- `buildResolutionChain(type, typeChecker, node)` - Main function to build resolution chain from a type
- `getNodeLocation(node)` - Helper to extract file location from an AST node

**Features**:
- Walks type structure and builds TraceNode tree
- Detects widening issues (e.g., explicit properties becoming Record<string, any>)
- Generates warnings for:
  - Index signatures with `any` value type
  - Record<string, any> patterns
  - Types inferred as `any`
  - Mixed explicit properties and index signatures
- Extracts location information (file, line, column)

### 2. `/Users/agentender/repos/cli-forge/type-tests/src/lib/trace.ts`
**Purpose**: Main trace API for programmatic use

**Key Exports**:
- `TraceOptions` interface - Configuration for tracing
- `traceTypeAt(options)` - Trace type at a single selector match
- `traceAllTypesAt(options)` - Trace types at all selector matches

**Features**:
- Creates TypeScript program from file
- Finds nodes using tsquery selectors
- Gets types at various node kinds (parameters, identifiers, expressions, etc.)
- Builds and returns resolution chains
- Comprehensive error messages

### 3. `/Users/agentender/repos/cli-forge/type-tests/src/commands/trace.ts`
**Purpose**: CLI command implementation using cli-forge

**Key Exports**:
- `traceCommand` - Complete CLI command configuration
- `withTraceArgs<T>()` - Argument builder function

**CLI Options**:
- `--file/-f` (required) - Path to TypeScript file to analyze
- `--selector/-s` (required) - tsquery selector to find AST node
- `--index/-i` (optional, default: 0) - Which match to trace
- `--all/-a` (optional, default: false) - Trace all matches

**Output Format**:
```
Location: /path/to/file.ts:10:5

Inferred Type: Record<string, string> & unknown

Type Resolution Chain:
Record<string, string> & unknown
│
├─ ObjectValue<TProperties, TAdditionalProperties>
│  │
│  ├─ ResolveProperties<TProperties>
│  │  └─ TProperties = Record<string, any>  ⚠️ WIDENED
│  │
│  └─ AdditionalPropertiesType<false>
│     └─ unknown ✓

Warnings:
  ⚠️  Type has both explicit properties and index signature [string]: any
```

## Updated Files

### `/Users/agentender/repos/cli-forge/type-tests/src/cli.ts`
- Added import and registration of `traceCommand`
- Fixed import path to use 'cli-forge' instead of '@cli-forge/cli-forge'

### `/Users/agentender/repos/cli-forge/type-tests/src/lib/index.ts`
- Exported trace API functions and types
- Exported resolution chain functions
- Exported type formatter functions

### `/Users/agentender/repos/cli-forge/type-tests/package.json`
- Added `cli-forge` dependency
- Added `@cli-forge/parser` dependency
- Added `tslib` dependency
- Added `@phenomnomnominal/tsquery` dependency

## API Usage Examples

### Programmatic API

```typescript
import { traceTypeAt } from '@cli-forge/type-tests';

// Trace a single location
const result = traceTypeAt({
  file: '/path/to/file.ts',
  selector: 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter',
  index: 0
});

console.log(result.inferredType);
// => "Record<string, string> & unknown"

console.log(result.warnings);
// => ["Type has both explicit properties and index signature..."]

console.log(result.location);
// => { file: '/path/to/file.ts', line: 42, col: 10 }

// Trace all matches
import { traceAllTypesAt } from '@cli-forge/type-tests';

const results = traceAllTypesAt({
  file: '/path/to/file.ts',
  selector: 'Parameter'
});

results.forEach((result, i) => {
  console.log(`Match ${i}: ${result.inferredType}`);
});
```

### CLI Usage

```bash
# Trace a single match
npx type-debug trace --file ./test.ts --selector "Parameter[name.text=\"val\"]"

# Trace with index
npx type-debug trace -f ./test.ts -s "Parameter" --index 2

# Trace all matches
npx type-debug trace --file ./test.ts --selector "Parameter" --all

# Example with object option coerce parameter
npx type-debug trace \
  --file ./examples/object-arguments/object-notation-cli.ts \
  --selector 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter'
```

## Integration with Design Doc

This implementation follows the design specification in `/Users/agentender/repos/cli-forge/docs/plans/2025-12-03-type-debugging-tools-design.md`:

1. **Type Trace Visualization** ✅
   - Walks backwards through type resolution chain
   - Prints each step in formatted tree output
   - Detects and warns about widening issues

2. **TraceResult Interface** ✅
   - Matches spec exactly with location, inferredType, chain, and warnings

3. **TraceNode Interface** ✅
   - Matches spec with typeName, typeParameters, resolvedTo, children, isUnexpected, warning

4. **CLI Interface** ✅
   - Implements trace command with file, selector, index, and all options
   - Provides formatted output with tree visualization

## Next Steps

To complete the type-tests package, you'll need to:

1. **Resolve build dependencies**:
   - Ensure pnpm can access all catalog dependencies
   - The local registry at localhost:4874 may need to be started, or registry settings adjusted

2. **Test the implementation**:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { traceTypeAt } from '../lib/trace';

   describe('trace', () => {
     it('should trace object option types', () => {
       const result = traceTypeAt({
         file: './fixtures/object-coerce.ts',
         selector: 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter',
       });

       expect(result.inferredType).toContain('foo');
       expect(result.warnings).toHaveLength(0);
     });
   });
   ```

3. **Add the remaining commands** (from design doc):
   - `assert` command - Already exists
   - `compare` command - Appears to exist based on linter feedback

## Files Structure

```
type-tests/
├── src/
│   ├── cli.ts                    ✅ Updated with trace command
│   ├── commands/
│   │   ├── trace.ts              ✅ NEW - Type trace visualization command
│   │   ├── assert.ts             ✅ Exists
│   │   └── compare.ts            ✅ Exists (based on imports in cli.ts)
│   └── lib/
│       ├── index.ts              ✅ Updated with new exports
│       ├── compiler.ts           ✅ Exists
│       ├── type-walker.ts        ✅ Exists
│       ├── type-formatter.ts     ✅ Exists
│       ├── query.ts              ✅ Exists
│       ├── resolution-chain.ts   ✅ NEW - Track type resolution steps
│       └── trace.ts              ✅ NEW - Main trace API
└── package.json                  ✅ Updated with dependencies
```

All requested files have been created and the API is complete according to the specification.
