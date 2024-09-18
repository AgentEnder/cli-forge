import { parser } from './parser';
import { withEnv } from './parser.spec';

describe('parser (env)', () => {
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

  describe('reflect', () => {
    it('should reflect env var to process.env by default', async () => {
      await withEnv({}, () => {
        expect(
          parser()
            .option('foo', { type: 'string' })
            .env()
            .parse(['--foo', 'hello'])
        ).toEqual({ foo: 'hello', unmatched: [] });
        expect(process.env['FOO']).toBe('hello');
      });
    });

    it('should reflect to process.env by default with prefix', async () => {
      await withEnv({}, () => {
        expect(
          parser()
            .option('foo', { type: 'string' })
            .env('PREFIX')
            .parse(['--foo', 'hello'])
        ).toEqual({ foo: 'hello', unmatched: [] });
        expect(process.env['PREFIX_FOO']).toBe('hello');
      });
    });

    it('should not reflect env var to process.env if parser level reflect is false', async () => {
      await withEnv({}, () => {
        expect(
          parser()
            .option('foo', { type: 'string' })
            .env({
              reflect: false,
            })
            .parse(['--foo', 'hello'])
        ).toEqual({ foo: 'hello', unmatched: [] });
        expect(process.env['FOO']).toBeUndefined();
      });
    });

    it('should not reflect env var to process.env if option level reflect is false', async () => {
      await withEnv({}, () => {
        expect(
          parser()
            .option('foo', { type: 'string', env: { reflect: false } })
            .option('bar', { type: 'string' })
            .env()
            .parse(['--foo', 'hello', '--bar', 'world'])
        ).toEqual({ foo: 'hello', bar: 'world', unmatched: [] });
        expect(process.env['FOO']).toBeUndefined();
        expect(process.env['BAR']).toBe('world');
      });
    });
  });

  describe('populate', () => {
    it('should populate env var by default', async () => {
      await withEnv({ FOO: 'hello' }, () => {
        expect(
          parser().option('foo', { type: 'string' }).env().parse([])
        ).toEqual({ foo: 'hello', unmatched: [] });
      });
    });

    it('should not populate env var if option level populate is false', async () => {
      await withEnv({ FOO: 'hello' }, () => {
        expect(
          parser()
            .option('foo', { type: 'string', env: { populate: false } })
            .env()
            .parse([])
        ).toEqual({ foo: undefined, unmatched: [] });
      });
    });

    it('should not populate env var if parser level populate is false', async () => {
      await withEnv({ FOO: 'hello' }, () => {
        expect(
          parser()
            .option('foo', { type: 'string' })
            .env({ populate: false })
            .parse([])
        ).toEqual({ foo: undefined, unmatched: [] });
      });
    });

    it('should not populate env var if option level populate is false and parser level populate is true', async () => {
      await withEnv({ FOO: 'hello' }, () => {
        expect(
          parser()
            .option('foo', { type: 'string', env: { populate: false } })
            .env({ populate: true })
            .parse([])
        ).toEqual({ foo: undefined, unmatched: [] });
      });
    });

    it('should populate env var if option level populate is true and parser level populate is false', async () => {
      await withEnv({ FOO: 'hello' }, () => {
        expect(
          parser()
            .option('foo', { type: 'string', env: { populate: true } })
            .env({ populate: false })
            .parse([])
        ).toEqual({ foo: 'hello', unmatched: [] });
      });
    });
  });
});
