import { builtinModules } from 'module';
import { isAbsolute, resolve } from 'path';
import { defineConfig } from 'vite';

// Rollup plugin: rewrite Node builtin imports to dynamic import() in ESM output.
// CJS output keeps require(). Browser ESM catches the failed import gracefully.
const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

function nodeBuiltinsEsm() {
  const importRe =
    /^import\s+(?:(\*\s+as\s+\w+)|(\{[^}]+\})|(\w+))\s+from\s+["']([^"']+)["'];?\s*$/gm;
  return {
    name: 'node-builtins-esm',
    renderChunk(code: string, _chunk: unknown, options: { format: string }) {
      if (options.format !== 'es') return null;
      let hasChanges = false;
      const transformed = code.replace(
        importRe,
        (match, starAs, named, defaultImport, specifier) => {
          if (!builtins.has(specifier)) return match;
          hasChanges = true;
          if (starAs) {
            const v = starAs.replace(/^\*\s+as\s+/, '');
            return `let ${v}; try { ${v} = await import("${specifier}"); } catch {}`;
          }
          if (named) {
            const tmp = `__node_${specifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
            return `let ${tmp}; try { ${tmp} = await import("${specifier}"); } catch {}\nconst ${named.replace(/\bas\b/g, ':')} = ${tmp} ?? {};`;
          }
          if (defaultImport) {
            return `let ${defaultImport}; try { const __m = await import("${specifier}"); ${defaultImport} = __m.default ?? __m; } catch {}`;
          }
          return match;
        }
      );
      return hasChanges ? { code: transformed, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [nodeBuiltinsEsm()],
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (_format, entryName) => entryName,
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
        // Keep our own source files (relative, absolute, or Rollup internals)
        if (
          id.startsWith('.') ||
          id.startsWith('\0') ||
          resolve(__dirname, 'src') === id ||
          id.includes('/src/') ||
          id.includes('\\src\\') ||
          isAbsolute(id)
        ) {
          return false;
        }
        return true;
      },
    },
    emptyOutDir: false,
  },
});
