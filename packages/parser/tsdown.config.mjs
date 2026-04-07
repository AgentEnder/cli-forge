import { defineConfig } from 'tsdown';
import { createTriPublishConfig } from '../../tools/scripts/tsdown-tri-publish.mjs';

export default defineConfig(
  createTriPublishConfig({
    entry: 'src/**/*.ts',
    exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/type-debug.ts'],
    browserAlias: {
      'node-providers': 'src/browser/providers.ts',
    },
  })
);
