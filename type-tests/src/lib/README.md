# Type-Tests Library - Core Utilities

Core TypeScript compiler utilities for debugging type inference issues in cli-forge.

## Overview

This library provides three main utilities:

1. **compiler.ts** - TypeScript program creation and configuration
2. **type-walker.ts** - Recursive type structure analysis
3. **query.ts** - AST node selection using tsquery

## API Reference

### Compiler Utilities (`compiler.ts`)

#### `createProgramFromFile(filePath: string): ProgramResult`

Create a TypeScript program from a source file on disk. Uses the project's tsconfig.json for accurate type resolution.

```typescript
import { createProgramFromFile } from '@cli-forge/type-tests';

const { program, typeChecker, sourceFile } = createProgramFromFile(
  '/path/to/file.ts'
);
```

**Parameters:**
- `filePath` - Absolute path to the TypeScript file

**Returns:**
- `program` - TypeScript Program instance
- `typeChecker` - TypeScript TypeChecker instance
- `sourceFile` - The loaded source file

**Throws:**
- Error if file doesn't exist
- Error if tsconfig.json not found
- Error if path is not absolute

---

#### `createTestProgram(code: string, fileName?: string): ProgramResult`

Create an in-memory TypeScript program from a code string. Useful for testing and quick analysis.

```typescript
import { createTestProgram } from '@cli-forge/type-tests';

const code = `
  interface User {
    name: string;
    age: number;
  }
`;

const { typeChecker, sourceFile } = createTestProgram(code);
```

**Parameters:**
- `code` - TypeScript code string to analyze
- `fileName` - Virtual file name (default: `'__test__.ts'`)

**Returns:**
- Same as `createProgramFromFile`

---

#### `findTsConfig(fromPath: string): string | undefined`

Find tsconfig.json by walking up the directory tree from the given path.

```typescript
import { findTsConfig } from '@cli-forge/type-tests';

const configPath = findTsConfig('/path/to/src/file.ts');
// Returns: '/path/to/tsconfig.json'
```

**Parameters:**
- `fromPath` - Starting path (file or directory)

**Returns:**
- Path to tsconfig.json or `undefined` if not found

---

### Type Walker (`type-walker.ts`)

#### `walkType(type: ts.Type, typeChecker: ts.TypeChecker, depth?: number): TypeNode`

Recursively walk a TypeScript type and build a tree representation.

```typescript
import { walkType } from '@cli-forge/type-tests';
import * as ts from 'typescript';

const { typeChecker, sourceFile } = createTestProgram(`
  interface Config {
    host: string;
    port: number;
  }
`);

const interfaceDecl = sourceFile.statements.find(ts.isInterfaceDeclaration);
const type = typeChecker.getTypeAtLocation(interfaceDecl);

const typeTree = walkType(type, typeChecker);
console.log(typeTree);
// {
//   kind: 'object',
//   name: 'Config',
//   typeString: 'Config',
//   properties: [
//     { name: 'host', type: { kind: 'string', ... }, isOptional: false, isReadonly: false },
//     { name: 'port', type: { kind: 'number', ... }, isOptional: false, isReadonly: false }
//   ]
// }
```

**Parameters:**
- `type` - TypeScript type to walk
- `typeChecker` - TypeScript type checker
- `depth` - Maximum recursion depth (default: 10)

**Returns:**
- `TypeNode` - Tree representation of the type

**TypeNode Structure:**
```typescript
interface TypeNode {
  kind: string;              // 'string', 'object', 'union', 'reference', etc.
  name: string;              // Human-readable name
  typeString: string;        // Full type string from TypeScript
  properties?: PropertyInfo[]; // For object types
  typeArguments?: TypeNode[];  // For generic types
  children?: TypeNode[];       // For unions, intersections
  metadata?: {
    isOptional?: boolean;
    isReadonly?: boolean;
    hasIndexSignature?: boolean;
    indexSignature?: {
      keyType: string;
      valueType: string;
    };
  };
}
```

**Supported Type Kinds:**
- Primitives: `string`, `number`, `boolean`, `void`, `undefined`, `null`, `any`, `unknown`, `never`
- Literals: `string-literal`, `number-literal`, `boolean-literal`
- Complex: `object`, `union`, `intersection`, `reference`, `type-parameter`, `conditional`, `index`

---

### Query Utilities (`query.ts`)

#### `findNodeBySelector(sourceFile: ts.SourceFile, selector: string, index?: number): ts.Node | undefined`

Find a single AST node matching a tsquery selector.

```typescript
import { findNodeBySelector } from '@cli-forge/type-tests';

const { sourceFile } = createTestProgram(`
  const config = {
    type: 'object',
    properties: { foo: { type: 'string' } }
  };
`);

const typeProperty = findNodeBySelector(
  sourceFile,
  'PropertyAssignment[name.text="type"]'
);
```

**Parameters:**
- `sourceFile` - TypeScript source file
- `selector` - tsquery selector (CSS-like syntax for AST)
- `index` - Which match to return (default: 0)

**Returns:**
- The matching node or `undefined`

---

#### `findAllNodesBySelector(sourceFile: ts.SourceFile, selector: string): ts.Node[]`

Find all AST nodes matching a tsquery selector.

```typescript
import { findAllNodesBySelector } from '@cli-forge/type-tests';

const allProperties = findAllNodesBySelector(
  sourceFile,
  'PropertyAssignment'
);
```

**Parameters:**
- `sourceFile` - TypeScript source file
- `selector` - tsquery selector

**Returns:**
- Array of matching nodes (empty array if no matches)

---

