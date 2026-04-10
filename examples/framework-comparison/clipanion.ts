import { Builtins, Cli, Command, Option } from 'clipanion';

class HelloCommand extends Command {
  static override paths = [['hello']];

  static override usage = Command.Usage({
    description: 'Say hello to someone',
  });

  name = Option.String('--name', 'World', {
    description: 'Name to greet',
  });

  uppercase = Option.Boolean('--uppercase', false, {
    description: 'Print greeting in uppercase',
  });

  async execute() {
    const msg = `Hello, ${this.name}!`;
    this.context.stdout.write(
      (this.uppercase ? msg.toUpperCase() : msg) + '\n'
    );
  }
}

class GoodbyeCommand extends Command {
  static override paths = [['goodbye']];

  static override usage = Command.Usage({
    description: 'Say goodbye to someone',
  });

  name = Option.String('--name', 'World', {
    description: 'Name to bid farewell',
  });

  formal = Option.Boolean('--formal', false, {
    description: 'Use formal farewell',
  });

  async execute() {
    const msg = this.formal
      ? `Farewell, ${this.name}.`
      : `Bye, ${this.name}!`;
    this.context.stdout.write(msg + '\n');
  }
}

const cli = new Cli({ binaryName: 'greet' });
cli.register(HelloCommand);
cli.register(GoodbyeCommand);
cli.register(Builtins.HelpCommand);
cli.runExit(process.argv.slice(2));
