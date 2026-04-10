const result = await Bun.build({
  entrypoints: ['cli.ts'],
  outdir: 'dist/esm',
  target: 'node',
  format: 'esm',
  naming: 'bun.mjs',
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
