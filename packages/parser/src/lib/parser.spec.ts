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
});
