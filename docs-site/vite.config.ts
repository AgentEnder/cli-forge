import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { type Plugin, defineConfig } from 'vite';
import { watchDocs, watchExamples } from './plugins';

// Node built-in modules referenced by cli-forge/parser ESM builds.
// Vite's built-in browser-external stub doesn't support named exports,
// so we resolve these to our own stub that does.
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
  plugins: [vike(), react(), tailwindcss(), watchDocs(), watchExamples(), nodeBuiltinsClientStub()],
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
    ],
  },
  base: process.env.BASE_URL || '/cli-forge',
  define: {
    'import.meta.env.PREVIEW_PATH': JSON.stringify(process.env.PREVIEW_PATH || ''),
  },
});
