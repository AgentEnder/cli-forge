import { describe, it, expect } from 'vitest';
import { createTestProgram, createProgramFromFile, findTsConfig } from './compiler.js';
import * as path from 'path';

describe('compiler utilities', () => {
  describe('createTestProgram', () => {
    it('should create a program from code string', () => {
      const code = `
        const foo: string = "hello";
        const bar: number = 42;
      `;

      const result = createTestProgram(code);

      expect(result.program).toBeDefined();
      expect(result.typeChecker).toBeDefined();
      expect(result.sourceFile).toBeDefined();
      expect(result.sourceFile.fileName).toBe('__test__.ts');
    });

    it('should use custom file name', () => {
      const code = `const x = 1;`;
      const result = createTestProgram(code, 'custom.ts');

      expect(result.sourceFile.fileName).toBe('custom.ts');
    });

    it('should allow type checking the code', () => {
      const code = `
        interface Person {
          name: string;
          age: number;
        }
        const person: Person = { name: "Alice", age: 30 };
      `;

      const { typeChecker, sourceFile } = createTestProgram(code);

      // Find the person variable declaration
      const statements = sourceFile.statements;
      expect(statements.length).toBeGreaterThan(0);

      // Verify the type checker works
      const diagnostics = typeChecker.getSemanticDiagnostics(sourceFile);
      expect(diagnostics.length).toBe(0);
    });
  });

  describe('findTsConfig', () => {
    it('should find tsconfig.json from type-tests directory', () => {
      const fromPath = path.join(process.cwd(), 'src');
      const configPath = findTsConfig(fromPath);

      expect(configPath).toBeDefined();
      expect(configPath).toContain('tsconfig.json');
    });

    it('should return undefined if no tsconfig found', () => {
      // Start from root directory where no tsconfig should exist
      const configPath = findTsConfig('/');
      expect(configPath).toBeUndefined();
    });
  });

  describe('createProgramFromFile', () => {
    it('should throw error for non-absolute path', () => {
      expect(() => {
        createProgramFromFile('relative/path.ts');
      }).toThrow('File path must be absolute');
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        createProgramFromFile('/nonexistent/file.ts');
      }).toThrow('File not found');
    });

    // Note: We can't easily test the success case without a known file
    // in the repository. That would be covered by integration tests.
  });
});
