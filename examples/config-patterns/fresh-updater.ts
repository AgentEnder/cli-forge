import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// The updater-function form of updateConfig sees an empty object as the
// "current" config when the default-path file does not exist yet. Use this
// pattern when you need to read-modify-write but don't know whether the
// config already exists.
//
// NOTE: the `current` value passed to the updater is derived from whatever
// providers resolve from the current working directory. When the only file
// on disk lives at a framework-managed `default` path (outside cwd), the
// updater will keep seeing `{}` even after a previous write succeeded.
// For that case, prefer the partial-values form of `updateConfig` — the
// provider itself merges the partial into the existing file on disk.
const tempDir = mkdtempSync(join(tmpdir(), 'fresh-updater-'));
const configPath = join(tempDir, 'counter.json');

const app = cli('counter', {
  builder: (args) =>
    args
      .option('count', { type: 'number', default: 0 })
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'counter.json',
        default: () => configPath,
      }),
  handler: async () => {
    // Updater form on a fresh file — `current` is {}, so starting values
    // must come from fallbacks in the user code.
    await app.updateConfig((config) => {
      const existing = (config as { count?: number }).count ?? 0;
      config.count = existing + 1;
    });

    const first = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`after updater form count: ${first.count}`);

    // Partial-values form — the provider reads the on-disk file and merges,
    // so this correctly bumps the count from 1 to 2 regardless of cwd.
    await app.updateConfig({ count: first.count + 1 });

    const second = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`after partial form count: ${second.count}`);
  },
});

(async () => {
  try {
    await app.forge([]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
})();
