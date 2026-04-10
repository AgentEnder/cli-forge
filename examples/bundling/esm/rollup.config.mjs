import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'cli.ts',
  plugins: [nodeResolve()],
  output: {
    format: 'esm',
    file: 'dist/esm/rollup.mjs',
    inlineDynamicImports: true,
  },
};
