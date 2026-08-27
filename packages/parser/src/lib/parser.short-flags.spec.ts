import { describe, expect, it } from 'vitest';
import {
  parser,
  UnknownArgumentError,
  UnknownOptionError,
  ValidationFailedError,
} from './parser';

/**
 * Collects the errors out of the `ValidationFailedError` a failing parse throws.
 */
function collectErrors(fn: () => unknown): Error[] {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ValidationFailedError);
    return (e as ValidationFailedError<unknown>).errors;
  }
  throw new Error('Expected parse to throw a ValidationFailedError');
}

describe('short flag groups', () => {
  it('should not swallow the tokens after the group', () => {
    const build = () =>
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('bar', { type: 'boolean', alias: ['b'] })
        .positional('pos', { type: 'string' });

    expect(build().parse(['-fb', 'hello'])).toEqual({
      foo: true,
      bar: true,
      pos: 'hello',
      unmatched: [],
    });
    // The grouped form matches the spelled-out form.
    expect(build().parse(['-f', '-b', 'hello'])).toEqual(
      build().parse(['-fb', 'hello'])
    );
  });

  it('should not swallow the flags after the group', () => {
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('bar', { type: 'boolean', alias: ['b'] })
        .option('name', { type: 'string' })
        .parse(['-fb', '--name', 'x'])
    ).toEqual({ foo: true, bar: true, name: 'x', unmatched: [] });
  });

  it('should let an array member take the tokens after the group when it is last', () => {
    const build = () =>
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('list', { type: 'array', items: 'string', alias: ['l'] });

    expect(build().parse(['-fl', 'a', 'b'])).toEqual({
      foo: true,
      list: ['a', 'b'],
      unmatched: [],
    });
    // An array member ends the group like any other value-taking option, so
    // the `f` after it is the first of its values rather than a second flag.
    expect(build().parse(['-lf', 'a', 'b'])).toEqual({
      list: ['f', 'a', 'b'],
      unmatched: [],
    });
  });

  it('should bind a value to the final member, attached or not', () => {
    const build = () =>
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('bar', { type: 'boolean', alias: ['b'] })
        .option('name', { type: 'string', alias: ['n'] });

    expect(build().parse(['-fn', 'value'])).toEqual({
      foo: true,
      name: 'value',
      unmatched: [],
    });
    expect(build().parse(['-fn=value'])).toEqual({
      foo: true,
      name: 'value',
      unmatched: [],
    });
    expect(build().parse(['-fnvalue'])).toEqual({
      foo: true,
      name: 'value',
      unmatched: [],
    });
    expect(build().parse(['-fbn=x'])).toEqual({
      foo: true,
      bar: true,
      name: 'x',
      unmatched: [],
    });
  });

  it('should keep an "=" that is part of an attached value', () => {
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('name', { type: 'string', alias: ['n'] })
        .parse(['-fna=b'])
    ).toEqual({ foo: true, name: 'a=b', unmatched: [] });
  });

  it('should end the group at the first value-taking member', () => {
    // `-n` takes a value, so it ends the group: `f` is the value, not a flag.
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('name', { type: 'string', alias: ['n'] })
        .parse(['-nf', 'value'])
    ).toEqual({ name: 'f', unmatched: ['value'] });
  });

  it('should read an attached value without regard for what the characters alias', () => {
    // `v`, `a`, `l` and `u` are all declared here. They are still the value of
    // `-n`, because nothing after a value-taking member is read as a flag.
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('verbose', { type: 'boolean', alias: ['v'] })
        .option('all', { type: 'boolean', alias: ['a'] })
        .option('list', { type: 'array', items: 'string', alias: ['l'] })
        .option('unit', { type: 'string', alias: ['u'] })
        .option('name', { type: 'string', alias: ['n'] })
        .parse(['-fnvalue'])
    ).toEqual({ foo: true, name: 'value', unmatched: [] });
  });

  it('should report a character that resolves to nothing, even when the rest of the group matched', () => {
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .parse(['-fx'])
    ).toEqual({ foo: true, unmatched: ['-x'] });

    // A group where nothing resolves is still reported as a whole token, so
    // `unmatchedParser` consumers keep seeing the argument they were given.
    expect(
      parser()
        .option('foo', { type: 'boolean', alias: ['f'] })
        .parse(['-x'])
    ).toEqual({ unmatched: ['-x'] });
  });

  it('should throw for an unresolved character in an otherwise matching group in strict mode', () => {
    const errors = collectErrors(() =>
      parser({ strict: true })
        .option('foo', { type: 'boolean', alias: ['f'] })
        .parse(['-fx'])
    );
    expect(errors[0]).toBeInstanceOf(UnknownOptionError);
    expect(errors[0]).toMatchObject({ input: '-x', token: '-fx' });
    expect(errors[0].message).toBe('Unknown argument: -x (in -fx)');
  });

  it('should keep the origin of each unresolved character when two groups share one', () => {
    const errors = collectErrors(() =>
      parser({ strict: true })
        .option('foo', { type: 'boolean', alias: ['f'] })
        .option('gab', { type: 'boolean', alias: ['g'] })
        .parse(['-fx', '-gx'])
    );
    expect(errors.map((e) => e.message)).toEqual([
      'Unknown argument: -x (in -fx)',
      'Unknown argument: -x (in -gx)',
    ]);
  });

  it('should treat a multi-character alias as long-form only', () => {
    const build = () =>
      parser().option('foo', { type: 'string', alias: ['fb'] });

    // `-fb` splits into `f` and `b`, neither of which is declared.
    expect(build().parse(['-fb', 'v'])).toEqual({ unmatched: ['-fb', 'v'] });
    expect(build().parse(['--fb', 'v'])).toEqual({ foo: 'v', unmatched: [] });
  });

  it('should keep the whole token in the value of a long flag with an "=" in it', () => {
    expect(
      parser().option('name', { type: 'string' }).parse(['--name=a=b'])
    ).toEqual({ name: 'a=b', unmatched: [] });
  });

  it('should not report unresolved spellings of a long flag', () => {
    // `readArgKeys` returns both `fooBar` and `foo-bar` for `--foo-bar`; only
    // one of them is a configured key, and that is by design.
    expect(
      parser({ strict: true })
        .option('foo-bar', { type: 'string' })
        .parse(['--foo-bar', 'x'])
    ).toEqual({ 'foo-bar': 'x', unmatched: [] });
  });

  describe('a multi-character alias typed with a single dash', () => {
    const build = (strict: boolean) =>
      parser({ strict })
        .option('primary-checkout', { type: 'string', alias: ['prc'] })
        .option('prompt', { type: 'string', alias: ['p'] })
        .option('repo', { type: 'array', items: 'string', alias: ['r'] })
        .option('title', { type: 'string', alias: ['t'] });

    it('should bind the trailing characters to the value-taking member', () => {
      // `-p` takes a value, so `-prc` reads as `-p rc`. The intended
      // `--primary-checkout` is never set — declare colliding aliases with
      // care.
      expect(build(false).parse(['-prc', 'fresh-checkout'])).toEqual({
        prompt: 'rc',
        unmatched: ['fresh-checkout'],
      });
    });

    it('should still parse the flags following the group', () => {
      expect(
        build(false).parse(['-prc', 'fresh-checkout', '--title', 'T'])
      ).toMatchObject({
        prompt: 'rc',
        title: 'T',
      });
    });

    it('should report the unresolved character when the group is otherwise legal', () => {
      // `prompt` as a flag makes `-prc` a legal group of boolean members, so
      // only the unresolved `c` is reported.
      const errors = collectErrors(() =>
        parser({ strict: true })
          .option('primary-checkout', { type: 'string', alias: ['prc'] })
          .option('prompt', { type: 'boolean', alias: ['p'] })
          .option('repo', { type: 'boolean', alias: ['r'] })
          .parse(['-prc'])
      );
      expect(errors[0]).toBeInstanceOf(UnknownOptionError);
      expect(errors[0]).toMatchObject({ input: '-c', token: '-prc' });
      expect((errors[0] as UnknownOptionError).suggestedOptions[0]).toBe(
        '--prc'
      );
    });

    it('should still report the whole token when no character resolves', () => {
      const errors = collectErrors(() =>
        parser({ strict: true })
          .option('primary-checkout', { type: 'string', alias: ['prc'] })
          .parse(['-prc', 'x'])
      );
      expect(errors[0]).toMatchObject({
        input: '-prc',
        suggestedOptions: ['--prc'],
      });
    });
  });
});

