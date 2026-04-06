import { resolve } from 'path';
import { defineConfig } from 'tsdown';

/**
 * Rolldown plugin for the browser build that swaps the Node shell-deps
 * module for the browser stub.
 */
function browserShellDeps() {
  return {
    name: 'browser-shell-deps',
    resolveId(source, importer) {
      if (
        importer &&
        (source === './node-shell-deps' ||
          source.endsWith('/node-shell-deps'))
      ) {
        return resolve('src/lib/browser-shell-deps.ts');
      }
      return null;
    },
  };
}

export default defineConfig([
  // Node builds (CJS + ESM) with declarations
  {
    entry: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],
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
    plugins: [browserShellDeps()],
  },
]);
