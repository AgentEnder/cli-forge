/**
 * Integration example showing the complete workflow for debugging
 * cli-forge object option type inference issues
 */

import {
  createTestProgram,
  walkType,
  findNodeBySelector,
  CommonSelectors,
  type TypeNode,
} from './index.js';
import * as ts from 'typescript';

/**
 * Complete workflow: Detect and diagnose object option type inference bugs
 */
export function diagnoseObjectOptionInference() {
  // This is the problematic pattern we're debugging
  const code = `
    import { parser } from 'cli-forge';

    const cli = parser().option({
      key: 'server',
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
        ssl: { type: 'boolean' }
      },
      coerce: (val) => {
        // BUG: 'val' is inferred as Record<string, string | number | boolean>
        // EXPECTED: { host: string; port: number; ssl: boolean | undefined }
        console.log(val.host, val.port, val.ssl);
        return val;
      },
      validate: (val) => {
        // Same issue here
        return val.port > 0;
      }
    });
  `;

  console.log('=== Diagnosing Object Option Type Inference ===\n');

  const { typeChecker, sourceFile } = createTestProgram(code);

  // Step 1: Find the coerce callback parameter
  console.log('Step 1: Locating coerce callback parameter...');
  const coerceParam = findNodeBySelector(sourceFile, CommonSelectors.coerceParam);

  if (!coerceParam || !ts.isParameter(coerceParam)) {
    throw new Error('Could not find coerce parameter');
  }

  console.log(`✓ Found parameter: ${coerceParam.name.getText()}\n`);

  // Step 2: Get the inferred type
  console.log('Step 2: Analyzing inferred type...');
  const paramType = typeChecker.getTypeAtLocation(coerceParam);
  const typeString = typeChecker.typeToString(
    paramType,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  );

  console.log(`Type string: ${typeString}\n`);

  // Step 3: Walk the type structure
  console.log('Step 3: Walking type structure...');
  const typeTree = walkType(paramType, typeChecker, 15);

  console.log('Type tree:');
  printTypeTree(typeTree, 0);
  console.log();

  // Step 4: Check for the bug
  console.log('Step 4: Checking for type inference issues...');

  const issues: string[] = [];

  // Check if it has an index signature (the main bug)
  if (typeTree.metadata?.hasIndexSignature) {
    issues.push(
      `❌ ISSUE: Type has index signature (${typeTree.metadata.indexSignature?.keyType} -> ${typeTree.metadata.indexSignature?.valueType})`
    );
    issues.push('   Expected: Explicit properties { host: string; port: number; ssl: boolean | undefined }');
    issues.push('   This causes incorrect autocomplete and type checking in callbacks');
  }

  // Check if properties are present
  if (!typeTree.properties || typeTree.properties.length === 0) {
    issues.push('❌ ISSUE: No explicit properties found');
    issues.push('   Expected properties: host, port, ssl');
  } else {
    console.log(`✓ Found ${typeTree.properties.length} properties:`);
    typeTree.properties.forEach((prop) => {
      const optional = prop.isOptional ? '?' : '';
      console.log(`  - ${prop.name}${optional}: ${prop.type.typeString}`);
    });
  }

  // Check for union/intersection types (Record<string, X> & Y pattern)
  if (typeTree.kind === 'intersection') {
    const hasRecordChild = typeTree.children?.some(
      (child) =>
        child.metadata?.hasIndexSignature &&
        child.metadata?.indexSignature?.keyType === 'string'
    );

    if (hasRecordChild) {
      issues.push('❌ ISSUE: Intersection with Record type detected');
      issues.push('   This indicates type widening from { foo: X, bar: Y } to Record<string, Z>');
    }
  }

  console.log();

  // Step 5: Report findings
  console.log('Step 5: Diagnosis Summary');
  console.log('='.repeat(50));

  if (issues.length === 0) {
    console.log('✅ No type inference issues detected!');
    console.log('   Type is correctly inferred as explicit object properties');
  } else {
    console.log(`Found ${issues.length} issue(s):\n`);
    issues.forEach((issue) => console.log(issue));

    console.log('\nPossible causes:');
    console.log('  1. Type parameter TProperties widened to Record<string, any>');
    console.log('  2. ResolveProperties not preserving literal object structure');
    console.log('  3. Default type parameters causing loss of specificity');
    console.log('\nRecommended actions:');
    console.log('  1. Check OptionConfig type parameter constraints');
    console.log('  2. Verify ResolveProperties implementation');
    console.log('  3. Add type tests to prevent regression');
  }

  return {
    typeString,
    typeTree,
    issues,
    hasIssues: issues.length > 0,
  };
}

