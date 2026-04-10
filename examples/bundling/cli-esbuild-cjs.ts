// #region import
// For esbuild CJS bundles, use `import = require(...)` instead of
// `import ... from`. This tells esbuild to resolve the "require"
// export condition, picking up the CJS entry from dual-format packages.
//
// `import ... from` would activate the "import" condition regardless
// of the output format, pulling in ESM files that may use import.meta.
import cliForge = require('cli-forge');
// #endregion import

const cli = cliForge.default('bundled-cli')
  .command('greet', {
    builder: (args) =>
      args.option('name', {
        type: 'string',
        default: 'World',
        description: 'Who to greet',
      }),
    handler: (args) => {
      console.log(`Hello, ${args.name}!`);
    },
  })
  .command('add', {
    builder: (args) =>
      args
        .option('a', { type: 'number', required: true })
        .option('b', { type: 'number', required: true }),
    handler: (args) => {
      console.log(`${args.a} + ${args.b} = ${args.a + args.b}`);
    },
  });

export default cli;

cli.forge();
