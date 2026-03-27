/**
 * Rollup plugin that rewrites static imports of Node builtins into
 * dynamic `import()` calls wrapped in try/catch for the **ESM output
 * only**.  CJS output is unaffected (Rollup emits `require()` which
 * works in Node).
 *
 * In the ESM output:
 * ```
 * import * as fs from 'fs';
 * ```
 * becomes:
 * ```
 * let fs; try { fs = await import('fs'); } catch {}
 * ```
 *
 * This means:
 * - **Node ESM**: `import('fs')` resolves normally — full functionality.
 * - **Browser ESM**: `import('fs')` throws — the catch swallows it and
 *   the variable is `undefined`.  Code guarded by `isNodeLike()` or
 *   provider checks handles this gracefully.
 * - **CJS**: Not affected — Rollup uses `require()` which works.
 *
 * Usage in vite.config.ts:
 * ```ts
 * import { nodeBuiltinsEsm } from '../../tools/scripts/rollup-plugin-node-builtins-esm';
 * plugins: [nodeBuiltinsEsm()]
 * ```
 */
import { builtinModules } from 'module';

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

export function nodeBuiltinsEsm() {
  return {
    name: 'node-builtins-esm',
    // renderChunk runs after Rollup has generated the output code.
    // We only transform ESM chunks.
    renderChunk(code, _chunk, options) {
      if (options.format !== 'es') return null;

      // Match: import * as <name> from '<builtin>';
      //        import { <names> } from '<builtin>';
      //        import <name> from '<builtin>';
      const importRe =
        /^import\s+(?:(\*\s+as\s+\w+)|(\{[^}]+\})|(\w+))\s+from\s+["']([^"']+)["'];?\s*$/gm;

      let transformed = code;
      let hasChanges = false;

      transformed = transformed.replace(
        importRe,
        (match, starAs, named, defaultImport, specifier) => {
          if (!builtins.has(specifier)) return match;
          hasChanges = true;

          if (starAs) {
            // import * as fs from 'fs';
            // → let fs; try { fs = await import('fs'); } catch {}
            const varName = starAs.replace(/^\*\s+as\s+/, '');
            return `let ${varName}; try { ${varName} = await import("${specifier}"); } catch {}`;
          }

          if (named) {
            // import { readFileSync, join as j } from 'fs';
            // → let __fs; try { __fs = await import('fs'); } catch {}
            //   const { readFileSync, join: j } = __fs ?? {};
            // Note: ESM `as` → destructuring `:` rename
            const tempVar = `__node_${specifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const destructure = named.replace(/\bas\b/g, ':');
            return (
              `let ${tempVar}; try { ${tempVar} = await import("${specifier}"); } catch {}\n` +
              `const ${destructure} = ${tempVar} ?? {};`
            );
          }

          if (defaultImport) {
            // import fs from 'fs';
            // → let fs; try { const __m = await import('fs'); fs = __m.default ?? __m; } catch {}
            return `let ${defaultImport}; try { const __m = await import("${specifier}"); ${defaultImport} = __m.default ?? __m; } catch {}`;
          }

          return match;
        }
      );

      return hasChanges ? { code: transformed, map: null } : null;
    },
  };
}
