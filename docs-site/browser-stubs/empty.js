// Empty stub for Node.js built-in modules in browser environments.
// When cli-forge/parser ESM imports are processed by Vite for the
// client bundle, Node builtins resolve to this module.  It uses a
// Proxy so that any named import (e.g. `import { readFileSync }`)
// resolves to `undefined` at runtime rather than causing a Rollup
// "is not exported" error.
const handler = {
  get(_target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return stub;
    return undefined;
  },
};
const stub = new Proxy({}, handler);
export default stub;

// Re-export as named so ESM named imports work
export const existsSync = undefined;
export const readFileSync = undefined;
export const writeFileSync = undefined;
export const writeFile = undefined;
export const appendFileSync = undefined;
export const readdirSync = undefined;
export const mkdirSync = undefined;
export const join = undefined;
export const resolve = undefined;
export const dirname = undefined;
export const basename = undefined;
export const isAbsolute = undefined;
export const relative = undefined;
export const createInterface = undefined;
export const moveCursor = undefined;
export const clearScreenDown = undefined;
export const execSync = undefined;
export const spawnSync = undefined;
export const homedir = undefined;
export const inspect = undefined;
