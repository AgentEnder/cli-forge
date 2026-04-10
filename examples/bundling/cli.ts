import cliForge from 'cli-forge';

const cli = cliForge('bundled-cli')
  .command('greet', {
    builder: (args) =>
      args.option('name', {
        type: 'string',
        default: 'World',
        description: 'Who to greet',
      }),
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  })
  .command('add', {
    builder: (args) =>
      args
        .option('a', { type: 'number', required: true })
        .option('b', { type: 'number', required: true }),
    handler: (args) => {
      console.log(`${args.a} + ${args.b} = ${args.a + args.b}`);
    },
  });

export default cli;

cli.forge();
