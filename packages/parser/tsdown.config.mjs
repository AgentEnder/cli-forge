import { resolve } from 'path';
import { defineConfig } from 'tsdown';

/** Rolldown plugin that resolves `#providers` based on platform. */
function resolveProviders(platform) {
  const target =
    platform === 'browser'
      ? resolve('src/lib/browser-providers.ts')
      : resolve('src/lib/node-providers.ts');
  return {
    name: 'resolve-providers',
    resolveId(source) {
      if (source === '#providers') return target;
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
    plugins: [resolveProviders('node')],
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
    plugins: [resolveProviders('browser')],
  },
]);
