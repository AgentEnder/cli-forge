import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (_format, entryName) => entryName,
    },
    outDir: 'dist',
    sourcemap: true,
    // Preserve module structure — don't bundle into a single file
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
      // Don't bundle dependencies — only our own source
      external: (id) => {
        if (id.startsWith('.') || id.startsWith('/') || id.startsWith('\0')) {
          return false;
        }
        return true;
      },
    },
    // Don't empty dist — tsc declarations go there too
    emptyOutDir: false,
  },
});
