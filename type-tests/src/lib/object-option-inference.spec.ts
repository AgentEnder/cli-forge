/**
 * Tests for object option type inference.
 *
 * These tests validate that the ObjectOptionConfig type correctly infers types
 * for validate/coerce callbacks, default values, and nested properties.
 *
 * Key scenarios tested:
 * 1. validate callback parameter type (should NOT be unknown)
 * 2. coerce callback parameter type (should get ObjectValue type)
 * 3. default property doesn't break inference
 * 4. nested objects resolve correctly
 */
import { describe, it, expect } from 'vitest';
import { createTestProgram } from './compiler.js';
import { walkType } from './type-walker.js';
import * as ts from 'typescript';

/**
 * Helper to find the type of a parameter in a callback.
 * Searches for ArrowFunction parameters in the source file.
 */
function findCallbackParamType(
  code: string,
  callbackName: string
): { type: ts.Type; typeString: string } | null {
  const { typeChecker, sourceFile } = createTestProgram(code);

  function visit(node: ts.Node): ts.Type | null {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === callbackName &&
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
 * Helper to get semantic diagnostics for code
 */
function getDiagnostics(code: string): readonly ts.Diagnostic[] {
  const { program, sourceFile } = createTestProgram(code);
  return ts.getPreEmitDiagnostics(program, sourceFile);
}

/**
 * Check if a type is 'unknown'
 */
function isUnknownType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Unknown) !== 0;
}

/**
 * Check if type string contains 'unknown'
 */
function containsUnknown(typeString: string): boolean {
  return typeString === 'unknown' || typeString.includes(': unknown');
}

