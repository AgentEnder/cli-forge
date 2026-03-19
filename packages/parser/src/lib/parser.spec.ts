import { join } from 'path';
import { parser } from './parser';

import 'vitest';
import { expect, describe, it } from 'vitest';
import { ConfigurationProvider } from './config-files/configuration-loader';
import { AggregateConfigProvider } from './config-files/aggregate-config-provider';

interface CustomMatchers<R = unknown> {
  toThrowAggregateErrorContaining: (...expected: Array<string | Error>) => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

function makeMockConfigLoader<T>(config: Record<string, T>) {
  return {
    resolve: (file) => {
      const p = file.endsWith('.myclirc') ? file : join(file, '.myclirc');
      return config[p] ? p : undefined;
    },
    load: (file) => config[file],
  } as ConfigurationProvider<any>;
}

expect.extend({
  toThrowAggregateErrorContaining(
    received: () => void,
    ...expected: Array<string | Error>
  ) {
    try {
      received();
      return {
        pass: false,
        message: () => 'Expected function to throw an AggregateError',
      };
    } catch (e) {
      if (e instanceof AggregateError) {
        const errors = e.errors.map((m) => m.message);
        const pass = expected.every((e) => {
          if (typeof e === 'string') {
            return errors.some((error) => error.includes(e));
          } else {
            return errors.some((error) => error === e.message);
          }
        });
        return {
          pass,
          message: () =>
            pass ? '' : `Expected "${errors}" to contain "${expected}"`,
          actual: errors,
          expected,
        };
      }
      return {
        pass: false,
        message: () =>
          `Expected function to throw an AggregateError, but it threw ${e}`,
      };
    }
  },
});

describe('parser', () => {
  it('should work for string values', () => {
    expect(
      parser().option('foo', { type: 'string' }).parse(['--foo', 'bar'])
    ).toEqual({ foo: 'bar', unmatched: [] });
  });

  it('should work for number values', () => {
    expect(
      parser().option('foo', { type: 'number' }).parse(['--foo', '42'])
    ).toEqual({ foo: 42, unmatched: [] });
  });

  it('should work for boolean values', () => {
    expect(
      parser().option('foo', { type: 'boolean' }).parse(['--foo', 'false'])
    ).toEqual({ foo: false, unmatched: [] });
  });

  it('should handle --boolean for boolean values', () => {
    expect(
      parser().option('foo', { type: 'boolean' }).parse(['--foo'])
    ).toEqual({ foo: true, unmatched: [] });
  });

  it('should handle --no-boolean for boolean values', () => {
    expect(
      parser().option('foo', { type: 'boolean' }).parse(['--no-foo'])
    ).toEqual({ foo: false, unmatched: [] });
  });

  it('should work for multiple values', () => {
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .option('baz', { type: 'boolean' })
        .option('qux', { type: 'string' })
        .parse([
          '--foo',
          'hello',
          '--bar',
          '42',
          '--baz',
          'true',
          '--qux',
          'world',
        ])
    ).toEqual({
      foo: 'hello',
      bar: 42,
      baz: true,
      qux: 'world',
      unmatched: [],
    });
  });

  it('should handle space separated arrays', () => {
    expect(
      parser()
        .option('foo', { type: 'array', items: 'string' })
        .parse(['--foo', 'hello', 'world'])
    ).toEqual({ foo: ['hello', 'world'], unmatched: [] });
  });

  it('should handle comma separated arrays', () => {
    expect(
      parser()
        .option('foo', { type: 'array', items: 'string' })
        .parse(['--foo', 'hello,world'])
    ).toEqual({ foo: ['hello', 'world'], unmatched: [] });
  });

  it('should handle arrays passed as multiple arguments', () => {
    expect(
      parser()
        .option('foo', { type: 'array', items: 'string' })
        .parse(['--foo', 'hello', '--foo', 'world'])
    ).toEqual({ foo: ['hello', 'world'], unmatched: [] });
  });

  it('should handle space separated number arrays', () => {
    expect(
      parser()
        .option('foo', { type: 'array', items: 'number' })
        .parse(['--foo', '1', '2'])
    ).toEqual({ foo: [1, 2], unmatched: [] });
  });

  it('should handle multiple arrays', () => {
    expect(
      parser()
        .option('foo', { type: 'array', items: 'string' })
        .option('bar', { type: 'array', items: 'number' })
        .parse(['--foo', 'hello', 'world', '--bar', '1', '2'])
    ).toEqual({ foo: ['hello', 'world'], bar: [1, 2], unmatched: [] });
  });

  it('should handle positional arguments', () => {
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .option('baz', { type: 'boolean' })
        .option('qux', { type: 'string' })
        .positional('quux', { type: 'string' })
        .positional('corge', { type: 'number' })
        .parse(['--foo', 'hello', '--bar', '42', '--baz', 'true', 'world', '1'])
    ).toEqual({
      foo: 'hello',
      bar: 42,
      baz: true,
      quux: 'world',
      corge: 1,
      unmatched: [],
    });
  });

