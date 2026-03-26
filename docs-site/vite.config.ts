import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { type Plugin, defineConfig } from 'vite';
import { watchDocs, watchExamples } from './plugins';

// Node built-in modules that cli-forge/parser reference internally.
// For the CLIENT bundle these are resolved to an empty stub so the
// library's runtime guards see `undefined` methods and gracefully degrade.
// SSR is unaffected — packages are loaded via Node's native resolution.
const nodeBuiltins = new Set([
  'fs', 'node:fs',
  'fs/promises', 'node:fs/promises',
  'path', 'node:path',
  'os', 'node:os',
  'util', 'node:util',
  'child_process', 'node:child_process',
  'readline', 'node:readline',
]);

const emptyStub = resolve(__dirname, 'browser-stubs/empty.js');

/**
 * Vite plugin that stubs Node built-in modules for the client bundle only.
 * During SSR the real Node modules are used.
 */
function nodeBuiltinsClientStub(): Plugin {
  return {
    name: 'node-builtins-client-stub',
    enforce: 'pre',
    resolveId(source, _importer, options) {
      if (options?.ssr) return null;
      if (nodeBuiltins.has(source)) return emptyStub;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    vike(),
    react(),
    tailwindcss(),
    watchDocs(),
    watchExamples(),
    nodeBuiltinsClientStub(),
  ],
  build: {
    rollupOptions: {
      external: ['/pagefind/pagefind.js'],
    },
  },
  ssr: {
    external: [
      'functional-examples',
      'gray-matter',
      'shiki',
      // cli-forge packages use Node APIs that must be real during SSR
      'cli-forge',
      '@cli-forge/parser',
    ],
  },
  base: process.env.BASE_URL || '/cli-forge',
});
