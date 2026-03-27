import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        middleware: resolve(__dirname, 'src/middleware.ts'),
        'middleware/zod': resolve(__dirname, 'src/middleware/zod.ts'),
        'prompt-providers/clack': resolve(
          __dirname,
          'src/prompt-providers/clack.ts'
        ),
        'bin/cli': resolve(__dirname, 'src/bin/cli.ts'),
      },
      formats: ['es', 'cjs'],
    },
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: [
        {
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].mjs',
        },
        {
          format: 'cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].cjs',
          exports: 'named',
        },
      ],
      external: (id) => {
        if (id.startsWith('.') || id.startsWith('/') || id.startsWith('\0')) {
          return false;
        }
        return true;
      },
    },
    emptyOutDir: false,
  },
});
