import { fromDashedToCamelCase } from './utils';

describe('utils', () => {
  describe('fromDashedToCamelCase', () => {
    it.each([
      ['foo', 'foo'],
      ['foo-bar', 'fooBar'],
      ['foo-bar-baz', 'fooBarBaz'],
      ['foo-bar-baz-qux', 'fooBarBazQux'],
    ])('should convert %s to %s', (input, expected) => {
      expect(fromDashedToCamelCase(input)).toEqual(expected);
    });
  });
});
