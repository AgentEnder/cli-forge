/**
 * Tests for choices type inference.
 *
 * These tests validate that:
 * - Static array choices narrow to literal union type
 * - Choices don't widen to string
 * - Dynamic choice functions are handled correctly
 * - Choices with 'as const' work properly
 */
import { describe, it, expect } from 'vitest';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

/**
 * Helper to find handler parameter type.
 */
function findHandlerParamType(
  code: string
): { type: ts.Type; typeString: string; typeChecker: ts.TypeChecker } | null {
  const { typeChecker, sourceFile } = createTestProgram(code);

  function visit(node: ts.Node): ts.Type | null {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'handler' &&
      ts.isArrowFunction(node.initializer)
    ) {
      const arrowFn = node.initializer;
      if (arrowFn.parameters.length > 0) {
        const param = arrowFn.parameters[0];
        return typeChecker.getTypeAtLocation(param);
      }
    }

    let result: ts.Type | null = null;
    ts.forEachChild(node, (child) => {
      if (!result) {
        result = visit(child);
      }
    });
    return result;
  }

  const type = visit(sourceFile);
  if (!type) return null;

  return {
    type,
    typeString: typeChecker.typeToString(type),
    typeChecker,
  };
}

/**
 * Get the type of a specific property on a type.
 */
function getPropertyType(
  type: ts.Type,
  propName: string,
  checker: ts.TypeChecker
): string | null {
  const prop = type.getProperty(propName);
  if (!prop) return null;

  const propType = checker.getTypeOfSymbol(prop);
  return checker.typeToString(propType);
}

describe('Choices Type Inference', () => {
  describe('static array choices', () => {
    it('should narrow to literal union with as const', () => {
      const code = `
        import { cli } from 'cli-forge';

        const formats = ['json', 'yaml', 'xml'] as const;

        cli('test')
          .option('format', {
            type: 'string',
            choices: formats,
            required: true,
          })
          .command('run', {
            handler: (args) => {
              console.log(args.format);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      const formatType = getPropertyType(
        result!.type,
        'format',
        result!.typeChecker
      );
      expect(formatType).not.toBeNull();

      // Should be a union of literals, not just 'string'
      expect(formatType).not.toBe('string');
      // Should contain the literal values
      expect(formatType).toMatch(/json|yaml|xml/);
    });

    it('should narrow inline array choices', () => {
      const code = `
        import { cli } from 'cli-forge';

        cli('test')
          .option('level', {
            type: 'string',
            choices: ['low', 'medium', 'high'] as const,
            default: 'medium' as const,
          })
          .command('run', {
            handler: (args) => {
              console.log(args.level);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      const levelType = getPropertyType(
        result!.type,
        'level',
        result!.typeChecker
      );
      expect(levelType).not.toBeNull();
      expect(levelType).not.toBe('string');
    });
  });

  describe('number choices', () => {
    it('should narrow number choices to literal union', () => {
      const code = `
        import { cli } from 'cli-forge';

        cli('test')
          .option('priority', {
            type: 'number',
            choices: [1, 2, 3, 4, 5] as const,
            required: true,
          })
          .command('run', {
            handler: (args) => {
              console.log(args.priority);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      const priorityType = getPropertyType(
        result!.type,
        'priority',
        result!.typeChecker
      );
      expect(priorityType).not.toBeNull();
      expect(priorityType).not.toBe('number');
    });
  });

});
