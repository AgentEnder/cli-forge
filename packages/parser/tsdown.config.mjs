import { resolve } from 'path';
import { defineConfig } from 'tsdown';

/**
 * Rolldown plugin for the browser build that swaps the Node provider
 * module for the browser stub.
 */
function browserProviders() {
  return {
    name: 'browser-providers',
    resolveId(source, importer) {
      if (
        importer &&
        (source === './node-providers' || source.endsWith('/node-providers'))
      ) {
        return resolve('src/lib/browser-providers.ts');
      }
      return null;
    },
  };
}

export default defineConfig([
  // Node builds (CJS + ESM) with declarations
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
  // Browser build (ESM only, single bundle)
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outDir: 'dist/browser',
    dts: false,
    sourcemap: true,
    platform: 'browser',
    exports: false,
    plugins: [browserProviders()],
  },
]);
