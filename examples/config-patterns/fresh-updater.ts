import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// The updater-function form of `updateConfig` reads the current config
// from the on-disk file before invoking the callback. On the first run
// this means the updater sees an empty object (no file exists yet); on
// subsequent runs it sees the previously persisted state — even when the
// file lives at a framework-managed `default` path outside cwd.
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
    // First call — no file exists. The updater gets `{}` as current, so
    // `config.count` is undefined and we fall back to 0.
    await app.updateConfig((config) => {
      const existing = (config as { count?: number }).count ?? 0;
      config.count = existing + 1;
    });

    const first = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`first call count: ${first.count}`);

    // Second call — the file now exists at the default path and the
    // updater sees the previously persisted value, so this correctly
    // increments from 1 to 2 without needing any manual plumbing.
    await app.updateConfig((config) => {
      const existing = (config as { count?: number }).count ?? 0;
      config.count = existing + 1;
    });

    const second = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`second call count: ${second.count}`);
  },
});

(async () => {
  try {
    await app.forge([]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
})();