  it('should be able to parse positional arguments without options', () => {
    expect(
      parser()
        .positional('foo', { type: 'string' })
        .positional('bar', { type: 'number' })
        .positional('baz', { type: 'string' })
        .parse([
          'The meaning of life is',
          '--bar',
          '42',
          'to be',
          'or not to be',
        ])
    ).toMatchInlineSnapshot(`
      {
        "bar": 42,
        "baz": "to be",
        "foo": "The meaning of life is",
        "unmatched": [
          "or not to be",
        ],
      }
    `);
  });

  it('should collect unmatched arguments', () => {
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .parse(['--foo', 'hello', 'world', '--bar', '42', '--baz', 'true'])
    ).toEqual({ foo: 'hello', bar: 42, unmatched: ['world', '--baz', 'true'] });
  });

  it('should have correct typings', () => {
    const parsed = parser()
      .option('foo', {
        type: 'string',
        default: 'hello',
        choices: ['hello'],
      })
      .option('bar', { type: 'number', required: true })
      .option('baz', { type: 'boolean' })
      .option('bam', { type: 'array', items: 'string' })
      .option('qux', { type: 'array', items: 'number', default: [1] })
      .option('env', {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
          bar: {
            type: 'boolean',
          },
        },
      })
      .parse([
        '--foo',
        'hello',
        '--bar',
        '42',
        '--baz',
        'true',
        '--bam',
        'world',
        '--qux',
        '1',
        '2',
        '--env.foo=foo',
        '--env.bar',
      ]);

    // The following lines should not throw type errors.
    parsed.foo?.charAt(0);
    // Bar is required, so it can't be undefined
    parsed.bar.toFixed();
    parsed.baz?.valueOf();
    // @ts-expect-error Bam is not required, so it can be undefined.
    parsed.bam.join('');
    // Bam doesn't error if we use ?.
    parsed.bam?.join('');
    // Qux is not required, but it has a default value, so it can't be undefined
    parsed.qux.reduce((acc, val) => acc + val, 0);
    parsed.env?.foo?.charAt(0);
    parsed.env?.bar?.valueOf();
  });

  it('should allow customizing unmatched parser', () => {
    expect(
      parser({
        unmatchedParser: () => true,
      })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', 'world', '--bar', '42', '--baz', 'true'])
    ).toEqual({
      foo: 'hello',
      // The unmatched parser should have handled the arguments, so nothing should be unmatched
      unmatched: [],
    });
  });

  it('should throw error in strict mode when unmatched arguments are present', () => {
    expect(() =>
      parser({ strict: true })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', 'world'])
    ).toThrowAggregateErrorContaining('Unknown argument: world');
  });

  it('should throw error in strict mode for unmatched flags', () => {
    expect(() =>
      parser({ strict: true })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', '--bar', '42'])
    ).toThrowAggregateErrorContaining('Unknown argument: --bar', 'Unknown argument: 42');
  });

  it('should not throw error in strict mode when all arguments are matched', () => {
    expect(
      parser({ strict: true })
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .parse(['--foo', 'hello', '--bar', '42'])
    ).toEqual({ foo: 'hello', bar: 42, unmatched: [] });
  });

  it('should allow strict mode to be disabled (default behavior)', () => {
    expect(
      parser({ strict: false })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', 'world'])
    ).toEqual({ foo: 'hello', unmatched: ['world'] });
  });

  it('should allow enabling strict mode via .strict() method', () => {
    expect(() =>
      parser()
        .option('foo', { type: 'string' })
        .strict()
        .parse(['--foo', 'hello', 'world'])
    ).toThrowAggregateErrorContaining('Unknown argument: world');
  });

  it('should allow disabling strict mode via .strict(false) method', () => {
    expect(
      parser({ strict: true })
        .option('foo', { type: 'string' })
        .strict(false)
        .parse(['--foo', 'hello', 'world'])
    ).toEqual({ foo: 'hello', unmatched: ['world'] });
  });

  it('should skip required validation when validate is false', () => {
    expect(
      parser({ validate: false })
        .option('foo', { type: 'string', required: true })
        .parse([])
    ).toEqual({ foo: undefined, unmatched: [] });
  });

  it('should still apply defaults when validate is false', () => {
    expect(
      parser({ validate: false })
        .option('foo', { type: 'string', default: 'bar' })
        .option('count', { type: 'number', required: true })
        .parse([])
    ).toEqual({ foo: 'bar', count: undefined, unmatched: [] });
  });

  it('should validate required options by default', () => {
    expect(() =>
      parser()
        .option('foo', { type: 'string', required: true })
        .parse([])
    ).toThrowAggregateErrorContaining('Missing required option foo');
  });

  it('should have correct types with coerce', () => {
    const parsed = parser()
      .option('foo', { type: 'string', coerce: (s) => Number(s) })
      .option('bar', { type: 'number', coerce: (n) => n.toFixed() })
      .parse(['--foo', 'hello', '--bar', '42']);

    // The following line should not throw a type error.
    // Foo was coerced to a number
    parsed.foo?.toFixed();
    // Bar was coerced to a string
    parsed.bar?.substring(4);

    expect(typeof parsed.foo).toBe('number');
    expect(typeof parsed.bar).toBe('string');
  });

  it('should accept aliases', () => {
    expect(
      parser()
        .option('foo', { type: 'string', alias: ['f'] })
        .option('bar', { type: 'number', alias: ['b'] })
        .option('baz', { type: 'boolean', alias: ['zax'] })
        .parse(['-f', 'hello', '-b', '42', '--zax'])
    ).toEqual({ foo: 'hello', bar: 42, baz: true, unmatched: [] });
  });

  it('should accept short flag groups', () => {
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('bar', { type: 'boolean', alias: ['b'] })
        .option('baz', { type: 'boolean', alias: ['z'] })
        .parse(['-fb'])
    ).toEqual({ foo: true, bar: true, unmatched: [] });
  });

  it('should support default values', () => {
    expect(
      parser()
        .option('foo', { type: 'string', default: 'hello' })
        .option('bar', { type: 'number', default: 42 })
        .option('baz', { type: 'boolean', default: true })
        .parse([])
    ).toEqual({ foo: 'hello', bar: 42, baz: true, unmatched: [] });
  });

  it('should not overwrite provided values with defaults', () => {
    expect(
      parser()
        .option('foo', { type: 'string', default: 'hello' })
        .option('bar', { type: 'number', default: 42 })
        .option('baz', { type: 'boolean', default: true })
        .option('qux', { type: 'string', default: 'world' })
        .parse(['--foo', 'world', '--bar', '1', '--baz', 'false'])
    ).toEqual({
      foo: 'world',
      bar: 1,
      baz: false,
      qux: 'world',
      unmatched: [],
    });
  });

  it('should support required options', () => {
    expect(() =>
      parser().option('foo', { type: 'string', required: true }).parse([])
    ).toThrowAggregateErrorContaining('Missing required option foo');
  });

  it('should support required positional arguments', () => {
    expect(() =>
      parser().positional('foo', { type: 'string', required: true }).parse([])
    ).toThrowAggregateErrorContaining('Missing required positional option foo');
  });

  it('should support custom validators', () => {
    expect(() =>
      parser()
        .option('foo', {
          type: 'string',
          validate: (s) => s === 'hello',
        })
        .parse(['--foo', 'world'])
    ).toThrowAggregateErrorContaining('Invalid value "world" for option foo');
  });

  it('should support custom positional argument validators', () => {
    expect(() =>
      parser()
        .positional('foo', {
          type: 'string',
          validate: (s) => s === 'hello',
        })
        .parse(['world'])
    ).toThrowAggregateErrorContaining(
      'Invalid value "world" for positional option foo'
    );
  });

  it('should support custom validators with custom error messages', () => {
    expect(() =>
      parser()
        .option('foo', {
          type: 'string',
          validate: (s) => {
            if (s !== 'hello') {
              return 'foo must be hello';
            }
            return true;
          },
        })
        .parse(['--foo', 'world'])
    ).toThrowAggregateErrorContaining('foo must be hello');
  });

  it('should provide `--` if passed', () => {
    expect(
      parser()
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', 'world', '--', '--bar', '42'])
    ).toEqual({ foo: 'hello', unmatched: ['world'], '--': ['--bar', '42'] });
  });

  it('should support arg=value syntax', () => {
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .parse(['--foo=hello', '--bar=42'])
    ).toEqual({ foo: 'hello', bar: 42, unmatched: [] });
  });

  it('should support camelCase or kebab-case options', () => {
    expect(
      parser()
        .option('foo-bar', { type: 'string' })
        .option('bazQux', { type: 'string' })
        .parse(['--fooBar', 'hello', '--baz-qux', 'world'])
    ).toEqual({ 'foo-bar': 'hello', bazQux: 'world', unmatched: [] });
  });

  describe('strip-dashed support', () => {
    it('should accept dashed flags for camelCase options', () => {
      expect(
        parser()
          .option('someFlag', { type: 'string' })
          .parse(['--some-flag', 'value'])
      ).toEqual({ someFlag: 'value', unmatched: [] });
    });

    it('should accept camelCase flags for camelCase options', () => {
      expect(
        parser()
          .option('someFlag', { type: 'string' })
          .parse(['--someFlag', 'value'])
      ).toEqual({ someFlag: 'value', unmatched: [] });
    });

    it('should accept dashed flags for dashed options', () => {
      expect(
        parser()
          .option('some-flag', { type: 'string' })
          .parse(['--some-flag', 'value'])
      ).toEqual({ 'some-flag': 'value', unmatched: [] });
    });

    it('should accept camelCase flags for dashed options', () => {
      expect(
        parser()
          .option('some-flag', { type: 'string' })
          .parse(['--someFlag', 'value'])
      ).toEqual({ 'some-flag': 'value', unmatched: [] });
    });

    it('should work with multiple words in camelCase', () => {
      expect(
        parser()
          .option('myLongOptionName', { type: 'string' })
          .parse(['--my-long-option-name', 'value'])
      ).toEqual({ myLongOptionName: 'value', unmatched: [] });
    });

    it('should work with multiple words in dashed', () => {
      expect(
        parser()
          .option('my-long-option-name', { type: 'string' })
          .parse(['--myLongOptionName', 'value'])
      ).toEqual({ 'my-long-option-name': 'value', unmatched: [] });
    });

    it('should work with boolean options', () => {
      expect(
        parser()
          .option('verboseMode', { type: 'boolean' })
          .parse(['--verbose-mode'])
      ).toEqual({ verboseMode: true, unmatched: [] });
    });

    it('should work with number options', () => {
      expect(
        parser()
          .option('maxCount', { type: 'number' })
          .parse(['--max-count', '42'])
      ).toEqual({ maxCount: 42, unmatched: [] });
    });

    it('should work with array options', () => {
      expect(
        parser()
          .option('fileNames', { type: 'array', items: 'string' })
          .parse(['--file-names', 'a.txt', 'b.txt'])
      ).toEqual({ fileNames: ['a.txt', 'b.txt'], unmatched: [] });
    });

    it('should work with negated boolean flags in camelCase', () => {
      expect(
        parser()
          .option('colorOutput', { type: 'boolean' })
          .parse(['--no-color-output'])
      ).toEqual({ colorOutput: false, unmatched: [] });
    });

    it('can be disabled with stripDashed option', () => {
      // When stripDashed is false, camelCase options won't accept dashed format
      expect(
        parser({ stripDashed: false })
          .option('someFlag', { type: 'string' })
          .parse(['--some-flag', 'value'])
      ).toEqual({ unmatched: ['--some-flag', 'value'] });

      // And dashed options won't accept camelCase format
      expect(
        parser({ stripDashed: false })
          .option('some-flag', { type: 'string' })
          .parse(['--someFlag', 'value'])
      ).toEqual({ unmatched: ['--someFlag', 'value'] });
    });

    it('is enabled by default', () => {
      // Default behavior should support both formats
      expect(
        parser()
          .option('someFlag', { type: 'string' })
          .parse(['--some-flag', 'value'])
      ).toEqual({ someFlag: 'value', unmatched: [] });

      expect(
        parser()
          .option('some-flag', { type: 'string' })
          .parse(['--someFlag', 'value'])
      ).toEqual({ 'some-flag': 'value', unmatched: [] });
    });
  });

  it('should support limiting option choices', () => {
    expect(() =>
      parser()
        .option('foo', { type: 'string', choices: ['hello', 'world'] })
        .option('bar', {
          type: 'array',
          items: 'string',
          choices: ['hello', 'world'],
        })
        .option('baz', { type: 'array', items: 'number', choices: [1, 2] })
        .parse([
          '--foo',
          'foo',
          '--bar',
          'hello',
          'world',
          '--baz',
          '1',
          '2',
          '3',
        ])
    ).toThrowAggregateErrorContaining(
      'Invalid value "foo" for option foo. Valid values are: hello, world',
      'Invalid value "1,2,3" for option baz. Valid values are: 1, 2'
    );
  });

  it('should support ignoring prefixing for specific options', async () => {
    await withEnv(
      {
        FOO: 'BAR',
        PREFIX_BAZ: 'QUX',
      },
      () => {
        expect(
          parser()
            .option('foo', {
              type: 'string',
              env: { key: 'foo', prefix: false },
            })
            .option('baz', { type: 'string', env: 'baz' })
            .env('PREFIX')
            .parse([])
        ).toEqual({ foo: 'BAR', baz: 'QUX', unmatched: [] });
      }
    );
  });

  it('should throw if conflicting options are set', () => {
    expect(() =>
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'string' })
        .conflicts('foo', 'bar')
        .parse(['--foo=a', '--bar=b'])
    ).toThrowAggregateErrorContaining('Provided option foo conflicts with bar');
  });

  it('should read negated boolean options', () => {
    expect(
      parser()
        .option('foo', { type: 'boolean' })
        .option('bar', { type: 'boolean' })
        .parse(['--no-foo', '--bar'])
    ).toEqual({ foo: false, bar: true, unmatched: [] });
  });

  it('should work for simple object options', () => {
    expect(
      parser()
        .option('foo', {
          type: 'object',
          properties: {
            bar: {
              type: 'number',
            },
          },
        })
        .parse(['--foo.bar', '3'])
    ).toEqual({
      foo: { bar: 3 },
      unmatched: [],
    });
  });

  it('should work for nested object options', () => {
    const parsed = parser()
      .option('foo', {
        type: 'object',
        properties: {
          bar: {
            type: 'object',
            properties: {
              baz: {
                type: 'number',
              },
            },
          },
          qux: {
            type: 'number',
          },
          arr: {
            type: 'array',
            items: 'number',
          },
          blam: {
            type: 'string',
          },
        },
      })
      .parse([
        '--foo.bar.baz',
        '3',
        '--foo.qux',
        '4',
        '--foo.blam',
        '5',
        '--foo.arr',
        '1',
        '2',
        '3',
        '--some-bool',
      ]);
    expect(parsed).toMatchInlineSnapshot(`
      {
        "foo": {
          "arr": [
            1,
            2,
            3,
          ],
          "bar": {
            "baz": 3,
          },
          "blam": "5",
          "qux": 4,
        },
        "unmatched": [
          "--some-bool",
        ],
      }
    `);
    // Types should be inferred correctly
    parsed.foo?.bar?.baz?.toFixed();
    // It's an array of numbers
    parsed.foo?.arr?.reduce((acc, val) => acc + val, 0);
  });

  it('should support default values for object options', () => {
    expect(
      parser()
        .option('env', {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
          default: { foo: 'default-foo' },
        })
        .parse([])
    ).toEqual({
      env: { foo: 'default-foo' },
      unmatched: [],
    });
  });

  it('should support required object options', () => {
    expect(() =>
      parser()
        .option('env', {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
          required: true,
        })
        .parse([])
    ).toThrowAggregateErrorContaining('Missing required option env');
  });

  it('should support required properties within object options', () => {
    expect(() =>
      parser()
        .option('env', {
          type: 'object',
          properties: {
            foo: { type: 'string', required: true },
            bar: { type: 'string' },
          },
        })
        .parse(['--env.bar', 'test'])
    ).toThrowAggregateErrorContaining('Missing required option env.foo');
  });

  it('should support coerce for object options', () => {
    const result = parser()
      .option('env', {
        type: 'object',
        properties: {
          foo: { type: 'string', required: true },
          bar: { type: 'string', required: false },
        },
        default: {
          description: 'Default env object',
          value: { foo: 'default-foo', bar: 'default-bar', bax: 'default-bax' },
        },
        coerce: (val) => {
          return {
            ...val,
            baz: val.bar,
            foo: val.foo,
            coerced: true,
          };
        },
      })
      .parse(['--env.foo', 'test']);
    // The below lines test that types are inferred correctly
    // Foo is required, so it can't be undefined
    result.env?.foo.charAt(0);
    // Bar and baz are optional (baz is val.bar, bar is optional)
    result.env?.bar?.charAt(0);
    result.env?.baz?.charAt(0);
    //@ts-expect-error bax isn't on T, was only in default...
    result.env.bax;

    // The below tests that coercion was correctly applied
    expect(result.env).toEqual({ foo: 'test', coerced: true });
  });

  it('should support validate for object options', () => {
    expect(() =>
      parser()
        .option('env', {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
          validate: (val) => val.foo === 'valid',
        })
        .parse(['--env.foo', 'invalid'])
    ).toThrowAggregateErrorContaining('Invalid value');
  });

  it('should support default values for nested properties within object options', () => {
    expect(
      parser()
        .option('env', {
          type: 'object',
          properties: {
            foo: { type: 'string', default: 'default-foo' },
            bar: { type: 'string', default: 'default-bar' },
          },
        })
        .parse(['--env.foo', 'custom'])
    ).toEqual({
      env: { foo: 'custom', bar: 'default-bar' },
      unmatched: [],
    });
  });

  it('should support required properties in deeply nested objects', () => {
    expect(() =>
      parser()
        .option('config', {
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                host: { type: 'string', required: true },
                port: { type: 'number' },
              },
            },
          },
        })
        .parse(['--config.server.port', '8080'])
    ).toThrowAggregateErrorContaining(
      'Missing required option config.server.host'
    );
  });

  it('should support default values in deeply nested objects', () => {
    expect(
      parser()
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
          },
        })
        .parse(['--config.server.port', '8080'])
    ).toEqual({
      config: { server: { host: 'localhost', port: 8080 } },
      unmatched: [],
    });
  });

  it('should only require nested properties when parent object is present', () => {
    // When parent object is not present, nested required properties should not throw
    expect(
      parser()
        .option('config', {
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                host: { type: 'string', required: true },
                port: { type: 'number' },
              },
            },
            client: {
              type: 'object',
              properties: {
                endpoint: { type: 'string' },
              },
            },
          },
        })
        .parse(['--config.client.endpoint', 'https://example.com'])
    ).toEqual({
      config: { client: { endpoint: 'https://example.com' } },
      unmatched: [],
    });

    // When parent object IS present, nested required properties SHOULD throw
    expect(() =>
      parser()
        .option('config', {
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                host: { type: 'string', required: true },
                port: { type: 'number' },
              },
            },
            client: {
              type: 'object',
              properties: {
                endpoint: { type: 'string' },
              },
            },
          },
        })
        .parse(['--config.server.port', '8080'])
    ).toThrowAggregateErrorContaining(
      'Missing required option config.server.host'
    );
  });

  it('should support passing object options as JSON strings', () => {
    const result = parser()
      .option('config', {
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: { type: 'number' },
        },
      })
      .parse(['--config', '{"host": "example.com", "port": 8080}']);

    expect(result).toEqual({
      config: { host: 'example.com', port: 8080 },
      unmatched: [],
    });
  });

  it('should merge JSON string with existing object values', () => {
    const result = parser()
      .option('config', {
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: { type: 'number' },
          ssl: { type: 'boolean' },
        },
      })
      .parse([
        '--config.ssl',
        'true',
        '--config',
        '{"host": "example.com", "port": 8080}',
      ]);

    expect(result).toEqual({
      config: { host: 'example.com', port: 8080, ssl: true },
      unmatched: [],
    });
  });

  it('should validate JSON string format for object options', () => {
    expect(() =>
      parser()
        .option('config', {
          type: 'object',
          properties: {
            host: { type: 'string' },
          },
        })
        .parse(['--config', 'not-valid-json'])
    ).toThrow('Failed to parse config as JSON');
  });

  it('should reject non-object JSON values for object options', () => {
    expect(() =>
      parser()
        .option('config', {
          type: 'object',
          properties: {
            host: { type: 'string' },
          },
        })
        .parse(['--config', '["array", "not", "object"]'])
    ).toThrow('Expected config to be a JSON object');
  });

  it('should support mixed JSON and dot notation (JSON first, dot notation overrides)', () => {
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
      })
      .parse([
        '--config',
        '{"server": {"host": "json.example.com", "port": 3000}}',
        '--config.server.port',
        '9000',
      ]);

    expect(result).toEqual({
      config: { server: { host: 'json.example.com', port: 9000 } },
      unmatched: [],
    });
  });

  it('should apply nested defaults before coerce for object options', () => {
    const coerceCalls: any[] = [];
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
        },
        coerce: (val) => {
          // Track what the value looks like when coerce is called
          coerceCalls.push(JSON.parse(JSON.stringify(val)));
          return { ...val, coerced: true };
        },
      })
      .parse(['--config.server.port', '8080']);

    // Coerce should have been called with defaults already applied
    expect(coerceCalls[0]).toEqual({
      server: { host: 'localhost', port: 8080 },
    });

    // Final result should have coerce applied
    expect(result).toEqual({
      config: { server: { host: 'localhost', port: 8080 }, coerced: true },
      unmatched: [],
    });
  });

  it('should only apply nested defaults when parent object has at least one property set', () => {
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
              host: { type: 'string', default: 'db.local' },
              port: { type: 'number', default: 5432 },
            },
          },
        },
      })
      .parse(['--config.server.port', '8080']);

    // Server defaults should be applied since server.port was set
    // Database defaults should NOT be applied since no database property was set
    expect(result).toEqual({
      config: {
        server: { host: 'localhost', port: 8080 },
      },
      unmatched: [],
    });
  });

  it('should not apply top-level object default if no properties are explicitly set', () => {
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
        },
        default: {
          server: { host: 'default-host', port: 9999 },
        },
      })
      .option('other', { type: 'string' })
      .parse(['--other', 'value']);

    // Top-level default should apply only if config is not set at all
    expect(result).toEqual({
      config: { server: { host: 'default-host', port: 9999 } },
      other: 'value',
      unmatched: [],
    });
  });

  it('should read values from config files', () => {
    const configurationLoader = makeMockConfigLoader({
      [join(process.cwd(), '.myclirc')]: {
        extends: './node_modules/.myclirc',
        foo: 'hello',
        bar: 42,
      },
      [join(process.cwd(), 'node_modules', '.myclirc')]: {
        baz: true,
        foo: 'world',
        extra: 'not used',
      },
    });
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .option('baz', { type: 'boolean' })
        .config(configurationLoader)
        .parse([])
    ).toEqual({ foo: 'hello', bar: 42, baz: true, unmatched: [] });
  });

  it('should follow precedence of provided flag < env var < config file', async () => {
    await withEnv(
      {
        FOO: 'env',
        BAR: 'env',
      },
      () => {
        const configLoader = makeMockConfigLoader({
          [join(process.cwd(), '.myclirc')]: {
            foo: 'configured',
            bar: 'configured',
            baz: 'configured',
          },
        });
        expect(
          parser()
            .option('foo', { type: 'string' })
            .option('bar', { type: 'string' })
            .option('baz', { type: 'string' })
            .config(configLoader)
            .env()
            .parse(['--foo', 'override'])
        ).toEqual({
          foo: 'override',
          bar: 'env',
          baz: 'configured',
          unmatched: [],
        });
      }
    );
  });

  it('should not return unrelated values from config files', () => {
    const configurationLoader = makeMockConfigLoader({
      [join(process.cwd(), '.myclirc')]: {
        foo: 'hello',
        bar: 42,
        extra: 'not used',
      },
    });
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .config(configurationLoader)
        .parse([])
    ).toEqual({ foo: 'hello', bar: 42, unmatched: [] });
  });

  it('should not read config files multiple times for more than one option', () => {
    let configRead = 0;
    const configurationLoader: ConfigurationProvider<any> = {
      resolve: () => 'some-file',
      load: () => {
        configRead++;
        return {
          foo: 'hello',
          bar: 42,
          baz: true,
        };
      },
    };
    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .option('baz', { type: 'boolean' })
        .config(configurationLoader)
        .parse([])
    ).toEqual({ foo: 'hello', bar: 42, baz: true, unmatched: [] });
    expect(configRead).toBe(1);
  });

  it('should support AggregateConfigProvider', () => {
    const providerA: ConfigurationProvider<any> = {
      resolve: (dir) => join(dir, '.configA'),
      load: () => ({ foo: 'fromA' }),
    };
    const providerB: ConfigurationProvider<any> = {
      resolve: (dir) => join(dir, '.configB'),
      load: () => ({ bar: 2 }),
    };
    const aggregate = new AggregateConfigProvider([providerA, providerB]);

    expect(
      parser()
        .option('foo', { type: 'string' })
        .option('bar', { type: 'number' })
        .config(aggregate)
        .parse([])
    ).toEqual({ foo: 'fromA', bar: 2, unmatched: [] });
  });
});


export async function withEnv(
  env: NodeJS.ProcessEnv,
  cb: () => void | Promise<void>
) {
  const original = process.env;
  process.env = { ...original, ...env };
  try {
    await cb();
  } finally {
    process.env = original;
  }
}
