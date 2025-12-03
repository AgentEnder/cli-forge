/**
 * Example usage of the type-tests utilities
 *
 * This file demonstrates how to use the compiler, type-walker, and query
 * utilities to analyze TypeScript type inference.
 */

import {
  createTestProgram,
  createProgramFromFile,
  walkType,
  findNodeBySelector,
  findAllNodesBySelector,
  CommonSelectors,
} from './index.js';
import * as ts from 'typescript';

/**
 * Example 1: Analyze types in a code string
 */
export function analyzeInlineCode() {
  const code = `
    interface Config {
      host: string;
      port: number;
      options?: {
        timeout: number;
        retries: number;
      };
    }

    const config: Config = {
      host: "localhost",
      port: 3000,
      options: { timeout: 5000, retries: 3 }
    };
  `;

  const { typeChecker, sourceFile } = createTestProgram(code);

  // Find the Config interface
  const interfaceDecl = sourceFile.statements.find(ts.isInterfaceDeclaration);
  if (!interfaceDecl) {
    throw new Error('Interface not found');
  }

  // Get the type and walk it
  const configType = typeChecker.getTypeAtLocation(interfaceDecl);
  const typeTree = walkType(configType, typeChecker);

  console.log('Config type structure:');
  console.log(JSON.stringify(typeTree, null, 2));

  return typeTree;
}

/**
 * Example 2: Find and analyze specific nodes using selectors
 */
export function analyzeWithSelectors() {
  const code = `
    import { parser } from 'cli-forge';

    parser().option({
      key: 'config',
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 }
      },
      coerce: (val) => {
        // val should be { host: string; port: number }
        return val;
      }
    });
  `;

  const { typeChecker, sourceFile } = createTestProgram(code);

  // Find the coerce parameter
  const coerceParam = findNodeBySelector(sourceFile, CommonSelectors.coerceParam);

  if (coerceParam && ts.isParameter(coerceParam)) {
    const paramType = typeChecker.getTypeAtLocation(coerceParam);
    const paramTypeTree = walkType(paramType, typeChecker);

    console.log('Coerce parameter type:');
    console.log(JSON.stringify(paramTypeTree, null, 2));

    // Check if it has an index signature (the bug we're debugging)
    if (paramTypeTree.metadata?.hasIndexSignature) {
      console.warn('⚠️  WARNING: Parameter has index signature!');
      console.warn('   Expected explicit properties, got:', paramTypeTree.typeString);
    }

    return paramTypeTree;
  }

  throw new Error('Coerce parameter not found');
}

/**
 * Example 3: Analyze a file from disk
 */
export function analyzeFile(filePath: string) {
  const { typeChecker, sourceFile } = createProgramFromFile(filePath);

  // Find all option calls
  const optionCalls = findAllNodesBySelector(
    sourceFile,
    CommonSelectors.optionCalls
  );

  console.log(`Found ${optionCalls.length} option() calls in ${filePath}`);

  // Analyze each one
  const results = optionCalls.map((call, index) => {
    if (!ts.isCallExpression(call)) {
      return null;
    }

    // Try to find the coerce callback in this option call
    const coerceParams = findAllNodesBySelector(
      call,
      'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter'
    );

    if (coerceParams.length > 0) {
      const param = coerceParams[0];
      const paramType = typeChecker.getTypeAtLocation(param);
      const typeTree = walkType(paramType, typeChecker);

      return {
        index,
        coerceParameterType: typeTree,
        hasIndexSignature: typeTree.metadata?.hasIndexSignature || false,
      };
    }

    return null;
  }).filter(Boolean);

  return results;
}

/**
 * Example 4: Deep type inspection for debugging
 */
export function inspectTypeResolution() {
  const code = `
    type ObjectValue<TProperties, TAdditional = unknown> =
      TProperties extends Record<string, any>
        ? { [K in keyof TProperties]: string }
        : never;

    type TestType = ObjectValue<{ foo: string; bar: number }>;
  `;

  const { typeChecker, sourceFile } = createTestProgram(code);

  // Find the TestType alias
  const typeAlias = sourceFile.statements
    .filter(ts.isTypeAliasDeclaration)
    .find((t) => t.name.text === 'TestType');

  if (!typeAlias) {
    throw new Error('TestType not found');
  }

  const testType = typeChecker.getTypeAtLocation(typeAlias);
  const typeTree = walkType(testType, typeChecker, 15); // Deeper depth for complex types

  console.log('TestType resolution:');
  console.log(JSON.stringify(typeTree, null, 2));

  return typeTree;
}

/**
 * Example 5: Compare expected vs actual type structure
 */
export function compareTypeStructures(
  actualCode: string,
  expectedProperties: string[]
) {
  const { typeChecker, sourceFile } = createTestProgram(actualCode);

  const interfaceDecl = sourceFile.statements.find(ts.isInterfaceDeclaration);
  if (!interfaceDecl) {
    throw new Error('Interface not found');
  }

  const actualType = typeChecker.getTypeAtLocation(interfaceDecl);
  const actualTree = walkType(actualType, typeChecker);

  // Check if all expected properties exist
  const actualProps = actualTree.properties?.map((p) => p.name) || [];
  const missing = expectedProperties.filter((p) => !actualProps.includes(p));
  const extra = actualProps.filter((p) => !expectedProperties.includes(p));

  const result = {
    match: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    hasIndexSignature: actualTree.metadata?.hasIndexSignature || false,
    actualProperties: actualProps,
  };

  if (!result.match) {
    console.error('Type structure mismatch:');
    if (missing.length > 0) {
      console.error('  Missing properties:', missing);
    }
    if (extra.length > 0) {
      console.error('  Extra properties:', extra);
    }
  }

  if (result.hasIndexSignature) {
    console.warn('⚠️  Type has index signature:',
      actualTree.metadata?.indexSignature);
  }

  return result;
}

// Example usage (commented out to avoid running during module load)
// if (require.main === module) {
//   console.log('=== Example 1: Inline Code Analysis ===');
//   analyzeInlineCode();
//
//   console.log('\n=== Example 2: Selector-based Analysis ===');
//   analyzeWithSelectors();
//
//   console.log('\n=== Example 4: Type Resolution Inspection ===');
//   inspectTypeResolution();
// }
