/**
 * Automatic Type Acquisition (ATA) for the playground.
 *
 * When the editor content includes `import … from 'some-package'`,
 * ATA fetches the package's type declarations from the CDN and
 * registers them with Monaco so that IntelliSense, hover types,
 * and error checking work for third-party libraries.
 *
 * Uses the `@typescript/ata` package, the same engine that powers
 * the TypeScript Playground on typescriptlang.org.
 */

import type { Monaco } from '@monaco-editor/react';

interface AtaInstance {
  acquireType: (code: string) => void;
  dispose: () => void;
}

let ataInstance: AtaInstance | null = null;

/**
 * Lazily initialize and return the ATA singleton. We dynamically
 * import both `@typescript/ata` and `typescript` so they are only
 * loaded in the browser (never during SSR).
 */
async function createAtaInstance(monaco: Monaco): Promise<AtaInstance> {
  const [{ setupTypeAcquisition }, ts] = await Promise.all([
    import('@typescript/ata'),
    import('typescript'),
  ]);

  const defaults = monaco.languages.typescript.typescriptDefaults;

  // Track which paths we've already registered so we don't
  // call addExtraLib for the same file twice.
  const registered = new Set<string>();

  const acquireType = setupTypeAcquisition({
    projectName: 'cli-forge-playground',
    typescript: ts,
    logger: {
      log: () => {
        /* silent */
      },
      error: console.error,
      groupCollapsed: () => {
        /* silent */
      },
      groupEnd: () => {
        /* silent */
      },
    },
    delegate: {
      receivedFile: (code: string, path: string) => {
        if (registered.has(path)) return;
        registered.add(path);
        defaults.addExtraLib(code, `file://${path}`);
      },
    },
  });

  return {
    acquireType: (code: string) => {
      // Fire-and-forget; ATA runs asynchronously.
      acquireType(code);
    },
    dispose: () => {
      registered.clear();
    },
  };
}

/**
 * Initialize ATA for a Monaco instance. Call this from
 * `onMount` after the editor is ready.
 *
 * Returns a callback that should be called whenever the editor
 * content changes (typically debounced).
 */
export async function initAta(
  monaco: Monaco
): Promise<(code: string) => void> {
  if (!ataInstance) {
    ataInstance = await createAtaInstance(monaco);
  }
  return ataInstance.acquireType;
}
