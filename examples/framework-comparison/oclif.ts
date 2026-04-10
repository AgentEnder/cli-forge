import { Command, Flags } from '@oclif/core';

// oclif uses class-based commands, typically in separate files.
// This single-file example shows the command definitions only —
// a real oclif project would use `oclif generate` scaffolding.

export class Hello extends Command {
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

export class Goodbye extends Command {
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
