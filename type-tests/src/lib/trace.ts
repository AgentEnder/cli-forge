import * as ts from 'typescript';
import { createProgramFromFile } from './compiler.js';
import { findNodeBySelector, findAllNodesBySelector } from './query.js';
import {
  buildResolutionChain,
  type TraceResult,
} from './resolution-chain.js';

/**
 * Options for tracing a type at a specific location
 */
export interface TraceOptions {
  /** Absolute path to the TypeScript file */
  file: string;
  /** tsquery selector to find the AST node */
  selector: string;
  /** Which match to use (0-based index), defaults to 0 */
  index?: number;
}

/**
 * Trace the type at a specific location in a TypeScript file.
 * This is the main entry point for programmatic type tracing.
 *
 * @param options - Configuration for which type to trace
 * @returns Complete trace result with type chain and warnings
 * @throws Error if file not found, selector doesn't match, or type cannot be determined
 *
 * @example
 * ```ts
 * const result = traceTypeAt({
 *   file: '/path/to/file.ts',
 *   selector: 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter',
 *   index: 0
 * });
 *
 * console.log(result.inferredType);
 * console.log(result.warnings);
 * ```
 */
export function traceTypeAt(options: TraceOptions): TraceResult {
  const { file, selector, index = 0 } = options;

  // Create the TypeScript program
  const { typeChecker, sourceFile } = createProgramFromFile(file);

  // Find the node using the selector
  const node = findNodeBySelector(sourceFile, selector, index);

  if (!node) {
    const allMatches = findAllNodesBySelector(sourceFile, selector);
    if (allMatches.length === 0) {
      throw new Error(
        `No nodes found matching selector: ${selector}\n` +
          `File: ${file}\n` +
          `Make sure your selector is correct and the file contains matching nodes.`
      );
    } else {
      throw new Error(
        `No node found at index ${index} for selector: ${selector}\n` +
          `File: ${file}\n` +
          `Found ${allMatches.length} match(es), but index ${index} is out of range.\n` +
          `Use an index between 0 and ${allMatches.length - 1}.`
      );
    }
  }

  // Get the type at this location
  const type = getTypeAtNode(node, typeChecker);

  if (!type) {
    throw new Error(
      `Could not determine type at selector: ${selector}\n` +
        `File: ${file}\n` +
        `Node kind: ${ts.SyntaxKind[node.kind]}\n` +
        `This node might not have type information available.`
    );
  }

  // Build and return the resolution chain
  return buildResolutionChain(type, typeChecker, node);
}

/**
 * Trace types at all locations matching a selector.
 * Useful when you want to analyze all occurrences of a pattern.
 *
 * @param options - Configuration for which types to trace (without index)
 * @returns Array of trace results, one for each match
 *
 * @example
 * ```ts
 * const results = traceAllTypesAt({
 *   file: '/path/to/file.ts',
 *   selector: 'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter'
 * });
 *
 * results.forEach((result, i) => {
 *   console.log(`Match ${i}:`, result.inferredType);
 * });
 * ```
 */
export function traceAllTypesAt(
  options: Omit<TraceOptions, 'index'>
): TraceResult[] {
  const { file, selector } = options;

  // Create the TypeScript program
  const { typeChecker, sourceFile } = createProgramFromFile(file);

  // Find all nodes matching the selector
  const nodes = findAllNodesBySelector(sourceFile, selector);

  if (nodes.length === 0) {
    throw new Error(
      `No nodes found matching selector: ${selector}\n` +
        `File: ${file}\n` +
        `Make sure your selector is correct and the file contains matching nodes.`
    );
  }

  // Build trace results for each node
  const results: TraceResult[] = [];
  for (const node of nodes) {
    const type = getTypeAtNode(node, typeChecker);
    if (type) {
      results.push(buildResolutionChain(type, typeChecker, node));
    }
  }

  return results;
}

/**
 * Get the type at a specific AST node.
 * Handles different node types appropriately.
 */
function getTypeAtNode(
  node: ts.Node,
  typeChecker: ts.TypeChecker
): ts.Type | undefined {
  // For parameter nodes, get the type of the parameter
  if (ts.isParameter(node)) {
    return typeChecker.getTypeAtLocation(node);
  }

  // For identifiers, get the type at location
  if (ts.isIdentifier(node)) {
    return typeChecker.getTypeAtLocation(node);
  }

  // For variable declarations, get the type
  if (ts.isVariableDeclaration(node)) {
    return typeChecker.getTypeAtLocation(node);
  }

  // For property assignments, get the type of the initializer
  if (ts.isPropertyAssignment(node)) {
    return typeChecker.getTypeAtLocation(node.initializer);
  }

  // For call expressions, get the return type
  if (ts.isCallExpression(node)) {
    const signature = typeChecker.getResolvedSignature(node);
    if (signature) {
      return typeChecker.getReturnTypeOfSignature(signature);
    }
  }

  // For expressions, get the type at location
  if (ts.isExpression(node)) {
    return typeChecker.getTypeAtLocation(node);
  }

  // Default: try to get type at location
  try {
    return typeChecker.getTypeAtLocation(node);
  } catch {
    return undefined;
  }
}

/**
 * Re-export TraceResult type for convenience
 */
export type { TraceResult } from './resolution-chain.js';
