import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/cli-forge',
  resolve: {
    alias: {
      '#shell-deps': resolve(__dirname, 'src/lib/node-shell-deps.ts'),
    },
  },

  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/cli-forge',
      provider: 'v8',
    },
  },
});
