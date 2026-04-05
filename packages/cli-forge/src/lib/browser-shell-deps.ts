/**
 * Browser-safe stubs for Node shell dependencies (readline, child_process).
 *
 * Selected via `#shell-deps` import condition in non-Node environments.
 * All exports are undefined — the interactive shell is Node-only and
 * guarded by `process.stdout.isTTY` checks at runtime.
 */
export const readline = undefined as any;
export const execSync = undefined as any;
export const spawnSync = undefined as any;
