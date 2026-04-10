import esbuild from 'esbuild';

esbuild.buildSync({
  entryPoints: ['cli-esbuild-cjs.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/cjs/esbuild.cjs',
  tsconfig: '../tsconfig.json',
  logLevel: 'warning',
});
