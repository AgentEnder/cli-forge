import { parseArgs } from 'node:util';

// Node.js util.parseArgs is deliberately minimal — it has no
// concept of subcommands, help generation, or type coercion
// beyond string/boolean. Everything else is manual.

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    name: { type: 'string', default: 'World' },
    uppercase: { type: 'boolean', default: false },
    formal: { type: 'boolean', default: false },
  },
  allowPositionals: true,
  strict: true,
});

const [command] = positionals;

if (command === 'hello') {
  const msg = `Hello, ${values.name}!`;
  console.log(values.uppercase ? msg.toUpperCase() : msg);
} else if (command === 'goodbye') {
  console.log(
    values.formal
      ? `Farewell, ${values.name}.`
      : `Bye, ${values.name}!`
  );
} else {
  console.log('Usage: greet <hello|goodbye> [options]');
  console.log('  --name <string>   Name to greet (default: World)');
  console.log('  --uppercase       Print greeting in uppercase');
  console.log('  --formal          Use formal farewell');
}
