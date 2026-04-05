// Stub for `node:module` in browser environments.
// tsdown's ESM output uses `createRequire(import.meta.url)` as a
// runtime helper.  In the browser this is a no-op — the `require`
// it creates will never be called since the optional dependencies
// (markdown-factory, etc.) aren't available.
export function createRequire() {
  return function require() {
    throw new Error('require() is not available in this environment');
  };
}
