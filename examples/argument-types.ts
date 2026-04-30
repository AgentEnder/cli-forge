// ---
// id: argument-types
// title: Argument Types Reference
// description: |
//   A quick tour of the basic argument types CLI Forge supports out of the
//   box: string, number, boolean, array, and positional. Each type is
//   wrapped in a named region so it can be embedded into other guides.
//
//   For object-typed options see the
//   [object dot-notation example](/examples/object-dot-notation-simple) or the
//   [object arguments example](/examples/object-arguments). For multi-typed
//   flags see the [oneOf example](/examples/one-of-option).
// test:
//   - name: "Parses each argument type"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json argument-types.ts deploy production --name release --port 8080 --tags api db --verbose'
//     assertions:
//       stdout:
//         contains: 'name=release port=8080 verbose=true tags=api,db target=production'
//   - name: "Uses defaults when flags are omitted"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json argument-types.ts deploy staging'
//     assertions:
//       stdout:
//         contains: 'name=latest port=3000 verbose=false tags= target=staging'
// ---
import cli from 'cli-forge';

const app = cli('argument-types').command('deploy', {
  builder: (args) =>
    args
      // #region positional
      .positional('target', {
        type: 'string',
        required: true,
        description: 'Where to deploy (e.g. production, staging)',
      })
      // #endregion positional
      // #region string-option
      .option('name', {
        type: 'string',
        description: 'Release name',
        default: 'latest',
      })
      // #endregion string-option
      // #region number-option
      .option('port', {
        type: 'number',
        description: 'Port to listen on',
        default: 3000,
      })
      // #endregion number-option
      // #region array-option
      .option('tags', {
        type: 'array',
        items: 'string',
        description: 'Tags to apply (space, comma, or repeated flag)',
        default: [],
      })
      // #endregion array-option
      // #region boolean-option
      .option('verbose', {
        type: 'boolean',
        description: 'Enable verbose logging',
        default: false,
      })
      // #endregion boolean-option
      ,
  handler: (args) => {
    console.log(
      `name=${args.name} port=${args.port} verbose=${args.verbose} tags=${args.tags.join(',')} target=${args.target}`
    );
  },
});

export default app;

if (require.main === module) {
  (async () => {
    await app.forge();
  })();
}
