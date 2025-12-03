import * as ts from 'typescript';
import { type Difference } from './diff-formatter.js';

/**
 * Compare two TypeScript types structurally and generate a list of differences.
 * This function performs deep comparison of object properties, union types,
 * optionality, and index signatures.
 *
 * @param actual - The actual inferred type
 * @param expected - The expected type
 * @param typeChecker - TypeScript type checker
 * @param path - Current property path (for nested objects)
 * @returns Array of differences between the two types
 *
 * @example
 * ```ts
 * const diffs = compareTypeStructure(actualType, expectedType, typeChecker);
 * if (diffs.length > 0) {
 *   console.log('Type mismatch:', diffs);
 * }
 * ```
 */
export function compareTypeStructure(
  actual: ts.Type,
  expected: ts.Type,
  typeChecker: ts.TypeChecker,
  path = ''
): Difference[] {
  const differences: Difference[] = [];

  // Quick check: if types are identical, no differences
  if (actual === expected) {
    return differences;
  }

  // Check if both types have the same basic structure
  const actualString = typeChecker.typeToString(
    actual,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  );
  const expectedString = typeChecker.typeToString(
    expected,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  );

  // If strings match exactly, types are compatible
  if (actualString === expectedString) {
    return differences;
  }

  // Detect index signature vs explicit properties mismatch
  const actualHasIndexSig = hasIndexSignature(actual, typeChecker);
  const expectedHasIndexSig = hasIndexSignature(expected, typeChecker);

  if (actualHasIndexSig && !expectedHasIndexSig) {
    const actualProps = typeChecker.getPropertiesOfType(actual);
    const expectedProps = typeChecker.getPropertiesOfType(expected);

    if (expectedProps.length > 0 && actualProps.length === 0) {
      // Actual has index signature, expected has explicit properties
      differences.push({
        path: path || 'root',
        kind: 'type_mismatch',
        actual: `index signature (${actualString})`,
        expected: 'object with explicit properties',
      });
      return differences;
    }
  }

  // Compare object types structurally
  if (isObjectType(actual) && isObjectType(expected)) {
    return compareObjectTypes(actual, expected, typeChecker, path);
  }

  // Compare union types
  if (isUnionType(actual) && isUnionType(expected)) {
    return compareUnionTypes(actual, expected, typeChecker, path);
  }

  // Compare union vs non-union (optionality check)
  if (isUnionType(actual) !== isUnionType(expected)) {
    differences.push({
      path: path || 'root',
      kind: 'optionality',
      actual: actualString,
      expected: expectedString,
    });
    return differences;
  }

  // If we reach here, types don't match
  if (actualString !== expectedString) {
    differences.push({
      path: path || 'root',
      kind: 'type_mismatch',
      actual: actualString,
      expected: expectedString,
    });
  }

  return differences;
}

/**
 * Compare two object types structurally by comparing their properties
 */
function compareObjectTypes(
  actual: ts.Type,
  expected: ts.Type,
  typeChecker: ts.TypeChecker,
  path: string
): Difference[] {
  const differences: Difference[] = [];

  const actualProps = typeChecker.getPropertiesOfType(actual);
  const expectedProps = typeChecker.getPropertiesOfType(expected);

  // Build maps for easier lookup
  const actualPropMap = new Map(actualProps.map((p) => [p.getName(), p]));
  const expectedPropMap = new Map(expectedProps.map((p) => [p.getName(), p]));

  // Check for missing properties (in expected but not in actual)
  for (const [name, expectedProp] of Array.from(expectedPropMap.entries())) {
    if (!actualPropMap.has(name)) {
      const expectedPropType = typeChecker.getTypeOfSymbolAtLocation(
        expectedProp,
        expectedProp.valueDeclaration!
      );
      const expectedTypeString = typeChecker.typeToString(expectedPropType);

      differences.push({
        path: path ? `${path}.${name}` : name,
        kind: 'missing',
        expected: expectedTypeString,
      });
    }
  }

  // Check for extra properties (in actual but not in expected)
  for (const [name, actualProp] of Array.from(actualPropMap.entries())) {
    if (!expectedPropMap.has(name)) {
      const actualPropType = typeChecker.getTypeOfSymbolAtLocation(
        actualProp,
        actualProp.valueDeclaration!
      );
      const actualTypeString = typeChecker.typeToString(actualPropType);

      differences.push({
        path: path ? `${path}.${name}` : name,
        kind: 'extra',
        actual: actualTypeString,
      });
    }
  }

  // Compare matching properties
  for (const [name, expectedProp] of Array.from(expectedPropMap.entries())) {
    const actualProp = actualPropMap.get(name);
    if (!actualProp) {
      continue; // Already handled as missing
    }

    const actualPropType = typeChecker.getTypeOfSymbolAtLocation(
      actualProp,
      actualProp.valueDeclaration!
    );
    const expectedPropType = typeChecker.getTypeOfSymbolAtLocation(
      expectedProp,
      expectedProp.valueDeclaration!
    );

    // Check optionality
    const actualIsOptional = !!(actualProp.flags & ts.SymbolFlags.Optional);
    const expectedIsOptional = !!(expectedProp.flags & ts.SymbolFlags.Optional);

    if (actualIsOptional !== expectedIsOptional) {
      differences.push({
        path: path ? `${path}.${name}` : name,
        kind: 'optionality',
        actual: actualIsOptional ? 'optional' : 'required',
        expected: expectedIsOptional ? 'optional' : 'required',
      });
    }

    // Recursively compare property types
    const propPath = path ? `${path}.${name}` : name;
    const propDiffs = compareTypeStructure(
      actualPropType,
      expectedPropType,
      typeChecker,
      propPath
    );
    differences.push(...propDiffs);
  }

  return differences;
}

/**
 * Compare two union types
 */
function compareUnionTypes(
  actual: ts.Type,
  expected: ts.Type,
  typeChecker: ts.TypeChecker,
  path: string
): Difference[] {
  const actualUnion = actual as ts.UnionType;
  const expectedUnion = expected as ts.UnionType;

  // Get the constituent types
  const actualTypes = actualUnion.types;
  const expectedTypes = expectedUnion.types;

  // Convert to strings for comparison
  const actualStrings = actualTypes.map((t) => typeChecker.typeToString(t));
  const expectedStrings = expectedTypes.map((t) => typeChecker.typeToString(t));

  // Check if unions have the same members (order-independent)
  const actualSet = new Set(actualStrings);
  const expectedSet = new Set(expectedStrings);

  const missing = Array.from(expectedSet).filter((s) => !actualSet.has(s));
  const extra = Array.from(actualSet).filter((s) => !expectedSet.has(s));

  const differences: Difference[] = [];

  if (missing.length > 0 || extra.length > 0) {
    differences.push({
      path: path || 'root',
      kind: 'type_mismatch',
      actual: actualStrings.join(' | '),
      expected: expectedStrings.join(' | '),
    });
  }

  return differences;
}

/**
 * Check if a type is an object type
 */
function isObjectType(type: ts.Type): boolean {
  return !!(type.flags & ts.TypeFlags.Object);
}

/**
 * Check if a type is a union type
 */
function isUnionType(type: ts.Type): boolean {
  return !!(type.flags & ts.TypeFlags.Union);
}

/**
 * Check if a type has an index signature
 */
function hasIndexSignature(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): boolean {
  const stringIndexType = typeChecker.getIndexTypeOfType(
    type,
    ts.IndexKind.String
  );
  const numberIndexType = typeChecker.getIndexTypeOfType(
    type,
    ts.IndexKind.Number
  );

  return !!(stringIndexType || numberIndexType);
}
