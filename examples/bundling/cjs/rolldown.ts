import { rolldown } from 'rolldown';

(async () => {
  const bundle = await rolldown({
    input: 'cli.ts',
    platform: 'node',
    resolve: { tsconfigFilename: '../tsconfig.json' },
  });
  await bundle.write({
    format: 'cjs',
    file: 'dist/cjs/rolldown.cjs',
    codeSplitting: false,
  });
  await bundle.close();
})();
