import cli from './cli-forge';
import { TestHarness } from './test-harness';

describe('test harness', () => {
  it('should not actually run commands', async () => {
    let commandsExecuted = 0;
    const cliUnderTest = cli('test').commands(
      {
        name: 'foo',
        builder: (argv) => argv.option('bar', { type: 'string' }),
        handler: (args) => {
          commandsExecuted++;
        },
      },
      {
        name: 'bar',
        builder: (argv) => argv.option('baz', { type: 'string' }),
        handler: (args) => {
          commandsExecuted++;
        },
      }
    );
    const harness = new TestHarness(cliUnderTest);
    const { commandChain, args } = await harness.parse(['foo', '--bar', 'baz']);
    expect(commandChain).toEqual(['foo']);
    expect(commandsExecuted).toEqual(0);
    expect(args).toEqual({ bar: 'baz', unmatched: [] });
  });
});
