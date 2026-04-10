import { Command } from 'commander';

const program = new Command('greet');

program
  .command('hello')
  .description('Say hello to someone')
  .option('--name <string>', 'Name to greet', 'World')
  .option('--uppercase', 'Print greeting in uppercase', false)
  .action((opts) => {
    const msg = `Hello, ${opts.name}!`;
    console.log(opts.uppercase ? msg.toUpperCase() : msg);
  });

program
  .command('goodbye')
  .description('Say goodbye to someone')
  .option('--name <string>', 'Name to bid farewell', 'World')
  .option('--formal', 'Use formal farewell', false)
  .action((opts) => {
    console.log(
      opts.formal ? `Farewell, ${opts.name}.` : `Bye, ${opts.name}!`
    );
  });

program.parse();
