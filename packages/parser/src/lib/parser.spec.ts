import { parser } from './parser';

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
    ).toThrowError('Missing required option foo');
  });

  it('should support required positional arguments', () => {
    expect(() =>
      parser().positional('foo', { type: 'string', required: true }).parse([])
    ).toThrowError('Missing required positional option foo');
  });

  it('should support custom validators', () => {
    expect(() =>
      parser()
        .option('foo', {
          type: 'string',
          validate: (s) => s === 'hello',
        })
        .parse(['--foo', 'world'])
    ).toThrowError('Invalid value for option foo');
  });

  it('should support custom positional argument validators', () => {
    expect(() =>
      parser()
        .positional('foo', {
          type: 'string',
          validate: (s) => s === 'hello',
        })
        .parse(['world'])
    ).toThrowError('Invalid value for positional option foo');
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
    ).toThrowError('foo must be hello');
  });
});
