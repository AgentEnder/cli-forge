import { InternalCLI } from './cli-forge';
import { generateDocumentation } from './documentation';
import cli from './public-api';

describe('generateDocumentation', () => {
  it('should not document hidden commands and options', () => {
    const docs = generateDocumentation(
      cli('test')
        .command('foo', {
          hidden: true,
          builder: (argv) => argv.option('bar', { type: 'string' }),
          handler: () => {
            // not executed.
          },
        })
        .command('bar', {
          builder: (argv) =>
            argv
              .option('a', { type: 'string' })
              .option('b', { type: 'string', hidden: true }),
          handler: () => {
            // not executed.
          },
        }) as unknown as InternalCLI
    );
    expect(docs.subcommands.find((d) => d.name === 'foo')).toBeUndefined();

    const barDocs = docs.subcommands.find((d) => d.name === 'bar');
    expect(barDocs).toBeDefined();
    expect(barDocs?.options?.['a']).toBeDefined();
    expect(barDocs?.options?.['b']).toBeUndefined();
  });

  it('should not execute command handlers', () => {
    let ran = false;
    generateDocumentation(
      cli('test').command('foo', {
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: () => {
          ran = true;
        },
      }) as unknown as InternalCLI
    );
    expect(ran).toBe(false);
  });

  it('should not contain sibling command arguments in current command documentation', () => {
    const docs = generateDocumentation(
      cli('test')
        .command('foo', {
          builder: (argv) => argv.option('bar', { type: 'string' }),
          handler: () => {
            // not executed.
          },
        })
        .command('bar', {
          builder: (argv) => argv.option('baz', { type: 'string' }),
          handler: () => {
            // not executed.
          },
        }) as unknown as InternalCLI
    );
    const fooDocs = docs.subcommands.find((d) => d.name === 'foo');
    expect(fooDocs).toBeDefined();
    // Baz is only registered on the 'bar' command.
    expect(fooDocs?.options?.['baz']).toBeUndefined();
    // Bar is only registered on the 'foo' command.
    expect(fooDocs?.options?.['bar']).toBeDefined();

    const barDocs = docs.subcommands.find((d) => d.name === 'bar');
    expect(barDocs).toBeDefined();
    // Bar is only registered on the 'foo' command.
    expect(barDocs?.options?.['bar']).toBeUndefined();
    // Baz is only registered on the 'bar' command.
    expect(barDocs?.options?.['baz']).toBeDefined();
  });

  it('should group options by group', () => {
    const docs = generateDocumentation(
      cli('test')
        .option('baz', { type: 'string' })
        .option('bar', { type: 'string' })
        .option('foo', {
          type: 'string',
        })
        .group('Advanced', ['foo', 'bar']) as unknown as InternalCLI
    );
    const advanced = docs.groupedOptions.find((g) => g.label === 'Advanced');
    expect(advanced).toBeDefined();
    expect(advanced?.keys.map((k) => k.key)).toEqual(['foo', 'bar']);
  });

  // TODO: This test should not fail.
  it.skip('should contain parent command arguments in subcommand documentation', () => {
    const docs = generateDocumentation(
      cli('test')
        .option('baz', { type: 'string' })
        .command('format', {
          builder: (argv) =>
            argv.option('bar', { type: 'string' }).command('check', {
              builder: (argv) => argv.option('foo', { type: 'string' }),
              handler: () => {
                // not executed.
              },
            }),
          handler: () => {
            // not executed.
          },
        }) as unknown as InternalCLI
    );
    const formatDocs = docs.subcommands.find((d) => d.name === 'format');
    expect(formatDocs).toBeDefined();
    expect(formatDocs?.options?.['baz']).toBeDefined();
    expect(formatDocs?.options?.['bar']).toBeDefined();
    expect(formatDocs?.options?.['foo']).toBeUndefined();

    const checkDocs = formatDocs?.subcommands.find((d) => d.name === 'check');
    expect(checkDocs).toBeDefined();
    expect(checkDocs?.options?.['baz']).toBeDefined();
    expect(checkDocs?.options?.['bar']).toBeDefined();
    expect(checkDocs?.options?.['foo']).toBeDefined();
  });

  it('should document epilogue, which inherits from parent command', () => {
    const docs = generateDocumentation(
      cli('test')
        .command('foo', {
          epilogue: 'foo epilogue',
          builder: (argv) =>
            argv.option('bar', { type: 'string' }).command('subcommand', {}),
          handler: () => {
            // not executed.
          },
        })
        .command('bar', {
          builder: (argv) => argv.option('baz', { type: 'string' }),
          handler: () => {
            // not executed.
          },
        }) as unknown as InternalCLI
    );
    const fooDocs = docs.subcommands.find((d) => d.name === 'foo');
    expect(fooDocs).toBeDefined();
    expect(fooDocs?.epilogue).toBe('foo epilogue');

    const subcommandDocs = fooDocs?.subcommands.find(
      (d) => d.name === 'subcommand'
    );
    expect(subcommandDocs).toBeDefined();
    expect(subcommandDocs?.epilogue).toBe('foo epilogue');

    const barDocs = docs.subcommands.find((d) => d.name === 'bar');
    expect(barDocs).toBeDefined();
    expect(barDocs?.epilogue).toBeUndefined();
  });
});