describe('Object Option Type Inference', () => {
  describe('validate callback parameter type', () => {
    it('should NOT be unknown for simple object with properties', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              host: { type: 'string' },
              port: { type: 'number' },
            },
            validate: (config) => config.host !== undefined,
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
      expect(isUnknownType(paramType!.type)).toBe(false);
      expect(paramType!.typeString).toMatchInlineSnapshot(`"{ readonly host: string | undefined; readonly port: number | undefined; }"`);
    });

    it('should have correct property types in validate callback', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              name: { type: 'string' },
              count: { type: 'number' },
              enabled: { type: 'boolean' },
            },
            validate: (config) => {
              // Access properties to verify types
              const n: string | undefined = config.name;
              const c: number | undefined = config.count;
              const e: boolean | undefined = config.enabled;
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      // Should have no type errors
      expect(diagnostics).toMatchObject([]);
    });

    it('should work with nested object properties in validate', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              server: {
                type: 'object',
                properties: {
                  host: { type: 'string' },
                  port: { type: 'number' },
                },
              },
            },
            validate: (config) => {
              // Should be able to access nested properties
              return config.server?.host !== undefined;
            },
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });

    it('should NOT break when default is present', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              server: {
                type: 'object',
                properties: {
                  host: { type: 'string' },
                },
              },
            },
            default: { server: { host: 'localhost' } },
            validate: (config) => config.server !== undefined,
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });

    it('should work with two nested objects and default', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              server: {
                type: 'object',
                properties: {
                  host: { type: 'string', default: 'localhost' },
                },
              },
              database: {
                type: 'object',
                properties: {
                  name: { type: 'string', required: true },
                },
              },
            },
            default: { server: { host: 'localhost' } },
            validate: (config) => {
              // Both nested objects should be accessible
              const serverHost = config.server?.host;
              const dbName = config.database?.name;
              return true;
            },
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });
  });

  describe('coerce callback parameter type', () => {
    it('should receive the computed ObjectValue type', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
            },
            coerce: (config) => {
              // config should have name and value properties
              return { ...config, computed: config.name + config.value };
            },
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'coerce');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });

    it('should work with nested objects in coerce', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              server: {
                type: 'object',
                properties: {
                  host: { type: 'string' },
                  port: { type: 'number' },
                  ssl: { type: 'boolean' },
                },
              },
            },
            coerce: (config) => {
              // Should be able to access nested server properties
              const url = config.server?.ssl
                ? 'https://' + config.server.host
                : 'http://' + config.server.host;
              return config;
            },
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'coerce');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });
  });

  describe('default property handling', () => {
    it('should not break inference when default is empty object', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            default: {},
            validate: (config) => config.name !== undefined,
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });

    it('should not break inference when default has nested values', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              server: {
                type: 'object',
                properties: {
                  host: { type: 'string' },
                  port: { type: 'number' },
                },
              },
              features: {
                type: 'array',
                items: 'string',
              },
            },
            default: {
              server: { host: 'localhost', port: 3000 },
              features: ['basic'],
            },
            validate: (config) => {
              return config.server?.port !== undefined;
            },
          })
          .parse([]);
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });
  });

  describe('complete scenarios', () => {
    it('should handle full config with nested objects, callbacks, and default', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              server: {
                type: 'object',
                properties: {
                  host: { type: 'string', default: 'localhost' },
                  port: { type: 'number', default: 3000 },
                },
              },
              database: {
                type: 'object',
                properties: {
                  host: { type: 'string', required: true },
                  name: { type: 'string', required: true },
                },
              },
              features: {
                type: 'array',
                items: 'string',
                default: ['basic'],
              },
            },
            default: {
              server: { host: 'localhost', port: 3000 },
              features: ['basic'],
            },
            validate: (config) => {
              if (config.server?.port && (config.server.port < 1 || config.server.port > 65535)) {
                return 'Invalid port';
              }
              return true;
            },
            coerce: (config) => {
              // Transform the config
              return config;
            },
          })
          .parse([]);
      `;

      const validateType = findCallbackParamType(code, 'validate');
      const coerceType = findCallbackParamType(code, 'coerce');

      expect(validateType).not.toBeNull();
      expect(coerceType).not.toBeNull();
      expect(containsUnknown(validateType!.typeString)).toBe(false);
      expect(containsUnknown(coerceType!.typeString)).toBe(false);
    });

    it('should work with cli-forge wrapper', () => {
      const code = `
        import cliForge from 'cli-forge';

        const cli = cliForge('test', {
          builder: (args) =>
            args.option('config', {
              type: 'object',
              properties: {
                server: {
                  type: 'object',
                  properties: {
                    host: { type: 'string', default: 'localhost' },
                    port: { type: 'number', default: 3000 },
                  },
                },
              },
              default: { server: { host: 'localhost', port: 3000 } },
              validate: (config) => config.server?.host !== undefined,
            }),
          handler: (args) => {
            // args.config should have proper type
            console.log(args.config?.server?.host);
          },
        });
      `;

      const paramType = findCallbackParamType(code, 'validate');
      expect(paramType).not.toBeNull();
      expect(containsUnknown(paramType!.typeString)).toBe(false);
    });
  });

  describe('property type resolution', () => {
    it('should resolve string properties correctly', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            validate: (config) => {
              // This should compile - name is string | undefined
              const nameLength = config.name?.length;
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      expect(diagnostics.length).toBe(0);
    });

    it('should resolve number properties correctly', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              count: { type: 'number' },
            },
            validate: (config) => {
              // This should compile - count is number | undefined
              const fixed = config.count?.toFixed(2);
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      expect(diagnostics.length).toBe(0);
    });

    it('should resolve boolean properties correctly', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
            },
            validate: (config) => {
              // This should compile - enabled is boolean | undefined
              const str = config.enabled?.toString();
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      expect(diagnostics.length).toBe(0);
    });

    it('should resolve array properties correctly', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              items: { type: 'array', items: 'string' },
            },
            validate: (config) => {
              // This should compile - items is string[] | undefined
              const count = config.items?.length;
              const first = config.items?.[0];
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      expect(diagnostics.length).toBe(0);
    });

    it('should respect required flag - no undefined for required properties', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              name: { type: 'string', required: true },
            },
            validate: (config) => {
              // name is required, so it should be string (not string | undefined)
              // This should work without optional chaining
              const len = config.name.length;
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      // Should have no errors - name is required so .length works
      expect(diagnostics.length).toBe(0);
    });

    it('should respect default - no undefined for properties with default', () => {
      const code = `
        import { parser } from '@cli-forge/parser';

        const result = parser()
          .option('config', {
            type: 'object',
            properties: {
              name: { type: 'string', default: 'default-name' },
            },
            validate: (config) => {
              // name has default, so it should be string (not string | undefined)
              const len = config.name.length;
              return true;
            },
          })
          .parse([]);
      `;

      const diagnostics = getDiagnostics(code);
      // Should have no errors - name has default so .length works
      expect(diagnostics.length).toBe(0);
    });
  });
});
