import cliForge from 'cli-forge';

const cli = cliForge('verbosity-demo')
  .option('verbose', {
    type: 'oneOf',
    valueTypes: [{ type: 'number' }, { type: 'string' }],
    description: 'Set verbosity as a number (0-5) or named level',
  })
  .handler((args) => {
    if (args.verbose === undefined) {
      console.log('Verbosity: default');
    } else {
      console.log(`Verbosity (${typeof args.verbose}): ${args.verbose}`);
    }
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
