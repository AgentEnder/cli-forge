import { readFileSync, writeFileSync } from 'fs';
import { ConfigurationProviders, cli } from 'cli-forge';

const appConfigPath = new URL('./app.config.json', import.meta.url).pathname;

// Save original for restoration
const originalAppConfig = readFileSync(appConfigPath, 'utf-8');

const app = cli('config-inheritance', {
  builder: (args) =>
    args
      .option('name', { type: 'string' })
      .option('greeting', { type: 'string' })
      .option('farewell', { type: 'string' })
      .config(ConfigurationProviders.JsonFile('app.config.json')),
  handler: async () => {
    // Update "name" (from app.config.json) and "farewell" (inherited from base via extends)
    // Both should be written to app.config.json since there's only one provider —
    // the provider that resolved is the only write target.
    await app.updateConfig({
      name: 'updated-name',
      farewell: 'updated-farewell',
    });

    const updatedAppConfig = JSON.parse(readFileSync(appConfigPath, 'utf-8'));

    console.log(`app.config.json name: ${updatedAppConfig.name}`);
    console.log(`app.config.json farewell: ${updatedAppConfig.farewell}`);
    console.log(`app.config.json extends: ${updatedAppConfig.extends}`);

    // Restore original
    writeFileSync(appConfigPath, originalAppConfig);
  },
});

(async () => {
  try {
    await app.forge();
  } catch {
    writeFileSync(appConfigPath, originalAppConfig);
    process.exit(1);
  }
})();
