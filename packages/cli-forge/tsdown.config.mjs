import { resolve } from 'path';
import { defineConfig } from 'tsdown';

/** Rolldown plugin that resolves `#shell-deps` based on platform. */
function resolveShellDeps(platform) {
  const target =
    platform === 'browser'
      ? resolve('src/lib/browser-shell-deps.ts')
      : resolve('src/lib/node-shell-deps.ts');
  return {
    name: 'resolve-shell-deps',
    resolveId(source) {
      if (source === '#shell-deps') return target;
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
    plugins: [resolveShellDeps('node')],
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
    plugins: [resolveShellDeps('browser')],
  },
]);
