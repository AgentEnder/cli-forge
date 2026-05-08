// ---
// id: help-customization
// title: Help & Version Customization
// description: |
//   Demonstrates how to customize the `--help` and `--version` output for a CLI.
//
//   You can:
//   - Pass a callback to `.help()` to customize the full help text
//   - Pass a callback to `.version()` to customize the version output
//   - Disable either flag entirely with `.help(false)` or `.version(false)`
//   - Use `formatHelpText` on individual options for per-option customization
//   - Use `.catch()` to customize error handling (e.g. suppress or restyle the
//     default validation-error + help output)
//
//   Help callbacks receive a context object with:
//   - `args` — the parsed arguments at the time `--help` was invoked (partial)
//   - `cli` — the CLI instance
//   - `renderDefaultHelp()` — renders the full default help text
//   - `options` — configured options, each with a `renderHelpText()` method
//
//   Custom help callbacks are inherited by subcommands. If a subcommand does not
//   define its own, it walks up the parent chain.
// test:
//   - name: "Custom help text"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json help-customization.ts --help'
//     assertions:
//       stdout:
//         contains: 'my-tool v1.0.0'
//         matches: 'Usage: my-tool'
//   - name: "Verbose help text"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json help-customization.ts --verbose --help'
//     assertions:
//       stdout:
//         contains: 'VERBOSE HELP'
//   - name: "Custom version text"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json help-customization.ts --version'
//     assertions:
//       stdout:
//         contains: 'my-tool v1.0.0 (custom build)'
//   - name: "Subcommand inherits help"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json help-customization.ts serve --help'
//     assertions:
//       stdout:
//         contains: 'my-tool v1.0.0'
//         matches: 'Usage: my-tool serve'
//   - name: "Per-option help text"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json help-customization.ts --help'
//     assertions:
//       stdout:
//         contains: '[output directory path]'
// ---
import cliForge from 'cli-forge';

// #region cli
const cli = cliForge('my-tool')
  .option('verbose', {
    type: 'boolean',
    alias: ['v'],
    description: 'Enable verbose output',
  })
  // #region help
  // Custom help callback — receives a context object you can destructure.
  // The callback is inherited by subcommands that don't define their own.
  .help(({ args, renderDefaultHelp, options }) => {
    // Add a branded header with the tool version
    let output = `my-tool v1.0.0\n\n${renderDefaultHelp()}`;

    // `args` is partial (parse may not have finished), so check safely
    if (args.verbose) {
      output += '\n\nVERBOSE HELP: extra debugging information shown here';
    }

    // `options` gives you each configured option with a renderHelpText()
    // method that respects per-option formatHelpText overrides — useful
    // for building fully custom help layouts.
    const userOptions = options.filter(
      (o) => o.key !== 'help' && o.key !== 'version'
    );
    output += `\n\n${userOptions.length} user-defined option(s)`;

    return output;
  })
  // #endregion help
  // #region version
  // Customize version output. Set the version string first, then
  // provide a callback that wraps the default output.
  .version('1.0.0')
  .version(({ renderDefaultVersion }) => {
    return `my-tool v${renderDefaultVersion()} (custom build)`;
  })
  // #endregion version
  // #region options
  .option('output', {
    type: 'string',
    description: 'Output directory',
    default: './dist',
    // Per-option help customization: the callback receives the option
    // config and the default text, and returns the replacement line.
    formatHelpText: (_option, _defaultText) => {
      return '  --output - Output directory [output directory path] [default: ./dist]';
    },
  })
  // #endregion options
  // #region catch
  // .catch() replaces the default validation-error handler, which
  // normally prints help + error messages and exits. This lets you
  // control what users see on bad input.
  .catch((error, { renderDefaultHelp, exit }) => {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    console.error(`\nRun "my-tool --help" for usage information.`);
    exit(1);
  })
  // #endregion catch
  .command('serve', {
    description: 'Start a development server',
    builder: (args) =>
      args.option('port', {
        type: 'number',
        description: 'Port to listen on',
        default: 3000,
      }),
    handler: (args) => {
      console.log(`Serving on port ${args.port}`);
    },
  })
  .command('build', {
    description: 'Build the project',
    handler: (args) => {
      console.log(`Building to ${args.output}`);
    },
  });
// #endregion cli

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
