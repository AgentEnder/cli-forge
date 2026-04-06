/**
 * Re-exports Node shell dependencies for the interactive shell.
 *
 * Selected via `#shell-deps` import condition in Node environments.
 */
import * as _readline from 'readline';
import { execSync as _execSync, spawnSync as _spawnSync } from 'child_process';

export const readline = _readline;
export const execSync = _execSync;
export const spawnSync = _spawnSync;
