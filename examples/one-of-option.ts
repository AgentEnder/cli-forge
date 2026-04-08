// ---
// id: one-of-option
// title: OneOf Option
// description: |
//   Demonstrates the `oneOf` option type, which allows a single flag
//   to accept multiple value types. This is useful for flags like
//   `--color` that can be a boolean toggle or accept specific string values.
// tags:
//   - options
//   - oneOf
// test:
//   - name: "String value"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json one-of-option.ts --color always'
//     assertions:
//       stdout:
//         contains: 'Color mode: always'
//   - name: "Boolean flag (implicit true)"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json one-of-option.ts --color'
//     assertions:
//       stdout:
//         contains: 'Color mode: true'
//   - name: "Negated boolean flag"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json one-of-option.ts --no-color'
//     assertions:
//       stdout:
//         contains: 'Color mode: false'
//   - name: "Default value"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json one-of-option.ts'
//     assertions:
//       stdout:
//         contains: 'Color mode: auto'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('color-demo')
  .option('color', {
    type: 'oneOf',
    valueTypes: [
      { type: 'string', choices: ['auto', 'always', 'never'] as const },
      { type: 'boolean' },
    ],
    default: 'auto',
    description: 'When to use colors in output',
  })
  .handler((args) => {
    console.log(`Color mode: ${args.color}`);
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
