import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/type-debug.ts',
  ],
  format: ['esm', 'cjs'],
  unbundle: true,
  root: 'src',
  outDir: 'dist',
  dts: {
    build: true,
    cjsReexport: true,
  },
  sourcemap: true,
  clean: true,
  fixedExtension: true,
  platform: 'node',
  exports: false,
});