/**
 * Helper to print a type tree with indentation
 */
function printTypeTree(node: TypeNode, indent: number) {
  const prefix = '  '.repeat(indent);

  // Print the node
  console.log(`${prefix}${node.kind}: ${node.typeString}`);

  // Print metadata
  if (node.metadata?.hasIndexSignature) {
    console.log(
      `${prefix}  [index: ${node.metadata.indexSignature?.keyType} -> ${node.metadata.indexSignature?.valueType}]`
    );
  }

  // Print properties
  if (node.properties && node.properties.length > 0) {
    console.log(`${prefix}  properties:`);
    node.properties.forEach((prop) => {
      const optional = prop.isOptional ? '?' : '';
      const readonly = prop.isReadonly ? 'readonly ' : '';
      console.log(
        `${prefix}    ${readonly}${prop.name}${optional}: ${prop.type.typeString}`
      );
    });
  }

  // Print type arguments
  if (node.typeArguments && node.typeArguments.length > 0) {
    console.log(`${prefix}  typeArguments:`);
    node.typeArguments.forEach((arg, i) => {
      console.log(`${prefix}    [${i}]:`);
      printTypeTree(arg, indent + 3);
    });
  }

  // Print children (for unions, intersections)
  if (node.children && node.children.length > 0) {
    console.log(`${prefix}  children:`);
    node.children.forEach((child, i) => {
      console.log(`${prefix}    [${i}]:`);
      printTypeTree(child, indent + 3);
    });
  }
}

/**
 * Compare expected vs actual type structure
 */
export function validateExpectedType() {
  const code = `
    type Expected = {
      host: string;
      port: number;
      ssl: boolean | undefined;
    };

    type Actual = Record<string, string | number | boolean> & unknown;
  `;

  const { typeChecker, sourceFile } = createTestProgram(code);

  const typeAliases = sourceFile.statements.filter(ts.isTypeAliasDeclaration);
  const expectedAlias = typeAliases.find((t) => t.name.text === 'Expected');
  const actualAlias = typeAliases.find((t) => t.name.text === 'Actual');

  if (!expectedAlias || !actualAlias) {
    throw new Error('Type aliases not found');
  }

  const expectedType = typeChecker.getTypeAtLocation(expectedAlias);
  const actualType = typeChecker.getTypeAtLocation(actualAlias);

  const expectedTree = walkType(expectedType, typeChecker);
  const actualTree = walkType(actualType, typeChecker);

  console.log('=== Type Comparison ===\n');

  console.log('Expected:');
  printTypeTree(expectedTree, 1);
  console.log();

  console.log('Actual:');
  printTypeTree(actualTree, 1);
  console.log();

  // Compare
  const differences: string[] = [];

  if (expectedTree.metadata?.hasIndexSignature !== actualTree.metadata?.hasIndexSignature) {
    differences.push('Index signature presence differs');
  }

  const expectedProps = expectedTree.properties?.map((p) => p.name) || [];
  const actualProps = actualTree.properties?.map((p) => p.name) || [];

  const missingProps = expectedProps.filter((p) => !actualProps.includes(p));
  const extraProps = actualProps.filter((p) => !expectedProps.includes(p));

  if (missingProps.length > 0) {
    differences.push(`Missing properties: ${missingProps.join(', ')}`);
  }

  if (extraProps.length > 0) {
    differences.push(`Extra properties: ${extraProps.join(', ')}`);
  }

  console.log('Differences:', differences.length === 0 ? 'None' : '\n  - ' + differences.join('\n  - '));

  return {
    expected: expectedTree,
    actual: actualTree,
    differences,
    match: differences.length === 0,
  };
}

// Example: Run the diagnosis
// if (require.main === module) {
//   diagnoseObjectOptionInference();
//   console.log('\n\n');
//   validateExpectedType();
// }
