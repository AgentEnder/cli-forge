import { join } from 'path';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { ConfigurationFiles, cli } from 'cli-forge';

// Create a temp directory to simulate a fresh project with no config file
const tempDir = mkdtempSync(join(tmpdir(), 'default-config-'));

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
  handler: async () => {
    // Write config with defaults — file doesn't exist yet
    await app.updateConfig({ theme: 'dark', lang: 'fr' });

    // Read back the created file
    const configPath = join(tempDir, 'my-tool.config.json');
    const written = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log(`theme: ${written.theme}`);
    console.log(`lang: ${written.lang}`);

    // Clean up
    rmSync(tempDir, { recursive: true });
  },
});

(async () => await app.forge())();
