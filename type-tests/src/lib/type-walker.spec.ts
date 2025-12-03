import { describe, it, expect } from 'vitest';
import { walkType } from './type-walker.js';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

describe('type-walker', () => {
  describe('walkType', () => {
    it('should handle primitive types', () => {
      const code = `
        const str: string = "hello";
        const num: number = 42;
        const bool: boolean = true;
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      // Find variable declarations and check their types
      const statements = sourceFile.statements;

      statements.forEach((stmt) => {
        if (ts.isVariableStatement(stmt)) {
          const declaration = stmt.declarationList.declarations[0];
          const type = typeChecker.getTypeAtLocation(declaration);
          const typeNode = walkType(type, typeChecker);

          expect(typeNode).toBeDefined();
          expect(['string', 'number', 'boolean']).toContain(typeNode.kind);
        }
      });
    });

    it('should handle object types with properties', () => {
      const code = `
        interface Person {
          name: string;
          age: number;
          email?: string;
        }
        const person: Person = { name: "Alice", age: 30 };
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      // Find the Person interface
      const interfaceDecl = sourceFile.statements.find(ts.isInterfaceDeclaration);
      expect(interfaceDecl).toBeDefined();

      const type = typeChecker.getTypeAtLocation(interfaceDecl!);
      const typeNode = walkType(type, typeChecker);

      expect(typeNode.kind).toBe('object');
      expect(typeNode.properties).toBeDefined();
      expect(typeNode.properties!.length).toBe(3);

      const nameProperty = typeNode.properties!.find((p) => p.name === 'name');
      expect(nameProperty).toBeDefined();
      expect(nameProperty!.type.kind).toBe('string');
      expect(nameProperty!.isOptional).toBe(false);

      const emailProperty = typeNode.properties!.find((p) => p.name === 'email');
      expect(emailProperty).toBeDefined();
      expect(emailProperty!.isOptional).toBe(true);
    });

    it('should handle union types', () => {
      const code = `
        type StringOrNumber = string | number;
        const value: StringOrNumber = "hello";
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      const typeAlias = sourceFile.statements.find(ts.isTypeAliasDeclaration);
      expect(typeAlias).toBeDefined();

      const type = typeChecker.getTypeAtLocation(typeAlias!);
      const typeNode = walkType(type, typeChecker);

      expect(typeNode.kind).toBe('union');
      expect(typeNode.children).toBeDefined();
      expect(typeNode.children!.length).toBe(2);

      const kinds = typeNode.children!.map((c) => c.kind);
      expect(kinds).toContain('string');
      expect(kinds).toContain('number');
    });

    it('should handle Record types (index signatures)', () => {
      const code = `
        type StringRecord = Record<string, string>;
        const record: StringRecord = { foo: "bar" };
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      const typeAlias = sourceFile.statements.find(ts.isTypeAliasDeclaration);
      expect(typeAlias).toBeDefined();

      const type = typeChecker.getTypeAtLocation(typeAlias!);
      const typeNode = walkType(type, typeChecker);

      expect(typeNode.metadata?.hasIndexSignature).toBe(true);
      expect(typeNode.metadata?.indexSignature?.keyType).toBe('string');
    });

    it('should handle generic types with type arguments', () => {
      const code = `
        interface Container<T> {
          value: T;
        }
        const container: Container<string> = { value: "hello" };
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      const varStatement = sourceFile.statements.find(ts.isVariableStatement);
      expect(varStatement).toBeDefined();

      const declaration = varStatement!.declarationList.declarations[0];
      const type = typeChecker.getTypeAtLocation(declaration);
      const typeNode = walkType(type, typeChecker);

      expect(typeNode.kind).toBe('reference');
      expect(typeNode.typeArguments).toBeDefined();
      expect(typeNode.typeArguments!.length).toBe(1);
      expect(typeNode.typeArguments![0].kind).toBe('string');
    });

    it('should respect depth limit', () => {
      const code = `
        interface Nested {
          a: { b: { c: { d: { e: string } } } };
        }
        const nested: Nested = { a: { b: { c: { d: { e: "deep" } } } } };
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      const interfaceDecl = sourceFile.statements.find(ts.isInterfaceDeclaration);
      expect(interfaceDecl).toBeDefined();

      const type = typeChecker.getTypeAtLocation(interfaceDecl!);

      // With depth limit of 2
      const typeNode = walkType(type, typeChecker, 2);

      expect(typeNode.kind).toBe('object');
      expect(typeNode.properties).toBeDefined();

      // First level property 'a'
      const aProp = typeNode.properties!.find((p) => p.name === 'a');
      expect(aProp).toBeDefined();

      // Second level property 'b' should exist
      const bProp = aProp!.type.properties?.find((p) => p.name === 'b');
      expect(bProp).toBeDefined();

      // Third level should hit max depth
      expect(bProp!.type.kind).toBe('max-depth');
    });

    it('should handle intersection types', () => {
      const code = `
        type A = { foo: string };
        type B = { bar: number };
        type AB = A & B;
        const ab: AB = { foo: "hello", bar: 42 };
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      const typeAlias = sourceFile.statements
        .filter(ts.isTypeAliasDeclaration)
        .find((t) => t.name.text === 'AB');
      expect(typeAlias).toBeDefined();

      const type = typeChecker.getTypeAtLocation(typeAlias!);
      const typeNode = walkType(type, typeChecker);

      expect(typeNode.kind).toBe('intersection');
      expect(typeNode.children).toBeDefined();
      expect(typeNode.children!.length).toBe(2);
    });
  });
});
