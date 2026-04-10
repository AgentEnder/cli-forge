import esbuild from 'esbuild';

esbuild.buildSync({
  entryPoints: ['cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/esm/esbuild.mjs',
  tsconfig: '../tsconfig.json',
  logLevel: 'warning',
});
