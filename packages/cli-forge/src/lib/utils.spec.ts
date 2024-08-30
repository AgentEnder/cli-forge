import { stringToArgs } from './utils';

describe('utils', () => {
  describe('stringToArgs', () => {
    it.each([
      ['hello', ['hello']],
      ['hello world', ['hello', 'world']],
      ['hello "world"', ['hello', 'world']],
      ['hello "mom and dad"', ['hello', 'mom and dad']],
      [
        'hello "mom and dad" "brother and sister"',
        ['hello', 'mom and dad', 'brother and sister'],
      ],
      [
        'hello "mom and \\"dad\\"" "brother and sister"',
        ['hello', 'mom and "dad"', 'brother and sister'],
      ],
      ["hello 'world'", ['hello', 'world']],
      ["hello 'mom and dad'", ['hello', 'mom and dad']],
      ['hello \'mom and "dad"\'', ['hello', 'mom and "dad"']],
    ])(`should parse %s`, (input, expected) => {
      expect(stringToArgs(input)).toEqual(expected);
    });
  });
});
