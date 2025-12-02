/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

export default () => {
  if (globalThis.packageJsonsToReset) {
    const fs = require('fs');
    for (const [path, content] of Object.entries(
      globalThis.packageJsonsToReset
    )) {
      fs.writeFileSync(path, content);
    }
  }
  if ((global as any).stopLocalRegistry) {
    (global as any).stopLocalRegistry();
  }
};
