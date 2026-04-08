import cliForge from 'cli-forge';

const cli = cliForge('color-demo')
  .option('color', {
    type: 'oneOf',
    valueTypes: [
      { type: 'string', choices: ['auto', 'always', 'never'] as const },
      { type: 'boolean' },
    ],
    default: 'auto',
    description: 'When to use colors in output',
  })
  .handler((args) => {
    console.log(`Color mode: ${args.color}`);
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
