import { resolve } from 'path';
import { defineConfig } from 'tsdown';

/** Rolldown plugin that resolves `#providers` to a concrete file. */
function resolveProviders(target) {
  return {
    name: 'resolve-providers',
    resolveId(source) {
      if (source === '#providers') return resolve(target);
      return null;
    },
  };
}

export default defineConfig([
  // Node builds (CJS + ESM) with declarations — preserve #providers as-is
  {
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
  },
  // Browser build (ESM only, single bundle) — resolves #providers to browser stubs
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outDir: 'dist/browser',
    dts: false,
    sourcemap: true,
    platform: 'browser',
    exports: false,
    plugins: [resolveProviders('src/lib/browser-providers.ts')],
  },
]);
