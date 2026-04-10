import { defineCommand, runMain } from 'citty';

const hello = defineCommand({
  meta: { name: 'hello', description: 'Say hello to someone' },
  args: {
    name: {
      type: 'string',
      description: 'Name to greet',
      default: 'World',
    },
    uppercase: {
      type: 'boolean',
      description: 'Print greeting in uppercase',
      default: false,
    },
  },
  run({ args }) {
    const msg = `Hello, ${args.name}!`;
    console.log(args.uppercase ? msg.toUpperCase() : msg);
  },
});

const goodbye = defineCommand({
  meta: { name: 'goodbye', description: 'Say goodbye to someone' },
  args: {
    name: {
      type: 'string',
      description: 'Name to bid farewell',
      default: 'World',
    },
    formal: {
      type: 'boolean',
      description: 'Use formal farewell',
      default: false,
    },
  },
  run({ args }) {
    console.log(
      args.formal ? `Farewell, ${args.name}.` : `Bye, ${args.name}!`
    );
  },
});

const main = defineCommand({
  meta: { name: 'greet', description: 'A greeting CLI' },
  subCommands: { hello, goodbye },
});

runMain(main);
