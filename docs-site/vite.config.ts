import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { defineConfig } from 'vite';
import { watchDocs, watchExamples } from './plugins';

export default defineConfig({
  plugins: [vike(), react(), tailwindcss(), watchDocs(), watchExamples()],
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
