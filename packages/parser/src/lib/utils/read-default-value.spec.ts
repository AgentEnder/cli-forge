import { it, describe, expect } from 'vitest';
import { readDefaultValue } from './read-default-value';
describe('readDefaultValue', () => {
  it('should return the default value if no description provided', () => {
    const val = readDefaultValue({
      type: 'string',
      default: 'default',
    });
    expect(val).toEqual(['default', undefined]);
  });

  it('should return the default value with description', () => {
    const val = readDefaultValue({
      type: 'string',
      default: {
        value: 'default',
        description: 'description',
      },
    });
    expect(val).toEqual(['default', 'description']);
  });

  it('should return the default value with description from factory', () => {
    const val = readDefaultValue({
      type: 'string',
      default: {
        factory: () => 'default',
        description: 'description',
      },
    });
    expect(val).toEqual(['default', 'description']);
  });

  it('should return plain object default values', () => {
    const val = readDefaultValue({
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      default: { foo: 'bar' },
    });
    expect(val).toEqual([{ foo: 'bar' }, undefined]);
  });

  it('should return object default values with description', () => {
    const val = readDefaultValue({
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      default: {
        value: { foo: 'bar' },
        description: 'Object default description',
      },
    });
    expect(val).toEqual([{ foo: 'bar' }, 'Object default description']);
  });
});
