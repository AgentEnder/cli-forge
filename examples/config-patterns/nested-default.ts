import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// A "user-level" default that lives several directories deep — the framework
// must create the intermediate folders (like `mkdir -p`) before writing.
const baseDir = mkdtempSync(join(tmpdir(), 'nested-default-'));
const configPath = join(baseDir, '.config', 'my-tool', 'settings.json');

const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'settings.json',
        default: () => configPath,
      }),
  handler: async () => {
    console.log(`before: exists=${existsSync(configPath)}`);
    await app.updateConfig({ theme: 'dark' });

    console.log(`after: exists=${existsSync(configPath)}`);
    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`written theme: ${written.theme}`);
  },
});

(async () => {
  try {
    await app.forge([]);
  } finally {
    rmSync(baseDir, { recursive: true, force: true });
  }
})();
