import { cli, command } from 'cleye';

// cleye returns a parsed argv object with command narrowing.
// Subcommands are defined with command() and passed to cli().

const argv = cli({
  name: 'greet',
  commands: [
    command({
      name: 'hello',
      flags: {
        name: {
          type: String,
          description: 'Name to greet',
          default: 'World',
        },
        uppercase: {
          type: Boolean,
          description: 'Print greeting in uppercase',
          default: false,
        },
      },
    }),
    command({
      name: 'goodbye',
      flags: {
        name: {
          type: String,
          description: 'Name to bid farewell',
          default: 'World',
        },
        formal: {
          type: Boolean,
          description: 'Use formal farewell',
          default: false,
        },
      },
    }),
  ],
});

if (argv.command === 'hello') {
  const msg = `Hello, ${argv.flags.name}!`;
  console.log(argv.flags.uppercase ? msg.toUpperCase() : msg);
} else if (argv.command === 'goodbye') {
  console.log(
    argv.flags.formal
      ? `Farewell, ${argv.flags.name}.`
      : `Bye, ${argv.flags.name}!`
  );
}
