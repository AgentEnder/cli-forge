import cac from 'cac';

const cli = cac('greet');

cli
  .command('hello', 'Say hello to someone')
  .option('--name <name>', 'Name to greet', { default: 'World' })
  .option('--uppercase', 'Print greeting in uppercase', { default: false })
  .action((opts) => {
    const msg = `Hello, ${opts.name}!`;
    console.log(opts.uppercase ? msg.toUpperCase() : msg);
  });

cli
  .command('goodbye', 'Say goodbye to someone')
  .option('--name <name>', 'Name to bid farewell', { default: 'World' })
  .option('--formal', 'Use formal farewell', { default: false })
  .action((opts) => {
    console.log(
      opts.formal ? `Farewell, ${opts.name}.` : `Bye, ${opts.name}!`
    );
  });

cli.help();
cli.parse();
