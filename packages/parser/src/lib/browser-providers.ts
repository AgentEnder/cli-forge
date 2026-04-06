/**
 * Browser-safe provider implementations.
 *
 * This module is selected via package import conditions (`#providers`)
 * in non-Node environments.  It exports the same classes as
 * `node-providers.ts` but backed by the Memory implementations that
 * don't depend on Node builtins.
 */
import {
  MemoryEnvironmentProvider,
  MemoryFileSystemProvider,
} from './environment-provider';

export {
  MemoryEnvironmentProvider as NodeEnvironmentProvider,
  MemoryFileSystemProvider as NodeFileSystemProvider,
};
