import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// Two named locations let one config provider write to two files based on
// per-option preference. `theme` is a user-level preference (USER), while
// `projectName` is project-specific (PROJECT). Both are scanned during
// reads so the merged config picks values from either place.
const baseDir = mkdtempSync(join(tmpdir(), 'named-locations-'));
const userPath = join(baseDir, 'user-config.json');
const projectPath = join(baseDir, 'project-config.json');

// #region named-locations
const app = cli('my-tool', {
  builder: (args) =>
    // Register the config provider FIRST so location names are accumulated
    // before options reference them. TS will then constrain
    // `defaultConfigLocation` to `'USER' | 'PROJECT'`.
    args
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
        locations: {
          USER: () => userPath,
          PROJECT: () => projectPath,
        },
        defaultLocation: 'PROJECT',
      })
      .option('theme', {
        type: 'string',
        default: 'light',
        // Pin theme writes to the USER location.
        defaultConfigLocation: 'USER',
      })
      .option('projectName', {
        type: 'string',
        // Falls through to the global defaultLocation (PROJECT).
      }),
})
  .command('init', {
    description: 'Write theme to USER and projectName to PROJECT',
    handler: async () => {
      await app.updateConfig({ theme: 'dark', projectName: 'cli-forge' });

      console.log(`USER exists: ${existsSync(userPath)}`);
      console.log(`PROJECT exists: ${existsSync(projectPath)}`);

      const userJson = JSON.parse(readFileSync(userPath, 'utf-8'));
      const projectJson = JSON.parse(readFileSync(projectPath, 'utf-8'));
      console.log(`USER theme: ${userJson.theme}`);
      console.log(`PROJECT projectName: ${projectJson.projectName}`);

      // theme should NOT appear in PROJECT, projectName should NOT appear in USER.
      console.log(`USER has projectName: ${'projectName' in userJson}`);
      console.log(`PROJECT has theme: ${'theme' in projectJson}`);
    },
  })
  .command('show', {
    description:
      'Read merged config from both locations (run after init) — theme comes from USER, projectName from PROJECT',
    handler: (args) => {
      console.log(`merged theme: ${args.theme}`);
      console.log(`merged projectName: ${args.projectName}`);
    },
  });
// #endregion named-locations

(async () => {
  try {
    // First invocation writes config files; second reads the merged values.
    await app.forge(['init']);
    await app.forge(['show']);
  } finally {
    rmSync(baseDir, { recursive: true, force: true });
  }
})();
