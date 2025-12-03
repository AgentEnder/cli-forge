import * as ts from 'typescript';
import { walkType, type TypeNode } from './type-walker.js';
import { type TraceNode } from './type-formatter.js';

/**
 * Result of tracing a type's resolution chain
 */
export interface TraceResult {
  /** Source location where the type was inferred */
  location: { file: string; line: number; col: number };
  /** The final inferred type as a string */
  inferredType: string;
  /** The resolution chain as a tree of trace nodes */
  chain: TraceNode[];
  /** Warnings about unexpected type patterns (e.g., widening) */
  warnings: string[];
}

/**
 * Build a resolution chain from a TypeScript type at a specific AST node.
 * This function analyzes the type structure and builds a tree showing how
 * the type was resolved, detecting common issues like type widening.
 *
 * @param type - The TypeScript type to trace
 * @param typeChecker - TypeScript type checker
 * @param node - The AST node where the type was inferred
 * @returns Complete trace result with location, type string, chain, and warnings
 */
export function buildResolutionChain(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node
): TraceResult {
  const warnings: string[] = [];
  const sourceFile = node.getSourceFile();

  // Extract location information
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart()
  );
  const location = {
    file: sourceFile.fileName,
    line: line + 1, // Convert to 1-based
    col: character + 1, // Convert to 1-based
  };

  // Get the type string
  const inferredType = typeChecker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation
  );

  // Walk the type structure and build the resolution chain
  const typeTree = walkType(type, typeChecker);
  const chain = convertTypeNodeToTraceNode(typeTree, typeChecker, warnings);

  return {
    location,
    inferredType,
    chain: [chain],
    warnings,
  };
}

/**
 * Convert a TypeNode (from walkType) to a TraceNode (for formatTraceTree).
 * This function detects unexpected patterns like index signatures and type widening.
 */
function convertTypeNodeToTraceNode(
  typeNode: TypeNode,
  typeChecker: ts.TypeChecker,
  warnings: string[]
): TraceNode {
  const traceNode: TraceNode = {
    typeName: typeNode.name,
    resolvedTo: typeNode.typeString,
    children: [],
  };

  // Detect index signature widening (e.g., explicit properties becoming Record<string, any>)
  if (
    typeNode.metadata?.hasIndexSignature &&
    typeNode.metadata.indexSignature
  ) {
    const indexSig = typeNode.metadata.indexSignature;
    const hasExplicitProperties =
      typeNode.properties && typeNode.properties.length > 0;

    if (hasExplicitProperties) {
      // This is unexpected - the type has both explicit properties AND an index signature
      // This often happens when type widening occurs
      const warning = `Type has both explicit properties and index signature [${indexSig.keyType}]: ${indexSig.valueType}`;
      warnings.push(warning);
      traceNode.isUnexpected = true;
      traceNode.warning = 'WIDENED TO INDEX SIGNATURE';
    } else if (indexSig.valueType === 'any') {
      // Plain index signature with 'any' value type
      const warning = `Index signature with 'any' value type detected: Record<${indexSig.keyType}, any>`;
      warnings.push(warning);
      traceNode.isUnexpected = true;
      traceNode.warning = 'INDEX SIGNATURE WITH ANY';
    }
  }

  // Detect Record<string, any> pattern (common widening issue)
  if (
    typeNode.kind === 'reference' &&
    typeNode.name === 'Record' &&
    typeNode.typeArguments &&
    typeNode.typeArguments.length === 2
  ) {
    const valueType = typeNode.typeArguments[1];
    if (valueType.kind === 'any') {
      const warning = `Record type with 'any' value type detected: ${typeNode.typeString}`;
      warnings.push(warning);
      traceNode.isUnexpected = true;
      traceNode.warning = 'RECORD WITH ANY';
    }
  }

  // Detect 'any' type (usually indicates type inference failure)
  if (typeNode.kind === 'any') {
    const warning = `Type inferred as 'any' - type inference may have failed`;
    warnings.push(warning);
    traceNode.isUnexpected = true;
    traceNode.warning = 'INFERRED AS ANY';
  }

  // Build type parameters map if this is a generic type
  if (typeNode.typeArguments && typeNode.typeArguments.length > 0) {
    traceNode.typeParameters = {};
    typeNode.typeArguments.forEach((arg, index) => {
      traceNode.typeParameters![`T${index}`] = arg.typeString;
    });
  }

  // Recursively convert children
  if (typeNode.children && typeNode.children.length > 0) {
    traceNode.children = typeNode.children.map((child) =>
      convertTypeNodeToTraceNode(child, typeChecker, warnings)
    );
  }

  // Convert properties to trace nodes
  if (typeNode.properties && typeNode.properties.length > 0) {
    const propertyNodes: TraceNode[] = typeNode.properties.map((prop) => {
      const propNode = convertTypeNodeToTraceNode(
        prop.type,
        typeChecker,
        warnings
      );
      return {
        typeName: `${prop.name}${prop.isOptional ? '?' : ''}`,
        resolvedTo: prop.type.typeString,
        children: propNode.children.length > 0 ? propNode.children : [],
        isUnexpected: propNode.isUnexpected,
        warning: propNode.warning,
      };
    });

    // If we have properties, add them as a separate "properties" section
    if (propertyNodes.length > 0) {
      traceNode.children.push({
        typeName: 'properties',
        resolvedTo: `${propertyNodes.length} properties`,
        children: propertyNodes,
      });
    }
  }

  // Mark as expected if there are no warnings and it's an object with explicit properties
  if (
    !traceNode.isUnexpected &&
    typeNode.kind === 'object' &&
    typeNode.properties &&
    typeNode.properties.length > 0 &&
    !typeNode.metadata?.hasIndexSignature
  ) {
    traceNode.isUnexpected = false;
  }

  return traceNode;
}

/**
 * Helper to extract location from a TypeScript node
 */
export function getNodeLocation(
  node: ts.Node
): { file: string; line: number; col: number } {
  const sourceFile = node.getSourceFile();
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart()
  );

  return {
    file: sourceFile.fileName,
    line: line + 1,
    col: character + 1,
  };
}
