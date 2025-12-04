import * as ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

/**
 * Find a single node matching a tsquery selector
 *
 * @param node - TypeScript AST node to search within (typically SourceFile, but can be any Node)
 * @param selector - tsquery selector string (CSS-like selector for TypeScript AST)
 * @param index - Which match to return (0-based), defaults to 0 (first match)
 * @returns The matching node or undefined if not found
 *
 * @example
 * ```ts
 * // Find the first parameter of a coerce callback
 * const node = findNodeBySelector(
 *   sourceFile,
 *   'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter',
 *   0
 * );
 * ```
 */
export function findNodeBySelector(
  node: ts.Node,
  selector: string,
  index = 0
): ts.Node | undefined {
  const matches = tsquery(node, selector);
  return matches[index];
}

/**
 * Find all nodes matching a tsquery selector
 *
 * @param node - TypeScript AST node to search within (typically SourceFile, but can be any Node)
 * @param selector - tsquery selector string (CSS-like selector for TypeScript AST)
 * @returns Array of matching nodes (empty array if no matches)
 *
 * @example
 * ```ts
 * // Find all string literal properties named "type"
 * const nodes = findAllNodesBySelector(
 *   sourceFile,
 *   'PropertyAssignment[name.text="type"] > StringLiteral'
 * );
 * ```
 */
export function findAllNodesBySelector(
  node: ts.Node,
  selector: string
): ts.Node[] {
  return tsquery(node, selector);
}

/**
 * Common tsquery selectors for cli-forge type debugging
 *
 * @example
 * ```ts
 * const coerceParam = findNodeBySelector(sourceFile, CommonSelectors.coerceParam);
 * ```
 */
export const CommonSelectors = {
  /** The `val` parameter in any coerce callback */
  coerceParam:
    'PropertyAssignment[name.text="coerce"] ArrowFunction > Parameter',

  /** All parameters in coerce callbacks */
  allCoerceParams:
    'PropertyAssignment[name.text="coerce"] ArrowFunction Parameter',

  /** The return type of parser().option(...).parse() */
  parseResult: 'CallExpression[expression.name.text="parse"]',

  /** Object literal with type: 'object' */
  objectConfig:
    'ObjectLiteralExpression:has(PropertyAssignment[name.text="type"][initializer.text="object"])',

  /** The `properties` field value in object configs */
  propertiesValue:
    'PropertyAssignment[name.text="properties"] > ObjectLiteralExpression',

  /** The `default` field in option configs */
  defaultValue: 'PropertyAssignment[name.text="default"] StringLiteral, PropertyAssignment[name.text="default"] NumericLiteral, PropertyAssignment[name.text="default"] ObjectLiteralExpression, PropertyAssignment[name.text="default"] ArrayLiteralExpression',

  /** All option() method calls */
  optionCalls: 'CallExpression[expression.name.text="option"]',

  /** All validate callback parameters */
  validateParam:
    'PropertyAssignment[name.text="validate"] ArrowFunction > Parameter',

  /** Type annotation on any identifier */
  typeAnnotations: 'Identifier > TypeAnnotation',
} as const;
