import { join } from 'path';
import { parser } from './parser';

import 'vitest';
import { ConfigurationProvider } from './config-files/configuration-loader';

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
      .option('qux', { type: 'array', items: 'number' })
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
        additionalProperties: 'string',
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
        '--env.blam=world',
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
    parsed.qux?.reduce((acc, val) => acc + val, 0);
    parsed.env?.foo?.charAt(0);
    parsed.env?.bar?.valueOf();
    parsed.env?.['blam'].charAt(0);
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
        },
        additionalProperties: 'string',
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
    parsed.foo?.['blam'].charAt(0);
    // It's an array of numbers
    parsed.foo?.arr?.reduce((acc, val) => acc + val, 0);
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
