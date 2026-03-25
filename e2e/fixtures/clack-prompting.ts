/**
 * E2E fixture: exercises the clack prompt provider with fake TTY streams.
 *
 * Usage:
 *   tsx clack-prompting.ts <json-config>
 *
 * The JSON config object:
 *   cliArgs  — string[] of CLI arguments to pass to forge()
 *   inputs   — string[] of values to feed to prompts (one per prompt)
 *
 * The fixture creates a CLI with three options:
 *   --name    (string, required)
 *   --greeting (string, default "Hello")
 *   --age     (number, required)
 *
 * It prints the handler output to real stdout so the test can assert on it.
 */
import { Readable, Writable } from 'node:stream';
import cli from 'cli-forge';
import { createClackPromptProvider } from 'cli-forge/prompt-providers/clack';

interface Config {
  cliArgs: string[];
  inputs: string[];
}

const config: Config = JSON.parse(
  process.env['CLACK_FIXTURE_CONFIG'] || process.argv[2] || '{}'
);

// --- Fake TTY streams for clack ---
const input = new Readable({ read() {} }) as any;
input.isTTY = true;
input.setRawMode = () => input;

const tuiChunks: Buffer[] = [];
const output = new Writable({
  write(chunk: any, _enc: any, cb: () => void) {
    tuiChunks.push(Buffer.from(chunk));
    cb();
  },
}) as any;
output.isTTY = true;
output.columns = 80;

// --- CLI definition ---
const app = cli('clack-e2e')
  .withPromptProvider(createClackPromptProvider({ input, output }))
  .command('$0', {
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'Your name',
          required: true,
        })
        .option('greeting', {
          type: 'string',
          description: 'The greeting to use',
          default: 'Hello',
        })
        .option('age', {
          type: 'number',
          description: 'Your age',
          required: true,
        }),
    handler: (args) => {
      console.log(
        `${args.greeting}, ${args.name}! You are ${args.age} years old.`
      );
    },
  });

// Push input values for each prompt after a tick (so prompts are active)
setImmediate(() => {
  for (const value of config.inputs ?? []) {
    for (const ch of value) input.push(ch);
    input.push('\r');
  }
});

app
  .forge(config.cliArgs ?? [])
  .then(() => {
    // Write the raw TUI output to stderr so the test can snapshot it
    // separately from the handler output on stdout.
    const rawTui = Buffer.concat(tuiChunks as Uint8Array[]).toString('utf-8');
    process.stderr.write(rawTui);
    process.exit(0);
  })
  .catch((e: Error) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  });
