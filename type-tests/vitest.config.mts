import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 30000, // Type checking can be slow
  },
  resolve: {
    alias: {
      '@cli-forge/parser': path.resolve(__dirname, '../packages/parser/dist'),
      'cli-forge': path.resolve(__dirname, '../packages/cli-forge/dist'),
    },
  },
});
