import { describe, it, expect } from 'vitest';
import { findNodeBySelector, findAllNodesBySelector, CommonSelectors } from './query.js';
import { createTestProgram } from './compiler.js';
import * as ts from 'typescript';

describe('query utilities', () => {
  describe('findNodeBySelector', () => {
    it('should find a node by selector', () => {
      const code = `
        const config = {
          type: 'string',
          default: 'hello'
        };
      `;

      const { sourceFile } = createTestProgram(code);

      // Find the type property
      const typeProperty = findNodeBySelector(
        sourceFile,
        'PropertyAssignment[name.text="type"]'
      );

      expect(typeProperty).toBeDefined();
      expect(ts.isPropertyAssignment(typeProperty!)).toBe(true);
      expect((typeProperty as ts.PropertyAssignment).name.getText()).toBe('type');
    });

    it('should return undefined when no match found', () => {
      const code = `const x = 1;`;
      const { sourceFile } = createTestProgram(code);

      const node = findNodeBySelector(sourceFile, 'ClassDeclaration');

      expect(node).toBeUndefined();
    });

    it('should return the nth match when index is specified', () => {
      const code = `
        const a = { value: 1 };
        const b = { value: 2 };
        const c = { value: 3 };
      `;

      const { sourceFile } = createTestProgram(code);

      const first = findNodeBySelector(sourceFile, 'PropertyAssignment[name.text="value"]', 0);
      const second = findNodeBySelector(sourceFile, 'PropertyAssignment[name.text="value"]', 1);
      const third = findNodeBySelector(sourceFile, 'PropertyAssignment[name.text="value"]', 2);

      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(third).toBeDefined();
      expect(first).not.toBe(second);
      expect(second).not.toBe(third);
    });
  });

  describe('findAllNodesBySelector', () => {
    it('should find all matching nodes', () => {
      const code = `
        const a = { value: 1 };
        const b = { value: 2 };
        const c = { value: 3 };
      `;

      const { sourceFile } = createTestProgram(code);

      const nodes = findAllNodesBySelector(
        sourceFile,
        'PropertyAssignment[name.text="value"]'
      );

      expect(nodes).toHaveLength(3);
      nodes.forEach((node) => {
        expect(ts.isPropertyAssignment(node)).toBe(true);
      });
    });

    it('should return empty array when no matches found', () => {
      const code = `const x = 1;`;
      const { sourceFile } = createTestProgram(code);

      const nodes = findAllNodesBySelector(sourceFile, 'ClassDeclaration');

      expect(nodes).toEqual([]);
    });

    it('should find nested nodes', () => {
      const code = `
        const config = {
          nested: {
            deep: {
              value: 'hello'
            }
          }
        };
      `;

      const { sourceFile } = createTestProgram(code);

      // Find all StringLiteral nodes
      const stringLiterals = findAllNodesBySelector(sourceFile, 'StringLiteral');

      expect(stringLiterals.length).toBeGreaterThan(0);
    });
  });

  describe('CommonSelectors', () => {
    it('should find coerce callback parameters', () => {
      const code = `
        parser().option({
          type: 'string',
          coerce: (val) => val.toUpperCase()
        });
      `;

      const { sourceFile } = createTestProgram(code);

      const param = findNodeBySelector(sourceFile, CommonSelectors.coerceParam);

      expect(param).toBeDefined();
      expect(ts.isParameter(param!)).toBe(true);
    });

    it('should find properties value in object configs', () => {
      const code = `
        parser().option({
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'number' }
          }
        });
      `;

      const { sourceFile } = createTestProgram(code);

      const propertiesObj = findNodeBySelector(
        sourceFile,
        CommonSelectors.propertiesValue
      );

      expect(propertiesObj).toBeDefined();
      expect(ts.isObjectLiteralExpression(propertiesObj!)).toBe(true);
    });

    it('should find option calls', () => {
      const code = `
        parser()
          .option({ type: 'string' })
          .option({ type: 'number' })
          .option({ type: 'boolean' });
      `;

      const { sourceFile } = createTestProgram(code);

      const optionCalls = findAllNodesBySelector(
        sourceFile,
        CommonSelectors.optionCalls
      );

      expect(optionCalls.length).toBe(3);
    });

    it('should find default values', () => {
      const code = `
        const config = {
          type: 'string',
          default: 'hello world'
        };
      `;

      const { sourceFile } = createTestProgram(code);

      const defaultValue = findNodeBySelector(
        sourceFile,
        CommonSelectors.defaultValue
      );

      expect(defaultValue).toBeDefined();
    });

    it('should find object configs', () => {
      const code = `
        const stringOption = { type: 'string' };
        const objectOption = { type: 'object', properties: {} };
        const numberOption = { type: 'number' };
      `;

      const { sourceFile } = createTestProgram(code);

      const objectConfigs = findAllNodesBySelector(
        sourceFile,
        CommonSelectors.objectConfig
      );

      expect(objectConfigs.length).toBe(1);
    });
  });
});
