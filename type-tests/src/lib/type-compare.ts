import * as ts from 'typescript';
import { createProgramFromFile, createTestProgram } from './compiler.js';
import { findNodeBySelector } from './query.js';
import { type Difference } from './diff-formatter.js';
import { compareTypeStructure } from './structural-compare.js';
import { traceTypeAt, type TraceResult } from './trace.js';

/**
 * Options for comparing types
 */
export interface CompareOptions {
  /** Absolute path to the TypeScript file to analyze */
  file: string;
  /** tsquery selector to find the AST node */
  selector: string;
  /** Expected type as a string */
  expected: string;
  /** Which match to use (0-based index), defaults to 0 */
  index?: number;
  /** When to include type resolution trace in the result */
  includeTrace?: 'always' | 'on_mismatch' | 'never';
}

/**
 * Result of comparing an inferred type against an expected type
 */
export interface CompareResult {
  /** Whether the types match */
  match: boolean;
  /** The actual inferred type as a string */
  actual: string;
  /** The expected type as a string */
  expected: string;
  /** List of differences between actual and expected */
  differences: Difference[];
  /** Optional type resolution trace (based on includeTrace option) */
  trace?: TraceResult;
}

/**
 * Compare an inferred type at a specific location against an expected type.
 * This is the main entry point for programmatic type comparison.
 *
 * @param options - Configuration for the comparison
 * @returns Comparison result with match status, types, differences, and optional trace
 * @throws Error if file not found, selector doesn't match, or types cannot be determined
 *
 * @example
 * ```ts
 * const result = compareTypes({
 *   file: '/path/to/file.ts',
 *   selector: 'Parameter[name.text="val"]',
 *   expected: '{ foo: string; bar: number | undefined }',
 *   includeTrace: 'on_mismatch'
 * });
 *
 * if (!result.match) {
 *   console.log('Type mismatch:');
 *   result.differences.forEach(diff => console.log(diff));
 *   if (result.trace) {
 *     console.log('Trace:', result.trace);
 *   }
 * }
 * ```
 */
export function compareTypes(options: CompareOptions): CompareResult {
  const {
    file,
    selector,
    expected: expectedString,
    index = 0,
    includeTrace = 'on_mismatch',
  } = options;

  // Create the TypeScript program from the file
  const { typeChecker, sourceFile } = createProgramFromFile(file);

  // Find the node using the selector
  const node = findNodeBySelector(sourceFile, selector, index);

  if (!node) {
    throw new Error(
      `No node found at selector: ${selector}\n` +
        `File: ${file}\n` +
        `Index: ${index}`
    );
  }

  // Get the actual type at this location
  const actualType = typeChecker.getTypeAtLocation(node);
  if (!actualType) {
    throw new Error(
      `Could not determine type at selector: ${selector}\n` +
        `File: ${file}\n` +
        `Node kind: ${ts.SyntaxKind[node.kind]}`
    );
  }

  const actualString = typeChecker.typeToString(
    actualType,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  );

  // Parse the expected type string into a TypeScript type
  const expectedType = parseTypeString(expectedString, typeChecker);

  // Compare the types structurally
  const differences = compareTypeStructure(
    actualType,
    expectedType,
    typeChecker
  );

  const match = differences.length === 0;

  // Determine if we should include the trace
  let trace: TraceResult | undefined;
  if (
    includeTrace === 'always' ||
    (includeTrace === 'on_mismatch' && !match)
  ) {
    try {
      trace = traceTypeAt({ file, selector, index });
    } catch {
      // Trace failed, but comparison can still succeed
      trace = undefined;
    }
  }

  return {
    match,
    actual: actualString,
    expected: expectedString,
    differences,
    trace,
  };
}

/**
 * Parse a type string into a TypeScript type using the TypeScript compiler.
 * This creates a temporary program with a variable declaration of the expected type.
 *
 * @param typeString - The type string to parse (e.g., "{ foo: string; bar: number }")
 * @param typeChecker - TypeScript type checker to use for validation
 * @returns The parsed TypeScript type
 * @throws Error if the type string is invalid
 */
function parseTypeString(
  typeString: string,
  typeChecker: ts.TypeChecker
): ts.Type {
  // Create a test program with a variable of the expected type
  const code = `type Expected = ${typeString};`;

  try {
    const { typeChecker: testTypeChecker, sourceFile } = createTestProgram(code);

    // Find the type alias declaration
    const typeAlias = findTypeAlias(sourceFile);
    if (!typeAlias) {
      throw new Error(`Could not find type alias in generated code`);
    }

    // Get the type
    const symbol = testTypeChecker.getSymbolAtLocation(typeAlias.name);
    if (!symbol) {
      throw new Error(`Could not resolve type symbol`);
    }

    const type = testTypeChecker.getDeclaredTypeOfSymbol(symbol);
    if (!type) {
      throw new Error(`Could not resolve type`);
    }

    return type;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Invalid expected type string: "${typeString}"\n` +
          `Parse error: ${error.message}\n` +
          `Make sure the type string is valid TypeScript type syntax.`
      );
    }
    throw error;
  }
}

/**
 * Find a type alias declaration in a source file
 */
function findTypeAlias(sourceFile: ts.SourceFile): ts.TypeAliasDeclaration | undefined {
  let found: ts.TypeAliasDeclaration | undefined;

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Expected') {
      found = node;
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return found;
}
