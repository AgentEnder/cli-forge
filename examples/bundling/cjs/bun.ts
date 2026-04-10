const result = await Bun.build({
  entrypoints: ['cli.ts'],
  outdir: 'dist/cjs',
  target: 'node',
  format: 'cjs',
  naming: 'bun.cjs',
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
