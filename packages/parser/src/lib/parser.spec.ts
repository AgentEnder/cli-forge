import { parser } from './parser';

import 'vitest';

interface CustomMatchers<R = unknown> {
  toThrowAggregateErrorContaining: (...expected: Array<string | Error>) => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends CustomMatchers {}
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
      .option('foo', { type: 'string', default: 'hello' })
      .option('bar', { type: 'number' })
      .option('baz', { type: 'boolean' })
      .option('bam', { type: 'array', items: 'string' })
      .option('qux', { type: 'array', items: 'number' })
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
      ]);

    // The following lines should not throw type errors.
    parsed.foo.charAt(0);
    parsed.bar.toFixed();
    parsed.baz.valueOf();
    parsed.bam.join('');
    parsed.qux.reduce((acc, val) => acc + val, 0);
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
    parsed.foo.toFixed();
    // Bar was coerced to a string
    parsed.bar.substring(4);

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

  it('should support reading options from environment variables', async () => {
    await withEnv(
      {
        FOO_BAR: 'hello',
        BAZ_QUX: 'world',
        SOME_CLI_TOOL: '4',
        SOME_ARRAY: '1,2,3',
      },
      () => {
        expect(
          parser()
            .option('foo-bar', { type: 'string' })
            .option('baz-qux', { type: 'string' })
            .option('someCLITool', { type: 'number' })
            .option('someArray', { type: 'array', items: 'number' })
            .env()
            .parse([])
        ).toMatchInlineSnapshot(`
          {
            "baz-qux": "world",
            "foo-bar": "hello",
            "someArray": [
              1,
              2,
              3,
            ],
            "someCLITool": 4,
            "unmatched": [],
          }
        `);
      }
    );
  });

  it('should support prefixing environment variables', async () => {
    await withEnv(
      {
        PREFIX_FOO_BAR: 'hello',
        PREFIX_BAZ_QUX: 'world',
        PREFIX_SOME_CLI_TOOL: '4',
        PREFIX_SOME_ARRAY: '1,2,3',
      },
      () => {
        expect(
          parser()
            .option('foo-bar', { type: 'string' })
            .option('baz-qux', { type: 'string' })
            .option('someCLITool', { type: 'number' })
            .option('someArray', { type: 'array', items: 'number' })
            .env('PREFIX')
            .parse([])
        ).toMatchInlineSnapshot(`
          {
            "baz-qux": "world",
            "foo-bar": "hello",
            "someArray": [
              1,
              2,
              3,
            ],
            "someCLITool": 4,
            "unmatched": [],
          }
        `);
      }
    );
  });

  it('should support setting env var for single options', async () => {
    await withEnv(
      {
        FOO: 'hello',
        BAR: 'world',
        BAZ: '42',
      },
      () => {
        expect(
          parser()
            .option('foo', { type: 'string', env: 'foo' })
            .option('bar', { type: 'string', env: 'bar' })
            // Should not be set, as we didn't call .env() or provide env on the option.
            .option('baz', { type: 'string' })
            .parse([])
        ).toEqual({ foo: 'hello', bar: 'world', unmatched: [] });
      }
    );
  });

  it('should support disabling env var for single options', async () => {
    await withEnv(
      {
        FOO: 'hello',
        BAR: 'world',
        BAZ: '42',
      },
      () => {
        expect(
          parser()
            .option('foo', { type: 'string', env: false })
            .option('bar', { type: 'string' })
            .option('baz', { type: 'string' })
            .env()
            .parse([])
        ).toEqual({ bar: 'world', baz: '42', unmatched: [] });
      }
    );
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
});

async function withEnv(env: NodeJS.ProcessEnv, cb: () => void | Promise<void>) {
  const original = process.env;
  process.env = { ...original, ...env };
  try {
    await cb();
  } finally {
    process.env = original;
  }
}