describe('strict options', () => {
  it('should enable every check for strict() and strict(true)', () => {
    const build = (strict: boolean) =>
      parser({ strict })
        .option('foo', { type: 'boolean', alias: ['f'] })
        .parse(['-fx', '--bar', 'world']);

    const errors = collectErrors(() => build(true));
    expect(errors.map((e) => e.message)).toEqual([
      'Unknown argument: -x (in -fx)',
      'Unknown argument: --bar',
      'Unknown argument: world',
    ]);
    expect(build(false)).toEqual({
      foo: true,
      unmatched: ['-x', '--bar', 'world'],
    });
  });

  it('should spread a strict options body over the all-checks-on default', () => {
    expect(
      parser({ strict: { unknownArguments: false } })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', 'world'])
    ).toEqual({ foo: 'hello', unmatched: ['world'] });

    const errors = collectErrors(() =>
      parser({ strict: { unknownArguments: false } })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', '--bar'])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnknownOptionError);
  });

  it('should tolerate unknown options while still rejecting stray positionals', () => {
    const errors = collectErrors(() =>
      parser({ strict: { unknownOptions: false } })
        .option('foo', { type: 'string' })
        .parse(['--foo', 'hello', '--bar', 'world'])
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnknownArgumentError);
    expect(errors[0]).not.toBeInstanceOf(UnknownOptionError);
    expect(errors[0].message).toBe('Unknown argument: world');
  });

  it('should report a partial short flag group separately from unknown options', () => {
    expect(
      parser({ strict: { partialShortFlagGroups: false } })
        .option('foo', { type: 'boolean', alias: ['f'] })
        .parse(['-fx'])
    ).toEqual({ foo: true, unmatched: ['-x'] });

    const errors = collectErrors(() =>
      parser({ strict: { unknownOptions: false, unknownArguments: false } })
        .option('foo', { type: 'boolean', alias: ['f'] })
        .parse(['-fx', '--bar', 'world'])
    );
    expect(errors.map((e) => e.message)).toEqual([
      'Unknown argument: -x (in -fx)',
    ]);
  });

  it('should accept a strict options body from the .strict() method', () => {
    expect(
      parser()
        .option('foo', { type: 'string' })
        .strict({ unknownArguments: false })
        .parse(['--foo', 'hello', 'world'])
    ).toEqual({ foo: 'hello', unmatched: ['world'] });
  });
});
