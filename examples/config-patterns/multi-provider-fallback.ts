import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// Demonstrates multi-provider fallback: a project config provider is
// preferred but has no file on disk, so the user-level fallback provider's
// `default` path is used for writes instead.
const tempDir = mkdtempSync(join(tmpdir(), 'multi-provider-fallback-'));
const userConfigPath = join(tempDir, '.config', 'my-tool', 'config.json');

const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      // Project-level — preferred, but not present on disk in this example.
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
      })
      // User-level fallback — has a default path so init-style writes work.
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.json',
        default: () => userConfigPath,
      }),
  handler: async () => {
    console.log(`before: user exists=${existsSync(userConfigPath)}`);
    await app.updateConfig({ theme: 'dark' });

    console.log(`after: user exists=${existsSync(userConfigPath)}`);
    const written = JSON.parse(readFileSync(userConfigPath, 'utf-8'));
    console.log(`user config theme: ${written.theme}`);
  },
});

(async () => {
  try {
    await app.forge([]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
})();
