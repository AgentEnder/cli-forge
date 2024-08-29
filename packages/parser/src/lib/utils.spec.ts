import {
  fromCamelOrDashedCaseToConstCase,
  fromDashedToCamelCase,
  getEnvKey,
} from './utils';

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

  describe('fromCamelCaseToConstCase', () => {
    it.each([
      ['foo', 'FOO'],
      ['fooBar', 'FOO_BAR'],
      ['fooBarBaz', 'FOO_BAR_BAZ'],
      ['fooBarBazQux', 'FOO_BAR_BAZ_QUX'],
      ['someCLITool', 'SOME_CLI_TOOL'],
    ])('should convert %s to %s', (input, expected) => {
      expect(fromCamelOrDashedCaseToConstCase(input)).toEqual(expected);
    });
  });

  describe('getEnvKey', () => {
    it.each([
      ['FOO', 'bar', 'FOO_BAR'],
      ['FOO', 'baz', 'FOO_BAZ'],
      ['FOO', 'qux', 'FOO_QUX'],
      ['FOO', 'fooBar', 'FOO_FOO_BAR'],
      ['FOO', 'fooBarBaz', 'FOO_FOO_BAR_BAZ'],
      ['FOO', 'someCLI', 'FOO_SOME_CLI'],
      ['FOO', 'someCLITool', 'FOO_SOME_CLI_TOOL'],
      [undefined, 'foo-bar', 'FOO_BAR'],
      [undefined, 'FOO', 'FOO'],
    ])(
      'with prefix %s and key %s should return %s',
      (prefix, key, expected) => {
        expect(getEnvKey(prefix, key)).toEqual(expected);
      }
    );
  });
});
