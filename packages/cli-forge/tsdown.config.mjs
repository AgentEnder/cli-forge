import { defineConfig } from 'tsdown';
import { createTriPublishConfig } from '../../tools/scripts/tsdown-tri-publish.mjs';

export default defineConfig(
  createTriPublishConfig({
    entry: 'src/**/*.ts',
    exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    browserAlias: {
      'node-shell-deps': 'src/browser/shell-deps.ts',
      'interactive-shell': 'src/browser/interactive-shell.ts',
      'async-context': 'src/browser/async-context.ts',
    },
  })
);
