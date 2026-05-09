import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { ConfigurationFiles, cli } from 'cli-forge';

const tempDir = mkdtempSync(join(tmpdir(), 'update-usage-'));

const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      .option('lang', { type: 'string', default: 'en' })
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
        locations: {
          PROJECT: () => join(tempDir, 'my-tool.config.json'),
        },
        defaultLocation: 'PROJECT',
      }),
  // #region update-config
  handler: async (args) => {
    // Partial update — only the specified keys change
    await app.updateConfig({ theme: 'dark' });

    // Updater function — read-modify-write
    await app.updateConfig((config) => {
      config.lang = config.lang === 'en' ? 'fr' : 'en';
    });

    console.log(`theme: ${args.theme}`);
    console.log(`lang: ${args.lang}`);
  },
  // #endregion update-config
});

(async () => {
  try {
    await app.forge();
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
})();
