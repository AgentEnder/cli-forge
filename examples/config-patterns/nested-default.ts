import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationProviders, cli } from 'cli-forge';

// A "user-level" default that lives several directories deep — the framework
// must create the intermediate folders (like `mkdir -p`) before writing.
//
// This example uses the `.config(provider, { default })` overload with the
// convenience `ConfigurationProviders.JsonFile` factory. The class-based
// `.config(ConfigurationFiles.JsonFileConfigLoader, { filename, default })`
// form also works, but the factory style is shorter when you don't need a
// custom transform.
const baseDir = mkdtempSync(join(tmpdir(), 'nested-default-'));
const configPath = join(baseDir, '.config', 'my-tool', 'settings.json');

const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      .config(ConfigurationProviders.JsonFile('settings.json'), {
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
