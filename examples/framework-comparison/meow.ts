import meow from 'meow';

// meow is a minimal parser — subcommands are handled manually
// by reading positional arguments from cli.input.

const cli = meow(
  `
  Usage
    $ greet <command>

  Commands
    hello    Say hello to someone
    goodbye  Say goodbye to someone

  Options
    --name        Name to greet (default: World)
    --uppercase   Print greeting in uppercase
    --formal      Use formal farewell
`,
  {
    importMeta: import.meta,
    flags: {
      name: { type: 'string', default: 'World' },
      uppercase: { type: 'boolean', default: false },
      formal: { type: 'boolean', default: false },
    },
  }
);

const [command] = cli.input;

if (command === 'hello') {
  const msg = `Hello, ${cli.flags.name}!`;
  console.log(cli.flags.uppercase ? msg.toUpperCase() : msg);
} else if (command === 'goodbye') {
  console.log(
    cli.flags.formal
      ? `Farewell, ${cli.flags.name}.`
      : `Bye, ${cli.flags.name}!`
  );
} else {
  cli.showHelp();
}