#### `CommonSelectors`

Pre-defined selectors for common cli-forge patterns:

```typescript
import { CommonSelectors, findNodeBySelector } from '@cli-forge/type-tests';

// Find the parameter in a coerce callback
const param = findNodeBySelector(sourceFile, CommonSelectors.coerceParam);

// Available selectors:
CommonSelectors.coerceParam        // Coerce callback parameters
CommonSelectors.allCoerceParams    // All coerce parameters
CommonSelectors.parseResult        // .parse() call expressions
CommonSelectors.objectConfig       // Object option configs
CommonSelectors.propertiesValue    // Properties field in object configs
CommonSelectors.defaultValue       // Default values
CommonSelectors.optionCalls        // All .option() calls
CommonSelectors.validateParam      // Validate callback parameters
CommonSelectors.typeAnnotations    // Type annotations
```

---

## Usage Examples

### Example 1: Detect Index Signatures

```typescript
import { createTestProgram, walkType, findNodeBySelector } from '@cli-forge/type-tests';
import * as ts from 'typescript';

const code = `
  type Config = Record<string, string>;
  const config: Config = { foo: 'bar' };
`;

const { typeChecker, sourceFile } = createTestProgram(code);
const typeAlias = sourceFile.statements.find(ts.isTypeAliasDeclaration);
const type = typeChecker.getTypeAtLocation(typeAlias);
const typeTree = walkType(type, typeChecker);

if (typeTree.metadata?.hasIndexSignature) {
  console.log('Has index signature:', typeTree.metadata.indexSignature);
  // Output: Has index signature: { keyType: 'string', valueType: 'string' }
}
```

### Example 2: Analyze Generic Type Arguments

```typescript
const code = `
  type Container<T> = { value: T };
  const stringContainer: Container<string> = { value: 'hello' };
`;

const { typeChecker, sourceFile } = createTestProgram(code);
const varStmt = sourceFile.statements.find(ts.isVariableStatement);
const decl = varStmt.declarationList.declarations[0];
const type = typeChecker.getTypeAtLocation(decl);
const typeTree = walkType(type, typeChecker);

console.log('Type arguments:', typeTree.typeArguments);
// Output: [{ kind: 'string', name: 'string', typeString: 'string' }]
```

### Example 3: Find and Analyze Object Properties

```typescript
const code = `
  parser().option({
    type: 'object',
    properties: {
      host: { type: 'string' },
      port: { type: 'number' }
    }
  });
`;

const { sourceFile } = createTestProgram(code);
const propertiesObj = findNodeBySelector(
  sourceFile,
  'PropertyAssignment[name.text="properties"] > ObjectLiteralExpression'
);

console.log('Found properties object:', propertiesObj.getText());
```

### Example 4: Check Coerce Parameter Types

```typescript
const code = `
  parser().option({
    type: 'object',
    properties: { foo: { type: 'string' } },
    coerce: (val) => val
  });
`;

const { typeChecker, sourceFile } = createTestProgram(code);
const coerceParam = findNodeBySelector(
  sourceFile,
  'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter'
);

if (coerceParam && ts.isParameter(coerceParam)) {
  const paramType = typeChecker.getTypeAtLocation(coerceParam);
  const typeTree = walkType(paramType, typeChecker);

  console.log('Parameter type:', typeTree.typeString);
  console.log('Properties:', typeTree.properties?.map(p => p.name));

  if (typeTree.metadata?.hasIndexSignature) {
    console.warn('BUG: Parameter has index signature instead of explicit properties!');
  }
}
```

---

## Type Kinds Reference

| Kind | Description | Example |
|------|-------------|---------|
| `string` | String primitive | `string` |
| `number` | Number primitive | `number` |
| `boolean` | Boolean primitive | `boolean` |
| `void` | Void type | `void` |
| `undefined` | Undefined type | `undefined` |
| `null` | Null type | `null` |
| `any` | Any type | `any` |
| `unknown` | Unknown type | `unknown` |
| `never` | Never type | `never` |
| `string-literal` | String literal | `"hello"` |
| `number-literal` | Number literal | `42` |
| `boolean-literal` | Boolean literal | `true` |
| `object` | Object type | `{ x: number }` |
| `union` | Union type | `string \| number` |
| `intersection` | Intersection type | `A & B` |
| `reference` | Type reference (generic) | `Array<string>` |
| `type-parameter` | Generic parameter | `T` |
| `conditional` | Conditional type | `T extends U ? X : Y` |
| `index` | Index type | `keyof T` |
| `max-depth` | Depth limit reached | `...` |

---

## tsquery Selector Syntax

tsquery uses CSS-like selectors for TypeScript AST nodes:

```typescript
// Element selector (node type)
'Identifier'

// Attribute selector (node properties)
'Identifier[name="foo"]'
'PropertyAssignment[name.text="type"]'

// Child combinator
'CallExpression > Identifier'

// Descendant combinator
'ClassDeclaration Identifier'

// Has pseudo-selector
'ObjectLiteralExpression:has(PropertyAssignment[name.text="type"])'

// Not pseudo-selector
'Identifier:not([name="foo"])'

// Multiple selectors
'StringLiteral, NumericLiteral'
```

See [@phenomnomnominal/tsquery](https://github.com/phenomnomnominal/tsquery) for full syntax.

---

## See Also

- [Design Document](/Users/agentender/repos/cli-forge/docs/plans/2025-12-03-type-debugging-tools-design.md)
- [Examples](/Users/agentender/repos/cli-forge/type-tests/src/lib/example.ts)
- [TypeScript Compiler API Docs](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
