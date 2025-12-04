/**
 * Tests for environment variable type handling.
 *
 * These tests validate that:
 * - .env() global prefix doesn't affect option types
 * - Per-option env config preserves the original option type
 * - Env-populated values maintain correct type (not always string)
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

describe('Environment Variable Type Handling', () => {
  describe('global .env() prefix', () => {
    it('should not affect option types', () => {
      const code = `
        import { cli } from 'cli-forge';

        cli('test')
          .env('MY_APP')
          .option('port', { type: 'number', default: 3000 })
          .option('host', { type: 'string', default: 'localhost' })
          .command('start', {
            handler: (args) => {
              console.log(args.port, args.host);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // Port should be number, not string
      const portType = getPropertyType(
        result!.type,
        'port',
        result!.typeChecker
      );
      expect(portType).toBe('number');

      // Host should be string
      const hostType = getPropertyType(
        result!.type,
        'host',
        result!.typeChecker
      );
      expect(hostType).toBe('string');
    });
  });

  describe('per-option env configuration', () => {
    it('should preserve option type with env key', () => {
      const code = `
        import { cli } from 'cli-forge';

        cli('test')
          .option('timeout', {
            type: 'number',
            env: 'REQUEST_TIMEOUT',
            default: 30000,
          })
          .command('request', {
            handler: (args) => {
              console.log(args.timeout);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      const timeoutType = getPropertyType(
        result!.type,
        'timeout',
        result!.typeChecker
      );
      expect(timeoutType).toBe('number');
    });

    it('should handle boolean env options correctly', () => {
      const code = `
        import { cli } from 'cli-forge';

        cli('test')
          .option('debug', {
            type: 'boolean',
            env: 'DEBUG_MODE',
            default: false,
          })
          .command('run', {
            handler: (args) => {
              console.log(args.debug);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      const debugType = getPropertyType(
        result!.type,
        'debug',
        result!.typeChecker
      );
      expect(debugType).toBe('boolean');
    });
  });

});
