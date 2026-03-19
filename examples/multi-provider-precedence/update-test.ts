import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigurationProviders, cli } from 'cli-forge';

const appConfigPath = join(__dirname, 'app.config.json');
const packageJsonPath = join(__dirname, 'package.json');

// Save originals for restoration
const originalAppConfig = readFileSync(appConfigPath, 'utf-8');
const originalPackageJson = readFileSync(packageJsonPath, 'utf-8');

const app = cli('multi-provider', {
  builder: (args) =>
    args
      .option('name', { type: 'string' })
      .option('greeting', { type: 'string' })
      .option('farewell', { type: 'string' })
      .config(ConfigurationProviders.PackageJson('my-app'))
      .config(ConfigurationProviders.JsonFile('app.config.json')),
  handler: async () => {
    // Update "greeting" (owned by JsonFile) and "farewell" (owned by PackageJson)
    await app.updateConfig({
      greeting: 'updated-greeting',
      farewell: 'updated-farewell',
    });

    // Read files back and report which file was modified
    const updatedAppConfig = JSON.parse(readFileSync(appConfigPath, 'utf-8'));
    const updatedPackageJson = JSON.parse(
      readFileSync(packageJsonPath, 'utf-8')
    );

    console.log(`app.config.json greeting: ${updatedAppConfig.greeting}`);
    console.log(`app.config.json farewell: ${updatedAppConfig.farewell ?? 'not present'}`);
    console.log(`package.json farewell: ${updatedPackageJson['my-app'].farewell}`);
    console.log(`package.json greeting: ${updatedPackageJson['my-app'].greeting ?? 'not present'}`);

    // Restore originals
    writeFileSync(appConfigPath, originalAppConfig);
    writeFileSync(packageJsonPath, originalPackageJson);
  },
});

(async () => {
  try {
    await app.forge();
  } catch {
    // Restore originals on error
    writeFileSync(appConfigPath, originalAppConfig);
    writeFileSync(packageJsonPath, originalPackageJson);
    process.exit(1);
  }
})();
