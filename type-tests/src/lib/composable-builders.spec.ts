/**
 * Tests for composable builder type inference.
 *
 * These tests validate that:
 * - ArgumentsOf<T> correctly extracts args type from CLI instances
 * - Generic <T extends CLI> preserves accumulated types
 * - chain() threads types through composition
 * - makeComposableBuilder() return type inference works
 */
import { describe, it, expect } from 'vitest';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

/**
 * Helper to check if a type has a specific property.
 */
function typeHasProperty(type: ts.Type, propName: string): boolean {
  const props = type.getProperties();
  return props.some((p) => p.name === propName);
}

/**
 * Helper to find handler parameter type in code.
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

describe('Composable Builder Type Inference', () => {
  describe('ArgumentsOf type extraction', () => {
    it('should extract correct type in handler via composition', () => {
      const code = `
        import { cli, chain, makeComposableBuilder } from 'cli-forge';

        const withName = makeComposableBuilder((args) =>
          args.option('name', { type: 'string', required: true })
        );

        const withCount = makeComposableBuilder((args) =>
          args.option('count', { type: 'number', default: 1 })
        );

        cli('test', {
          builder: (args) => chain(args, withName, withCount),
        }).command('run', {
          handler: (args) => {
            console.log(args.name, args.count);
          },
        });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // Should have 'name' and 'count' properties from composed builders
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'count')).toBe(true);
    });

    it('should produce flat type from ArgumentsOf with composed builders', () => {
      const code = `
        import { cli, chain, makeComposableBuilder, ArgumentsOf, CLI } from 'cli-forge';

        const withName = makeComposableBuilder((args) =>
          args.option('name', { type: 'string', required: true })
        );

        const withAge = makeComposableBuilder((args) =>
          args.option('age', { type: 'number', required: true })
        );

        const builder = <T extends CLI>(args: T) => chain(args, withName, withAge);

        type Args = ArgumentsOf<typeof builder>;

        const testArgs: Args = null! as Args;
        const _check: string = testArgs.name;
        const _check2: number = testArgs.age;
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      // Find the Args type alias
      let argsType: ts.Type | null = null;
      ts.forEachChild(sourceFile, (node) => {
        if (
          ts.isTypeAliasDeclaration(node) &&
          node.name.text === 'Args'
        ) {
          argsType = typeChecker.getTypeAtLocation(node);
        }
      });

      expect(argsType).not.toBeNull();
      const typeString = typeChecker.typeToString(argsType!);

      // Should be a flat object type, not an intersection chain
      expect(typeString).not.toContain('MakeUndefinedPropertiesOptional');
      expect(typeString).not.toContain('Expand');
    });

    it('should handle optional vs required in handler', () => {
      const code = `
        import { cli } from 'cli-forge';

        cli('test')
          .option('required', { type: 'string', required: true })
          .option('optional', { type: 'string' })
          .option('withDefault', { type: 'number', default: 0 })
          .command('run', {
            handler: (args) => {
              // required: string (not undefined)
              // optional: string | undefined
              // withDefault: number (has default)
              console.log(args.required, args.optional, args.withDefault);
            },
          });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // All options should be present
      expect(typeHasProperty(result!.type, 'required')).toBe(true);
      expect(typeHasProperty(result!.type, 'optional')).toBe(true);
      expect(typeHasProperty(result!.type, 'withDefault')).toBe(true);
    });
  });

  describe('generic CLI extension', () => {
    it('should preserve types through generic extension', () => {
      const code = `
        import { CLI, cli, chain, makeComposableBuilder } from 'cli-forge';

        const withVerbose = makeComposableBuilder((argv) =>
          argv.option('verbose', { type: 'boolean', default: false })
        );

        cli('test', {
          builder: (args) => chain(
            args.option('name', { type: 'string' }),
            withVerbose
          ),
        }).command('run', {
          handler: (args) => {
            console.log(args.name, args.verbose);
          },
        });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // Should have both original and added options
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'verbose')).toBe(true);
    });
  });

  describe('chain function composition', () => {
    it('should thread types through chain', () => {
      const code = `
        import { CLI, cli, chain, makeComposableBuilder } from 'cli-forge';

        const withA = makeComposableBuilder((args) =>
          args.option('a', { type: 'string' })
        );

        const withB = makeComposableBuilder((args) =>
          args.option('b', { type: 'number' })
        );

        const withC = makeComposableBuilder((args) =>
          args.option('c', { type: 'boolean' })
        );

        cli('test', {
          builder: (args) => chain(args, withA, withB, withC),
        }).command('run', {
          handler: (args) => {
            const a: string | undefined = args.a;
            const b: number | undefined = args.b;
            const c: boolean | undefined = args.c;
            console.log(a, b, c);
          },
        });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();

      // Should have all chained options
      expect(typeHasProperty(result!.type, 'a')).toBe(true);
      expect(typeHasProperty(result!.type, 'b')).toBe(true);
      expect(typeHasProperty(result!.type, 'c')).toBe(true);
    });
  });

  describe('chain inside command builders', () => {
    it('should infer handler args when chain is used inside a command builder', () => {
      const code = `
        import { cli, chain, makeComposableBuilder } from 'cli-forge';

        const withName = makeComposableBuilder((args) =>
          args.option('name', { type: 'string', required: true })
        );

        const withGreeting = makeComposableBuilder((args) =>
          args.option('greeting', { type: 'string', default: 'Hello' })
        );

        cli('test').command('greet', {
          builder: (args) => chain(args, withName, withGreeting),
          handler: (args) => {
            console.log(args.name, args.greeting);
          },
        });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'greeting')).toBe(true);
    });

    it('should infer handler args when composable builder wraps a command with chain', () => {
      const code = `
        import { cli, chain, makeComposableBuilder } from 'cli-forge';

        const withName = makeComposableBuilder((args) =>
          args.option('name', { type: 'string', required: true })
        );

        const withGreeting = makeComposableBuilder((args) =>
          args.option('greeting', { type: 'string', default: 'Hello' })
        );

        const withGreetCommand = makeComposableBuilder((args) =>
          args.command('greet', {
            builder: (args) => chain(args, withName, withGreeting),
            handler: (args) => {
              console.log(args.name, args.greeting);
            },
          })
        );

        cli('test', {
          builder: (args) => chain(args, withGreetCommand),
        });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'greeting')).toBe(true);
    });

    it('should infer handler args when using manual <T extends UnknownCLI> in chain', () => {
      const code = `
        import { cli, chain, makeComposableBuilder, UnknownCLI } from 'cli-forge';

        // Manual generic approach - works because UnknownCLI uses ParsedArgs (not any)
        function withName<T extends UnknownCLI>(argv: T) {
          return argv.option('name', { type: 'string', required: true });
        }

        const withGreeting = makeComposableBuilder((args) =>
          args.option('greeting', { type: 'string', default: 'Hello' })
        );

        cli('test').command('greet', {
          builder: (args) => chain(args, withName, withGreeting),
          handler: (args) => {
            console.log(args.name, args.greeting);
          },
        });
      `;

      const result = findHandlerParamType(code);
      expect(result).not.toBeNull();
      expect(typeHasProperty(result!.type, 'name')).toBe(true);
      expect(typeHasProperty(result!.type, 'greeting')).toBe(true);
    });
  });

});
