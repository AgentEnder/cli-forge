// ---
// id: subcommand-suggestions
// title: Subcommand Suggestions
// hidden: true
// description: |
//   When strict mode is enabled and a user types an unknown positional that
//   looks like a mistyped subcommand, cli-forge prints a "did you mean?"
//   suggestion beneath the help text using Damerau-Levenshtein distance.
// test:
//   - name: "Suggests closest subcommand for a typo"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json subcommand-suggestions.ts sevre'
//     assertions:
//       stdout:
//         matches: "Unknown argument: sevre.*did you mean 'serve'"
//       exitCode: 1
//   - name: "Suggests closest subcommand at a nested level"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json subcommand-suggestions.ts db migrat'
//     assertions:
//       stdout:
//         matches: "Unknown argument: migrat.*did you mean 'migrate'"
//       exitCode: 1
//   - name: "Suggests closest option for an unknown flag"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json subcommand-suggestions.ts serve --prt'
//     assertions:
//       stdout:
//         matches: "Unknown argument: --prt.*did you mean '--port'"
//       exitCode: 1
// ---
import cliForge from 'cli-forge';

const cli = cliForge('subcommand-suggestions-example')
  .strict()
  .command('serve', {
    builder: (args) => args.option('port', { type: 'number', default: 3000 }),
    handler: (args) => {
      console.log(`Serving on port ${args.port}`);
    },
  })
  .command('build', {
    builder: (args) => args,
    handler: () => {
      console.log('Building...');
    },
  })
  .command('db', {
    builder: (args) =>
      args
        .command('migrate', {
          builder: (a) => a,
          handler: () => {
            console.log('Migrating database');
          },
        })
        .command('seed', {
          builder: (a) => a,
          handler: () => {
            console.log('Seeding database');
          },
        }),
    handler: () => {
      console.log('db: specify a subcommand');
    },
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
