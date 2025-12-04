/**
 * Tests for middleware type transformation.
 *
 * These tests validate that middleware correctly transforms the args type,
 * adding new properties that are available in handlers with full type safety.
 */
import { describe, it, expect } from 'vitest';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

/**
 * Helper to find the handler parameter type in a command definition.
 */
function findHandlerParamType(
  code: string
): { type: ts.Type; typeString: string } | null {
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
  };
}

/**
 * Helper to check if a type has a specific property.
 */
function typeHasProperty(type: ts.Type, propName: string): boolean {
  const props = type.getProperties();
  return props.some((p) => p.name === propName);
}

describe('Middleware Type Transformation', () => {
  describe('single middleware adding properties', () => {
    it('should add middleware properties to handler args', () => {
      const code = `
        import { cli } from 'cli-forge';

        interface TimingContext {
          startTime: number;
        }

        function timingMiddleware<T>(args: T): T & TimingContext {
          return { ...args, startTime: Date.now() };
        }

        cli('test')
          .option('name', { type: 'string', required: true })
          .middleware(timingMiddleware)
          .command('greet', {
            handler: (args) => {
              console.log(args.name, args.startTime);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // Handler args should have both 'name' and 'startTime'
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'startTime')).toBe(true);
    });

    it('should preserve original option types through middleware', () => {
      const code = `
        import { cli } from 'cli-forge';

        function addFlag<T>(args: T): T & { flag: boolean } {
          return { ...args, flag: true };
        }

        cli('test')
          .option('count', { type: 'number', default: 0 })
          .option('verbose', { type: 'boolean' })
          .middleware(addFlag)
          .command('run', {
            handler: (args) => {
              const count: number = args.count;
              const verbose: boolean | undefined = args.verbose;
              const flag: boolean = args.flag;
              console.log(count, verbose, flag);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // All properties should be present
      expect(typeHasProperty(result!.type, 'count')).toBe(true);
      expect(typeHasProperty(result!.type, 'verbose')).toBe(true);
      expect(typeHasProperty(result!.type, 'flag')).toBe(true);
    });
  });

  describe('multiple middleware chaining', () => {
    it('should accumulate types from multiple middleware', () => {
      const code = `
        import { cli } from 'cli-forge';

        interface Auth { user: string; }
        interface Timing { start: number; }

        function authMiddleware<T>(args: T): T & Auth {
          return { ...args, user: 'test' };
        }

        function timingMiddleware<T>(args: T): T & Timing {
          return { ...args, start: Date.now() };
        }

        cli('test')
          .option('name', { type: 'string' })
          .middleware(timingMiddleware)
          .middleware(authMiddleware)
          .command('action', {
            handler: (args) => {
              console.log(args.name, args.start, args.user);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // All properties from original option and both middleware
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'start')).toBe(true);
      expect(typeHasProperty(result!.type, 'user')).toBe(true);
    });
  });

  describe('command-level middleware', () => {
    it('should apply middleware at command level', () => {
      const code = `
        import { cli } from 'cli-forge';

        interface CommandContext { commandStart: number; }

        function commandMiddleware<T>(args: T): T & CommandContext {
          return { ...args, commandStart: Date.now() };
        }

        cli('test')
          .option('global', { type: 'boolean' })
          .command('sub', {
            builder: (cmd) =>
              cmd
                .option('local', { type: 'string' })
                .middleware(commandMiddleware),
            handler: (args) => {
              console.log(args.global, args.local, args.commandStart);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // Should have global option, local option, and middleware property
      expect(typeHasProperty(result!.type, 'global')).toBe(true);
      expect(typeHasProperty(result!.type, 'local')).toBe(true);
      expect(typeHasProperty(result!.type, 'commandStart')).toBe(true);
    });
  });

});
