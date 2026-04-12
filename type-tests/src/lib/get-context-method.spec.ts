/**
 * Tests for `cli.getContext()` instance method type inference.
 *
 * `getContext()` is a shorthand for `getCommandContext(cli)` that lives
 * on the CLI instance itself. The risk this file guards against is the
 * method's return type collapsing to `any` or losing its provider /
 * args information — which would make `ctx.args.foo` and
 * `ctx.inject('bar')` silently return `any`.
 */
import { describe, it, expect } from 'vitest';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

/**
 * Locate a variable declaration by name and return its resolved type.
 */
function findVariableType(
  code: string,
  variableName: string
): { type: ts.Type; typeString: string } | null {
  const { typeChecker, sourceFile } = createTestProgram(code);

  function visit(node: ts.Node): ts.Type | null {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      return typeChecker.getTypeAtLocation(node);
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
 * Check whether a type has a property by name.
 */
function typeHasProperty(type: ts.Type, propName: string): boolean {
  return type.getProperties().some((p) => p.name === propName);
}

/**
 * Check whether a type is (or contains at the top level) `any`.
 * The TypeChecker exposes a TypeFlags.Any bit on the top-level type.
 */
function isAnyType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

describe('cli.getContext() instance method type inference', () => {
  // Note: the test code calls `app.getContext()` at module top level
  // rather than inside a handler. At runtime `getContext()` throws when
  // called outside a handler — but we're only type-checking via tsc, so
  // the call site never executes. Calling from inside the handler body
  // triggers a chicken-and-egg where `app` is referenced inside its own
  // initializer, which causes TypeScript to widen `app` to `any` and
  // defeats the whole point of the test.

  it('exposes args with typed options (not `any`) — mirrors docblock example', () => {
    // This mirrors the `.command('migrate', ...)` example attached to the
    // getContext() docblock in public-api.ts. `db` is a non-trivial
    // provider shape so an `any` collapse is easy to spot, and `verbose`
    // exercises that args from a parent builder are preserved.
    const code = `
      import { cli } from 'cli-forge';

      interface Db {
        runMigrations(): { migrated: number };
      }

      const app = cli('app')
        .option('verbose', { type: 'boolean' })
        .provide('db', { factory: (): Db => ({ runMigrations: () => ({ migrated: 0 }) }) });

      const ctx = app.getContext();
      const args = ctx.args;
    `;

    const argsResult = findVariableType(code, 'args');
    expect(argsResult).not.toBeNull();

    // args must NOT collapse to `any`
    expect(isAnyType(argsResult!.type)).toBe(false);
    // args must carry the `verbose` option
    expect(typeHasProperty(argsResult!.type, 'verbose')).toBe(true);
  });

  it('inject() returns the provider shape, not `any`', () => {
    const code = `
      import { cli } from 'cli-forge';

      interface Db {
        runMigrations(): { migrated: number };
      }

      const app = cli('app')
        .provide('db', { factory: (): Db => ({ runMigrations: () => ({ migrated: 0 }) }) });

      const ctx = app.getContext();
      const db = ctx.inject('db');
    `;

    const dbResult = findVariableType(code, 'db');
    expect(dbResult).not.toBeNull();

    // The injected Db must not be `any`
    expect(isAnyType(dbResult!.type)).toBe(false);
    // It must carry the `runMigrations` method defined on the Db interface
    expect(typeHasProperty(dbResult!.type, 'runMigrations')).toBe(true);
  });

  it('commandChain is typed as string[] on the returned context', () => {
    const code = `
      import { cli } from 'cli-forge';

      const app = cli('app');
      const ctx = app.getContext();
      const commandChain = ctx.commandChain;
    `;

    const chainResult = findVariableType(code, 'commandChain');
    expect(chainResult).not.toBeNull();
    expect(isAnyType(chainResult!.type)).toBe(false);
    // typeToString normalizes `string[]` for readable assertions
    expect(chainResult!.typeString).toBe('string[]');
  });

  it('the full context object is not `any`', () => {
    const code = `
      import { cli } from 'cli-forge';

      const app = cli('app')
        .option('verbose', { type: 'boolean' })
        .provide('svc', { hello: 'world' });

      const ctx = app.getContext();
    `;

    const ctxResult = findVariableType(code, 'ctx');
    expect(ctxResult).not.toBeNull();

    // The whole context must not collapse to `any`
    expect(isAnyType(ctxResult!.type)).toBe(false);
    // Its expected members must be present
    expect(typeHasProperty(ctxResult!.type, 'args')).toBe(true);
    expect(typeHasProperty(ctxResult!.type, 'inject')).toBe(true);
    expect(typeHasProperty(ctxResult!.type, 'commandChain')).toBe(true);
    expect(typeHasProperty(ctxResult!.type, 'getChildContext')).toBe(true);
  });
});
