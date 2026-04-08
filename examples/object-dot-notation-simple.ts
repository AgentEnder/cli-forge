// ---
// id: object-dot-notation-simple
// title: Object Arguments (Simple)
// description: |
//   This is a simple example that demonstrates passing object-valued options to a command. Note that
//   the object-valued options are passed as dot-notation strings. These can be nested for complex option
//   structures that contain object properties that are themselves objects.
//
//   > For a more detailed example showcasing defaults, required properties, validation, and JSON input,
//   > see the `object-arguments` multi-file example.
//
//   > Note: This example is a bit more abstract than the others, as real world use cases for object-valued
//   > options and especially nested objects are less common. This example is included to demonstrate the
//   > flexibility of the CLI Forge APIs and the ability to handle complex option structures with type safety.
// test:
//   - name: "Parses nested object with dot notation"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json object-dot-notation-simple.ts --foo.bar.baz 42 --foo.qux 42 --foo.arr 1 2 3 --foo.blam hello'
// ---
import cliForge from 'cli-forge';

const cli = cliForge('object-notation', {
  builder: (args) =>
    args.option('foo', {
      type: 'object',
      properties: {
        bar: {
          type: 'object',
          properties: {
            baz: {
              type: 'number',
            },
          },
        },
        qux: {
          type: 'number',
        },
        arr: {
          type: 'array',
          items: 'number',
        },
        blam: {
          type: 'string',
        },
      },
    }),
  handler: (args) => {
    // Types should be inferred correctly
    args.foo?.bar?.baz?.toFixed();
    args.foo?.blam?.charAt(0);

    // It's an array of numbers
    args.foo?.arr?.reduce((acc, val) => acc + val, 0);
  },
});

// We export the CLI for a few reasons:
// - Testing
// - Composition (a CLI can be a subcommand of another CLI)
// - Docs generation
export default cli;

// Calling `.forge()` executes the CLI. It's single parameter is the CLI args
// and they default to `process.argv.slice(2)`.
if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
