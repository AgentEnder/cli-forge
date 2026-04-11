import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
  .command(
    'hello',
    'Say hello to someone',
    (yargs) =>
      yargs
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
    (args) => {
      const msg = `Hello, ${args.name}!`;
      console.log(args.uppercase ? msg.toUpperCase() : msg);
    }
  )
  .command(
    'goodbye',
    'Say goodbye to someone',
    (yargs) =>
      yargs
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
    (args) => {
      console.log(
        args.formal ? `Farewell, ${args.name}.` : `Bye, ${args.name}!`
      );
    }
  )
  .demandCommand(1)
  .help()
  .parse();
