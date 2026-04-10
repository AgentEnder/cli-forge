import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'cli.ts',
  plugins: [nodeResolve()],
  output: {
    format: 'cjs',
    file: 'dist/cjs/rollup.cjs',
    inlineDynamicImports: true,
  },
};
