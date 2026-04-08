/**
 * Tests for oneOf option type inference through the CLI layer.
 *
 * These tests validate that:
 * - oneOf options produce correct union types in handler args
 * - choices narrowing works with boolean entries (distribution bug regression)
 * - default/required interact correctly with oneOf unions
 * - multiple options with oneOf produce correct combined types
 */
import { describe, it, expect } from 'vitest';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

/**
 * Find the handler parameter type from a fluent .handler() call
 * or a command config { handler: (args) => ... }.
 */
function findHandlerParamType(
  code: string
): { type: ts.Type; typeString: string; typeChecker: ts.TypeChecker } | null {
  const { typeChecker, sourceFile } = createTestProgram(code);

  function visit(node: ts.Node): ts.Type | null {
    // Match .handler((args) => ...) fluent call
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'handler' &&
      node.arguments.length > 0 &&
      ts.isArrowFunction(node.arguments[0])
    ) {
      const arrowFn = node.arguments[0] as ts.ArrowFunction;
      if (arrowFn.parameters.length > 0) {
        return typeChecker.getTypeAtLocation(arrowFn.parameters[0]);
      }
    }

    // Match handler: (args) => ... in command config
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'handler' &&
      ts.isArrowFunction(node.initializer)
    ) {
      const arrowFn = node.initializer;
      if (arrowFn.parameters.length > 0) {
        return typeChecker.getTypeAtLocation(arrowFn.parameters[0]);
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

describe('oneOf Type Inference (CLI layer)', () => {
  it('should infer string | boolean union in handler args', () => {
    const code = `
      import { cli } from 'cli-forge';

      cli('test')
        .option('color', {
          type: 'oneOf',
          valueTypes: [{ type: 'string' }, { type: 'boolean' }],
        })
        .handler((args) => {
          console.log(args.color);
        });
    `;

    const result = findHandlerParamType(code);
    expect(result).not.toBeNull();

    const colorType = getPropertyType(
      result!.type,
      'color',
      result!.typeChecker
    );
    expect(colorType).not.toBeNull();
    expect(colorType).toContain('string');
    expect(colorType).toContain('boolean');
  });

  it('should preserve boolean in union when choices are on string entry (distribution regression)', () => {
    const code = `
      import { cli } from 'cli-forge';

      cli('test')
        .option('color', {
          type: 'oneOf',
          valueTypes: [
            { type: 'string', choices: ['auto', 'always', 'never'] as const },
            { type: 'boolean' },
          ],
          default: 'auto',
        })
        .handler((args) => {
          console.log(args.color);
        });
    `;

    const result = findHandlerParamType(code);
    expect(result).not.toBeNull();

    const colorType = getPropertyType(
      result!.type,
      'color',
      result!.typeChecker
    );
    expect(colorType).not.toBeNull();
    // Must include both the narrowed choices AND boolean
    expect(colorType).toContain('boolean');
    expect(colorType).toMatch(/auto|always|never/);
    // Must NOT include undefined (has default)
    expect(colorType).not.toContain('undefined');
  });

  it('should include undefined when no default or required', () => {
    const code = `
      import { cli } from 'cli-forge';

      cli('test')
        .option('color', {
          type: 'oneOf',
          valueTypes: [{ type: 'string' }, { type: 'boolean' }],
        })
        .handler((args) => {
          console.log(args.color);
        });
    `;

    const result = findHandlerParamType(code);
    expect(result).not.toBeNull();

    const colorType = getPropertyType(
      result!.type,
      'color',
      result!.typeChecker
    );
    expect(colorType).toContain('undefined');
  });

  it('should produce flat type with all properties from multiple options', () => {
    const code = `
      import { cli } from 'cli-forge';

      cli('test')
        .option('color', {
          type: 'oneOf',
          valueTypes: [
            { type: 'string', choices: ['auto', 'always', 'never'] as const },
            { type: 'boolean' },
          ],
          default: 'auto',
        })
        .option('verbose', { type: 'boolean' })
        .option('port', { type: 'number', default: 3000 })
        .handler((args) => {
          console.log(args.color, args.verbose, args.port);
        });
    `;

    const result = findHandlerParamType(code);
    expect(result).not.toBeNull();

    // All properties should be present on the type
    const colorType = getPropertyType(result!.type, 'color', result!.typeChecker);
    const verboseType = getPropertyType(result!.type, 'verbose', result!.typeChecker);
    const portType = getPropertyType(result!.type, 'port', result!.typeChecker);

    expect(colorType).toContain('boolean');
    expect(colorType).toMatch(/auto|always|never/);
    expect(verboseType).toContain('boolean');
    expect(portType).toContain('number');

    // The type string should NOT contain 'MakeUndefinedPropertiesOptional'
    // or intersection '&' markers — it should be a flat object
    expect(result!.typeString).not.toContain('MakeUndefinedPropertiesOptional');
  });

  it('should work with command config handler (not just fluent)', () => {
    const code = `
      import { cli } from 'cli-forge';

      cli('test')
        .option('color', {
          type: 'oneOf',
          valueTypes: [{ type: 'string' }, { type: 'boolean' }],
          required: true,
        })
        .command('run', {
          handler: (args) => {
            console.log(args.color);
          },
        });
    `;

    const result = findHandlerParamType(code);
    expect(result).not.toBeNull();

    const colorType = getPropertyType(
      result!.type,
      'color',
      result!.typeChecker
    );
    expect(colorType).toContain('string');
    expect(colorType).toContain('boolean');
    expect(colorType).not.toContain('undefined');
  });
});
