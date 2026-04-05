import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { type Plugin, defineConfig } from 'vite';
import { watchDocs, watchExamples } from './plugins';

// tsdown's ESM output includes a runtime helper that imports
// `createRequire` from `node:module`.  Vite's built-in browser
// external stub doesn't support named exports, so we provide a
// small stub that does.
const nodeModuleStub = resolve(__dirname, 'browser-stubs/node-module.js');

function stubNodeModule(): Plugin {
  return {
    name: 'stub-node-module',
    enforce: 'pre',
    resolveId(source, _importer, options) {
      if (options?.ssr) return null;
      if (source === 'node:module' || source === 'module') return nodeModuleStub;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [vike(), react(), tailwindcss(), watchDocs(), watchExamples(), stubNodeModule()],
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
