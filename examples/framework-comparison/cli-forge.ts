import { cli } from 'cli-forge';

cli('greet')
  .command('hello', {
    description: 'Say hello to someone',
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'Name to greet',
          default: 'World',
        })
        .option('uppercase', {
          type: 'boolean',
          description: 'Print greeting in uppercase',
          default: false,
        }),
    handler: (args) => {
      const msg = `Hello, ${args.name}!`;
      console.log(args.uppercase ? msg.toUpperCase() : msg);
    },
  })
  .command('goodbye', {
    description: 'Say goodbye to someone',
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'Name to bid farewell',
          default: 'World',
        })
        .option('formal', {
          type: 'boolean',
          description: 'Use formal farewell',
          default: false,
        }),
    handler: (args) => {
      console.log(
        args.formal ? `Farewell, ${args.name}.` : `Bye, ${args.name}!`
      );
    },
  })
  .forge();
