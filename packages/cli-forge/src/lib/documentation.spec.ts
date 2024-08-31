import cli, { InternalCLI } from './cli-forge';
import { generateDocumentation } from './documentation';

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
});
