import { resolve } from 'path';
import { defineConfig } from 'tsdown';

/** Rolldown plugin that resolves `#shell-deps` to a concrete file. */
function resolveShellDeps(target) {
  return {
    name: 'resolve-shell-deps',
    resolveId(source) {
      if (source === '#shell-deps') return resolve(target);
      return null;
    },
  };
}

export default defineConfig([
  // Node builds (CJS + ESM) with declarations — preserve #shell-deps as-is
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
  // Browser build (ESM only, single bundle) — resolves #shell-deps to browser stubs
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outDir: 'dist/browser',
    dts: false,
    sourcemap: true,
    platform: 'browser',
    exports: false,
    plugins: [resolveShellDeps('src/lib/browser-shell-deps.ts')],
  },
]);
