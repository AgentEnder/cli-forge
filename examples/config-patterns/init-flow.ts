import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// Simulate a fresh project directory with no config file on disk.
const tempDir = mkdtempSync(join(tmpdir(), 'init-flow-'));
const configPath = join(tempDir, 'my-tool.config.json');

// #region init-flow
const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      .option('lang', { type: 'string', default: 'en' })
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
        locations: { PROJECT: () => configPath },
        defaultLocation: 'PROJECT',
      }),
  handler: () => undefined,
}).command('init', {
  description:
    'Bootstrap a fresh config file and then update a value in place',
  handler: async () => {
    // First write: no file exists on disk, so the framework falls through
    // to the PROJECT named location and creates the file.
    console.log(`before init: exists=${existsSync(configPath)}`);
    await app.updateConfig({ theme: 'dark', lang: 'fr' });

    const afterInit = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`after init: theme=${afterInit.theme} lang=${afterInit.lang}`);

    // Second write: the file now exists at the PROJECT location. The JSON
    // file loader reads the existing content from that path, merges the
    // partial update in, and writes it back — so `lang` is preserved
    // without having to pass it through the update.
    await app.updateConfig({ theme: 'system' });

    const afterUpdate = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(
      `after update: theme=${afterUpdate.theme} lang=${afterUpdate.lang}`
    );
  },
});
// #endregion init-flow

(async () => {
  try {
    await app.forge(['init']);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
})();
