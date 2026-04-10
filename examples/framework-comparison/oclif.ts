import { Command, Flags } from '@oclif/core';

// oclif uses class-based commands, typically in separate files.
// A real oclif project would use `oclif generate` scaffolding
// with filesystem-based command discovery. This single-file
// example adds a manual dispatcher for demonstration purposes.

class Hello extends Command {
  static override description = 'Say hello to someone';

  static override flags = {
    name: Flags.string({
      description: 'Name to greet',
      default: 'World',
    }),
    uppercase: Flags.boolean({
      description: 'Print greeting in uppercase',
      default: false,
    }),
  };

  async run() {
    const { flags } = await this.parse(Hello);
    const msg = `Hello, ${flags.name}!`;
    this.log(flags.uppercase ? msg.toUpperCase() : msg);
  }
}

class Goodbye extends Command {
  static override description = 'Say goodbye to someone';

  static override flags = {
    name: Flags.string({
      description: 'Name to bid farewell',
      default: 'World',
    }),
    formal: Flags.boolean({
      description: 'Use formal farewell',
      default: false,
    }),
  };

  async run() {
    const { flags } = await this.parse(Goodbye);
    this.log(
      flags.formal ? `Farewell, ${flags.name}.` : `Bye, ${flags.name}!`
    );
  }
}

// Manual dispatcher — in a real oclif project, the framework
// handles routing via the command manifest.
(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'hello') {
    await Hello.run(args);
  } else if (cmd === 'goodbye') {
    await Goodbye.run(args);
  } else {
    console.log('Usage: greet <hello|goodbye> [options]');
    console.log('Commands:');
    console.log('  hello    Say hello to someone');
    console.log('  goodbye  Say goodbye to someone');
  }
})();
