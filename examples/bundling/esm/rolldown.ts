import { rolldown } from 'rolldown';

(async () => {
  const bundle = await rolldown({
    input: 'cli.ts',
    platform: 'node',
    resolve: { tsconfigFilename: '../tsconfig.json' },
  });
  await bundle.write({
    format: 'esm',
    file: 'dist/esm/rolldown.mjs',
    codeSplitting: false,
  });
  await bundle.close();
})();
