// ---
// id: prompting
// title: Prompting for Missing Values
// description: |
//   This example demonstrates how to use cli-forge's **prompt layer** to
//   interactively collect missing option values. When a prompt provider is
//   registered, required options that were not supplied on the command line
//   are automatically prompted for.
//
//   Prompt providers are pluggable — register one via `.withPromptProvider()`.
//   This example uses a simple `readline`-based provider for portability.
//   For a richer terminal experience, cli-forge ships a ready-made
//   `@clack/prompts` provider via `cli-forge/prompt-providers/clack`.
//
//   **Key behaviors:**
//   - `required: true` options auto-prompt when missing (if a provider exists)
//   - `prompt: true` forces prompting even when a value was already given
//   - `prompt: "label"` uses a custom label instead of the description
//   - `prompt: (args) => ...` enables conditional/dynamic prompting
//
// test:
//   - name: "Skips prompts when all required args are provided"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json prompting.ts --name Craigory --greeting Hey --age 30'
//     assertions:
//       stdout:
//         contains: 'Hey, Craigory! You are 30 years old.'
//   - name: "Uses default greeting when only required args provided"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json prompting.ts --name World --age 25'
//     assertions:
//       stdout:
//         contains: 'Hello, World! You are 25 years old.'
//   - name: "Prompts for missing required args via piped stdin"
//     options:
//       command: 'printf "Craigory\n25\n" | npx tsx --no-cache --tsconfig ./tsconfig.json prompting.ts'
//     assertions:
//       stdout:
//         matches: 'Hello, Craigory! You are 25 years old.'
// ---
import * as readline from 'node:readline';
import cliForge, { type PromptOption, type PromptProvider } from 'cli-forge';

// --- Simple readline-based prompt provider ---
// Reads answers line-by-line from stdin. Works for both interactive
// terminals and piped input (e.g. `printf "answer\n" | my-cli`).
//
// Note: When stdin is piped, readline eagerly consumes all lines.
// Successive `rl.question()` calls race with that consumption, so we
// buffer lines upfront when stdin is non-interactive and serve them
// to each prompt in order.

/**
 * Collect all lines from a readable stream, then return them.
 */
function readAllLines(stream: NodeJS.ReadableStream): Promise<string[]> {
  return new Promise((resolve) => {
    const lines: string[] = [];
    const rl = readline.createInterface({ input: stream });
    rl.on('line', (line) => lines.push(line));
    rl.on('close', () => resolve(lines));
  });
}

function createReadlinePromptProvider(): PromptProvider {
  return {
    async promptBatch(
      options: PromptOption[]
    ): Promise<Record<string, unknown>> {
      const isInteractive = !!(process.stdin as any).isTTY;

      // When piped, buffer all lines first to avoid the readline race.
      const bufferedLines = isInteractive
        ? null
        : await readAllLines(process.stdin);
      let lineIndex = 0;

      // For interactive mode, use question(); for piped mode, serve from buffer.
      let rl: readline.Interface | undefined;
      const ask = (query: string): Promise<string> => {
        if (bufferedLines) {
          process.stdout.write(query);
          return Promise.resolve(bufferedLines[lineIndex++] ?? '');
        }
        if (rl === undefined) {
          rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });
        }
        return new Promise((resolve) => rl!.question(query, resolve));
      };

      const results: Record<string, unknown> = {};
      try {
        for (const option of options) {
          // Use custom prompt label, description, or fall back to the option name
          const label =
            typeof option.config.prompt === 'string'
              ? option.config.prompt
              : option.config.description ?? option.name;

          const answer = await ask(`${label}: `);

          // Coerce the raw string to the expected option type
          if (option.config.type === 'number') {
            results[option.name] = Number(answer);
          } else if (option.config.type === 'boolean') {
            results[option.name] =
              answer.toLowerCase() === 'true' || answer === '1';
          } else {
            results[option.name] = answer;
          }
        }
      } finally {
        rl?.close();
      }

      return results;
    },
  };
}

// --- CLI definition ---

const cli = cliForge('prompting-demo')
  // Register the prompt provider. When required options are missing,
  // cli-forge will delegate to this provider to collect values.
  .withPromptProvider(createReadlinePromptProvider())
  .command('$0', {
    builder: (args) =>
      args
        .option('name', {
          type: 'string',
          description: 'Your name',
          // Required options without a default are auto-prompted when
          // a provider is registered and no value was given on the CLI.
          required: true,
        })
        .option('greeting', {
          type: 'string',
          description: 'The greeting to use',
          // Optional with a default — never prompted automatically.
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

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
